"""Pure claim-resolution logic for the verification registry.

Every function here is a pure derivation over (claims, evidence, previous state). Nothing
calls an LLM, nothing reads the network, and nothing writes to a repository. Network and
filesystem access lives behind the ``EvidenceProvider`` protocol in ``providers.py`` so the
resolution rules can be tested without either.

Determinism rules this module enforces:

* ``verified_at`` is always the evidence's own timestamp (``build.at``, ``test.at``,
  ``head.committed_at``, ``pushed_at``) -- never wall-clock time.
* ``as_of`` is the newest evidence timestamp in the run, so two runs over identical inputs
  produce byte-identical output (idempotency).
* a claim whose evidence cannot be resolved carries its previous record forward unchanged
  rather than being erased or downgraded (failure preservation).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol

SCHEMA_VERSION = 1
STATE_SCHEMA = "skb.verification-state/v1"
PROJECTION_SCHEMA = "skb.verification-projection/v1"
DEFAULT_MAX_AGE_DAYS = 30

STATUS_VERIFIED = "verified"
STATUS_UNVERIFIED = "unverified"
STATUS_STALE = "stale"
STATUS_SUPERSEDED = "superseded"
STATUS_FAILED = "failed"
STATUS_HUMAN = "human_attested"

STATUS_ORDER = (
    STATUS_VERIFIED,
    STATUS_FAILED,
    STATUS_STALE,
    STATUS_UNVERIFIED,
    STATUS_SUPERSEDED,
    STATUS_HUMAN,
)

CLASS_EVIDENCE = "evidence_backed"
CLASS_POSITIONING = "positioning"

RESOLVABLE_EVIDENCE_TYPES = ("repository_state", "public_repository", "github_pages")


class EvidenceProvider(Protocol):
    """Anything that can resolve one evidence specification to a record, or None."""

    def resolve(self, evidence_type: str, spec: dict[str, Any]) -> dict[str, Any] | None:
        ...


# ---------------------------------------------------------------------------
# loading
# ---------------------------------------------------------------------------

def load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def load_claims(path: Path) -> dict[str, Any]:
    data = load_json(path)
    if data is None:
        raise SystemExit(f"claims file not found: {path}")
    if not isinstance(data.get("claims"), list):
        raise SystemExit(f"claims file has no claims list: {path}")
    return data


def load_previous_state(path: Path) -> dict[str, Any]:
    data = load_json(path)
    if not data or not isinstance(data.get("claims"), list):
        return {"claims": []}
    return data


def previous_by_id(previous: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for record in previous.get("claims", []):
        if isinstance(record, dict) and record.get("id"):
            out[record["id"]] = record
    return out


def load_previous_state_from_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    """Wrap a bare list of records as a previous-state document (test/fixture helper)."""
    return {"claims": records}


# ---------------------------------------------------------------------------
# time helpers
# ---------------------------------------------------------------------------

def parse_iso(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def age_days(at: Any, now: datetime | None) -> int | None:
    """Whole days between the evidence timestamp and now; None when unknowable."""
    dt = parse_iso(at)
    if dt is None:
        return None
    if now is None:
        return None
    return max(0, (now - dt).days)


def newest_iso(values: list[Any]) -> str | None:
    best: datetime | None = None
    for value in values:
        dt = parse_iso(value)
        if dt is not None and (best is None or dt > best):
            best = dt
    return best.strftime("%Y-%m-%dT%H:%M:%SZ") if best else None


# ---------------------------------------------------------------------------
# supersession
# ---------------------------------------------------------------------------

def supersession_map(claims: list[dict[str, Any]]) -> dict[str, str]:
    """claim id -> id of the claim that supersedes it."""
    out: dict[str, str] = {}
    for claim in claims:
        target = claim.get("supersedes")
        if isinstance(target, str) and target:
            out[target] = claim["id"]
    return out


# ---------------------------------------------------------------------------
# resolution
# ---------------------------------------------------------------------------

def resolve_evidence(claim: dict[str, Any], provider: EvidenceProvider) -> dict[str, Any] | None:
    """Ask the provider for this claim's evidence; None means 'could not resolve'."""
    if claim.get("class") == CLASS_POSITIONING:
        return None
    spec = claim.get("evidence") or {}
    etype = spec.get("type")
    if etype not in RESOLVABLE_EVIDENCE_TYPES:
        return None
    try:
        return provider.resolve(etype, spec)
    except Exception:
        # A provider failure must never abort the whole verification run: the claim falls
        # through to the carry-forward / unverified path below.
        return None


