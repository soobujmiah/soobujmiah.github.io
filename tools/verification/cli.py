#!/usr/bin/env python3
"""verification -- deterministic claim verification for the SKB ecosystem.

Subcommands:

    build     resolve every claim against its canonical evidence source and write the
              verification state (plus, with --public-only, the public-safe projection)
    verify    report-only schema check of the claims registry and the generated state
    status    print a human-readable summary of the current verification state

No subcommand calls an LLM. No subcommand writes to any repository other than the one it
is run in, and no subcommand introduces a credential of its own: SKB reuses the GitHub App
installation token minted by `registry-pull.yml`, and a consumer repository reuses its own
ambient `GITHUB_TOKEN`.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import core, providers
from .validate import load_schema, validate


def _default_claims(root: Path) -> Path:
    return root / "verification" / "claims.json"


def _default_schema(root: Path) -> Path:
    return root / "verification" / "claims.schema.json"


def _claims_findings(claims_doc: dict, schema: dict) -> list[str]:
    findings: list[str] = []
    seen: set[str] = set()
    for i, claim in enumerate(claims_doc.get("claims", [])):
        where = f"claims[{i}]"
        if not isinstance(claim, dict):
            findings.append(f"{where}: not an object")
            continue
        claim_id = claim.get("id")
        if claim_id in seen:
            findings.append(f"{where}: duplicate claim id {claim_id!r}")
        seen.add(claim_id or "")
        for error in validate(claim, schema, where):
            findings.append(error)
        if claim.get("class") == core.CLASS_POSITIONING:
            if not claim.get("note"):
                findings.append(f"{where} ({claim_id}): positioning claim needs a note explaining why it is not machine-verified")
            if claim.get("verification_method") not in ("human_attested", "none"):
                findings.append(f"{where} ({claim_id}): positioning claim must use human_attested or none")
        if claim.get("class") == core.CLASS_EVIDENCE:
            spec = claim.get("evidence") or {}
            if spec.get("type") == "none":
                findings.append(f"{where} ({claim_id}): evidence_backed claim cannot declare evidence.type 'none'")
    for claim in claims_doc.get("claims", []):
        target = claim.get("supersedes") if isinstance(claim, dict) else None
        if target and target not in seen:
            findings.append(f"claim {claim.get('id')!r} supersedes unknown id {target!r}")
    return findings


def _state_findings(state: dict, projection: dict | None) -> list[str]:
    findings: list[str] = []
    ids = [c.get("id") for c in state.get("claims", [])]
    if len(ids) != len(set(ids)):
        findings.append("state: duplicate claim records")
    for record in state.get("claims", []):
        if record.get("status") not in core.STATUS_ORDER:
            findings.append(f"state: {record.get('id')} has invalid status {record.get('status')!r}")
        if record.get("status") == core.STATUS_VERIFIED and not record.get("verified_at"):
            findings.append(f"state: {record.get('id')} is verified with no verified_at")
        if record.get("status") in (core.STATUS_FAILED, core.STATUS_STALE, core.STATUS_VERIFIED) and not record.get("evidence"):
            findings.append(f"state: {record.get('id')} is {record.get('status')} with no evidence")
    if projection is not None:
        for record in projection.get("claims", []):
            if not core.is_public_safe(record):
                findings.append(f"projection: {record.get('id')} is not public-safe but was published")
    return findings


def _load_previous(path: Path) -> dict:
    return core.load_previous_state(path)


def _is_public_path(path: Path) -> bool:
    """True when any path component is a `public/` directory -- the conventional
    document root of a published site."""
    return any(part == "public" for part in Path(path).parts)


def cmd_build(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    claims_path = Path(args.claims) if args.claims else _default_claims(root)
    claims_doc = core.load_claims(claims_path)

    schema_path = Path(args.schema) if args.schema else _default_schema(root)
    findings: list[str] = []
    if schema_path.exists():
        findings += _claims_findings(claims_doc, load_schema(schema_path))
    else:
        print(f"WARN: claims schema not found at {schema_path}; skipping registry validation")
    if findings:
        print(f"VERIFY: {len(findings)} claim-registry finding(s)")
        for f in findings:
            print(f"- {f}")
        return 1

    if args.source == "registry":
        provider = providers.RegistryProvider(root / "projects" / "registry", token=args.token)
    else:
        provider = providers.PortfolioProvider(root, token=args.token, project_id=args.project_id)

    # Guardrail: the internal verification state carries every claim, including ones
    # whose evidence points at a private repository. It must never be written into a
    # site's public document root, where it would be published verbatim. A public
    # build must ask for the projection explicitly.
    if _is_public_path(args.out) and not (args.public_only or args.projection):
        raise SystemExit(
            f"refusing to write the internal verification state to {args.out}: that path is public. "
            "Pass --public-only (or --projection <path>) so only the public-safe projection is written."
        )

    previous = _load_previous(Path(args.out)) if args.merge else {"claims": []}
    now = datetime.now(timezone.utc) if not args.frozen_now else datetime.fromisoformat(args.frozen_now)

    state = core.build_state(claims_doc, provider, previous=previous, now=now)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    core_dump(out_path, state)

    wrote = [str(out_path)]
    projection = None
    if args.public_only or args.projection:
        projection = core.build_projection(state)
        proj_path = Path(args.projection) if args.projection else out_path
        core_dump(proj_path, projection)
        wrote.append(str(proj_path))
    if args.summary:
        # A minimal count-only document for site chrome, so shared UI never has to
        # import the full projection just to render "N of M checks passing".
        source = projection if projection is not None else state
        summary_path = Path(args.summary)
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        core_dump(summary_path, core.build_summary(source))
        wrote.append(str(summary_path))

    summary = state.get("summary", {})
    print(
        "verification: "
        + " ".join(f"{k}={v}" for k, v in summary.items())
        + f" (as_of {state.get('as_of') or 'n/a'})"
    )
    for path in wrote:
        print(f"wrote {path}")
    return 0


def core_dump(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False, sort_keys=False)
        fh.write("\n")


def cmd_verify(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    claims_path = Path(args.claims) if args.claims else _default_claims(root)
    schema_path = Path(args.schema) if args.schema else _default_schema(root)
    state_path = Path(args.state) if args.state else root / "verification" / "state.json"
    projection_path = Path(args.projection) if args.projection else root / "verification" / "projection.json"

    findings: list[str] = []
    if not claims_path.exists():
        print(f"VERIFY: claims registry not found: {claims_path}")
        return 1
    claims_doc = core.load_claims(claims_path)
    if schema_path.exists():
        findings += _claims_findings(claims_doc, load_schema(schema_path))
    else:
        findings.append(f"claims schema not found: {schema_path}")

    state = core.load_json(state_path)
    projection = core.load_json(projection_path) if projection_path.exists() else None
    if state is None:
        findings.append(f"verification state not found: {state_path} (run `verification build` first)")
    else:
        findings += _state_findings(state, projection)

    if findings:
        print(f"VERIFY: {len(findings)} finding(s)")
        for f in findings:
            print(f"- {f}")
        return 1
    print("VERIFY: 0 findings")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    state_path = Path(args.state) if args.state else root / "verification" / "state.json"
    state = core.load_json(state_path)
    if state is None:
        print(f"no verification state at {state_path} -- run `verification build` first")
        return 1
    print(core.render_markdown(state))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="verification", description=__doc__)
    parser.add_argument("--root", default=".", help="repository root (default: cwd)")
    parser.add_argument("--claims", default=None, help="path to claims.json")
    parser.add_argument("--schema", default=None, help="path to claims.schema.json")
    parser.add_argument("--token", default=None, help="read-only API token; defaults to $GITHUB_TOKEN")

    sub = parser.add_subparsers(dest="command", required=True)

    p_build = sub.add_parser("build", help="resolve claims and write the verification state")
    p_build.add_argument("--out", required=True, help="output JSON path")
    p_build.add_argument("--source", choices=["registry", "portfolio"], default="portfolio")
    p_build.add_argument("--project-id", default="portfolio")
    p_build.add_argument("--projection", default=None, help="also write the public-safe projection here")
    p_build.add_argument("--public-only", action="store_true", help="write only the projection to --out")
    p_build.add_argument("--merge", action="store_true", help="carry forward previous evidence when a claim cannot be resolved now")
    p_build.add_argument("--summary", default=None, help="also write a minimal count-only summary document here")
    p_build.add_argument("--frozen-now", default=None, help="ISO-8601 timestamp, for deterministic tests")
    p_build.set_defaults(func=cmd_build)

    p_verify = sub.add_parser("verify", help="validate the registry and generated state; report-only")
    p_verify.add_argument("--state", default=None)
    p_verify.add_argument("--projection", default=None)
    p_verify.set_defaults(func=cmd_verify)

    p_status = sub.add_parser("status", help="print a human summary of the verification state")
    p_status.add_argument("--state", default=None)
    p_status.set_defaults(func=cmd_status)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if getattr(args, "token", None) is None:
        import os

        args.token = os.environ.get("GITHUB_TOKEN", "")
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