def classify(
    claim: dict[str, Any],
    evidence: dict[str, Any] | None,
    superseded_by: str | None,
    now: datetime | None,
) -> tuple[str, str | None, dict[str, Any] | None]:
    """Return (status, verified_at, evidence_record)."""
    if claim.get("class") == CLASS_POSITIONING:
        return STATUS_HUMAN, None, None

    if superseded_by is not None:
        # Supersession is recorded on the newer claim; this one keeps its evidence so the
        # history of what was believed stays readable.
        return STATUS_SUPERSEDED, (evidence or {}).get("at"), evidence

    if evidence is None:
        return STATUS_UNVERIFIED, None, None

    expect = (claim.get("evidence") or {}).get("expect")
    field = (claim.get("evidence") or {}).get("field")
    value = evidence.get("value")

    if expect is None or value is None or value == "unknown" or parse_iso(evidence.get("at")) is None:
        # The canonical source exists but honestly reports no result (e.g. a docs-only
        # repository with no test suite). That is "cannot verify", not "known broken".
        status = STATUS_UNVERIFIED
    elif field == "phases.completed" and isinstance(value, str):
        completed_set = {p.strip() for p in value.split(",") if p.strip() and p.strip() != "none"}
        status = STATUS_VERIFIED if (expect in completed_set or value == expect) else STATUS_FAILED
    elif expect is not None and value != expect:
        status = STATUS_FAILED
    else:
        status = STATUS_VERIFIED

    if status == STATUS_VERIFIED:
        max_age = (claim.get("freshness") or {}).get("max_age_days", DEFAULT_MAX_AGE_DAYS)
        days = age_days(evidence.get("at"), now)
        if days is not None and days > max_age:
            status = STATUS_STALE

    return status, evidence.get("at"), evidence


def build_state(
    claims_doc: dict[str, Any],
    provider: EvidenceProvider,
    previous: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Resolve every claim into the canonical verification state document."""
    claims = claims_doc.get("claims", [])
    prior = previous_by_id(previous or {"claims": []})
    superseded = supersession_map(claims)

    records: list[dict[str, Any]] = []
    for claim in claims:
        claim_id = claim.get("id")
        if not claim_id:
            continue
        prior_record = prior.get(claim_id)
        evidence = resolve_evidence(claim, provider)
        carried_forward = False
        if evidence is None and prior_record:
            # Failure preservation: keep the last known good evidence instead of erasing
            # it. Its original timestamp ages the claim into `stale` honestly.
            evidence = prior_record.get("evidence")
            carried_forward = evidence is not None

        status, verified_at, evidence_record = classify(
            claim, evidence, superseded.get(claim_id), now
        )

        record: dict[str, Any] = {
            "id": claim_id,
            "class": claim.get("class"),
            "status": status,
            "verified_at": verified_at,
        }
        if claim.get("public"):
            record["public"] = True
        if evidence_record is not None:
            record["evidence"] = evidence_record
        if carried_forward:
            record["carried_forward"] = True
        if superseded.get(claim_id):
            record["superseded_by"] = superseded[claim_id]
        records.append(record)

    return {
        "schema": STATE_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "authority": claims_doc.get("authority"),
        "as_of": newest_iso([r.get("evidence", {}).get("at") for r in records if r.get("evidence")]),
        "summary": summarize(records),
        "claims": records,
    }


def summarize(records: list[dict[str, Any]]) -> dict[str, int]:
    counts = {status: 0 for status in STATUS_ORDER}
    for record in records:
        status = record.get("status")
        if status in counts:
            counts[status] += 1
    return counts


# ---------------------------------------------------------------------------
# public-safe projection
# ---------------------------------------------------------------------------

def is_public_safe(record: dict[str, Any]) -> bool:
    """A claim reaches the public Portfolio only when it is flagged public AND its evidence
    resolved against a public repository. `public: false` in the registry, or evidence that
    carries no positive public marker, keeps a claim internal."""
    if not record.get("public"):
        return False
    # Retain unavailable evidence internally, but do not republish old visibility
    # assertions when the source cannot currently be resolved.
    if record.get("carried_forward"):
        return False
    evidence = record.get("evidence")
    if evidence is None:
        # `human_attested` / `unverified` positioning claims carry no evidence and are
        # publishable text; anything else without evidence is an internal gap.
        return record.get("status") == STATUS_HUMAN
    # Positive public eligibility is required for all evidence, including groups.
    # Unknown visibility is never equivalent to public. Never ship real private
    # inventory lists in the consumer as a substitute for this boundary.
    if evidence.get("public") is not True:
        return False
    nested = evidence.get("repositories", [])
    if not isinstance(nested, list):
        return False
    if any(not isinstance(item, dict) or item.get("public") is not True
           or not item.get("repository") for item in nested):
        return False
    return True


def build_projection(state: dict[str, Any]) -> dict[str, Any]:
    """Project the canonical state down to only what a public repository may ship."""
    public_claims = [r for r in state.get("claims", []) if is_public_safe(r)]
    return {
        "schema": PROJECTION_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "as_of": state.get("as_of"),
        "summary": summarize(public_claims),
        "claims": public_claims,
    }


# ---------------------------------------------------------------------------
# minimal summary (for chrome that must not ship the whole projection)
# ---------------------------------------------------------------------------

SUMMARY_SCHEMA = "skb.verification-summary/v1"


def build_summary(projection: dict[str, Any]) -> dict[str, Any]:
    """Reduce a projection to the few numbers a footer can render.

    Deliberately tiny and free of any claim text, repository slug or URL: a site's
    shared chrome imports this instead of the full projection, so the public
    evidence detail stays on the page that actually shows it rather than in every
    route's JavaScript bundle.

    Deterministic: every value is derived from the projection, never from the
    clock, so repeated runs are byte-identical.
    """
    summary = projection.get("summary", {}) or {}
    machine = [c for c in projection.get("claims", []) if c.get("class") == CLASS_EVIDENCE]
    human = [c for c in projection.get("claims", []) if c.get("class") == CLASS_POSITIONING]
    last_verified = newest_iso([c.get("verified_at") for c in machine])
    return {
        "schema": SUMMARY_SCHEMA,
        "schema_version": SCHEMA_VERSION,
        "as_of": projection.get("as_of"),
        "verified": summary.get(STATUS_VERIFIED, 0),
        "failed": summary.get(STATUS_FAILED, 0),
        "stale": summary.get(STATUS_STALE, 0),
        "unverified": summary.get(STATUS_UNVERIFIED, 0),
        "superseded": summary.get(STATUS_SUPERSEDED, 0),
        "human_attested": summary.get(STATUS_HUMAN, 0),
        "machine_total": len(machine),
        "human_total": len(human),
        "last_verified": last_verified,
    }


# ---------------------------------------------------------------------------
# rendering
# ---------------------------------------------------------------------------

def render_markdown(state: dict[str, Any]) -> str:
    summary = state.get("summary", {})
    lines = [
        "<!-- GENERATED by tools/verification -- do not hand-edit. -->",
        "# Verification state",
        "",
        f"- As of: {state.get('as_of') or 'n/a'}",
        f"- Verified: {summary.get(STATUS_VERIFIED, 0)}",
        f"- Failed: {summary.get(STATUS_FAILED, 0)}",
        f"- Stale: {summary.get(STATUS_STALE, 0)}",
        f"- Unverified: {summary.get(STATUS_UNVERIFIED, 0)}",
        f"- Superseded: {summary.get(STATUS_SUPERSEDED, 0)}",
        f"- Human-attested: {summary.get(STATUS_HUMAN, 0)}",
        "",
        "| Claim | Status | Verified at | Evidence |",
        "|---|---|---|---|",
    ]
    for record in state.get("claims", []):
        evidence = record.get("evidence") or {}
        where = evidence.get("repository") or evidence.get("type") or "-"
        if evidence.get("field"):
            where = f"{where} ({evidence['field']})"
        lines.append(
            f"| `{record.get('id')}` | {record.get('status')} | {record.get('verified_at') or '-'} | {where} |"
        )
    return "\n".join(lines) + "\n"
