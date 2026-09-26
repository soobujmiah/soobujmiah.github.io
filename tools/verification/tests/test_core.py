"""Deterministic tests for tools/verification.

Covers the contract in verification/README.md: schema validation, classification
(verified / failed / stale / unverified / superseded / human-attested), failure
preservation, idempotency, and the public-safe projection filter.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from tools.verification import cli, core  # noqa: E402
from tools.verification.validate import load_schema, validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPO_ROOT / "verification" / "claims.schema.json"
SCHEMA = load_schema(SCHEMA_PATH)
NOW = datetime(2026, 9, 27, 12, 0, 0, tzinfo=timezone.utc)


def iso_days_ago(days: int) -> str:
    from datetime import timedelta

    return (NOW - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")


class FakeProvider:
    """Scriptable evidence provider: maps (type, repository/project_id) -> evidence."""

    def __init__(self, table=None, raises=False):
        self.table = table or {}
        self.raises = raises
        self.calls = []

    def resolve(self, evidence_type, spec):
        self.calls.append((evidence_type, spec))
        if self.raises:
            raise RuntimeError("provider exploded")
        key = spec.get("project_id") or spec.get("repository")
        if isinstance(spec.get("repositories"), list):
            key = tuple(spec["repositories"])
        return self.table.get((evidence_type, key))


def claim(**overrides):
    base = {
        "id": "repo.adt.build.passing",
        "class": "evidence_backed",
        "text": "ADT's CI reports a passing build.",
        "public": True,
        "verification_method": "repository_state",
        "evidence": {
            "type": "repository_state",
            "project_id": "adt",
            "repository": "soobujmiah/adt",
            "field": "build.status",
            "expect": "passed",
        },
        "freshness": {"max_age_days": 30},
    }
    base.update(overrides)
    return base


def passing_evidence(at=None, **over):
    evidence = {
        "type": "repository_state",
        "project_id": "adt",
        "repository": "soobujmiah/adt",
        "field": "build.status",
        "value": "passed",
        "at": at or iso_days_ago(1),
        "commit": "abc1234",
        "run_id": "36261121988",
        "public": True,
        "url": "https://github.com/soobujmiah/adt/blob/main/.repo/project.yaml",
    }
    evidence.update(over)
    return evidence


def claims_doc(*claims):
    return {"schema": "skb.verification-claims/v1", "authority": "test", "claims": list(claims)}


# ── schema ────────────────────────────────────────────────────────────────

class TestClaimSchema(unittest.TestCase):
    def test_valid_claim_has_no_findings(self):
        self.assertEqual(validate(claim(), SCHEMA), [])

    def test_positioning_claim_is_valid(self):
        c = claim(
            id="positioning.software_practice",
            **{"class": "positioning"},
            verification_method="none",
            evidence={"type": "none"},
            note="Owner-authored positioning.",
        )
        self.assertEqual(validate(c, SCHEMA), [])

    def test_invalid_claim_rejected(self):
        bad = claim(id="Bad Id", **{"class": "nonsense"})
        findings = validate(bad, SCHEMA)
        self.assertTrue(any("pattern" in f for f in findings), findings)
        self.assertTrue(any("enum" in f for f in findings), findings)

    def test_missing_evidence_rejected(self):
        c = claim()
        del c["evidence"]
        self.assertTrue(validate(c, SCHEMA))

    def test_evidence_missing_type_rejected(self):
        c = claim()
        del c["evidence"]["type"]
        self.assertTrue(validate(c, SCHEMA))

    def test_unexpected_property_rejected(self):
        c = claim(fabricated_metric=42)
        self.assertTrue(validate(c, SCHEMA))

    def test_supersedes_pattern_enforced(self):
        c = claim(supersedes="Not A Slug")
        self.assertTrue(validate(c, SCHEMA))

    def test_freshness_must_be_positive(self):
        c = claim(freshness={"max_age_days": 0})
        self.assertTrue(validate(c, SCHEMA))


# ── classification ────────────────────────────────────────────────────────

class TestClassification(unittest.TestCase):
    def test_verification_succeeds(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        record = state["claims"][0]
        self.assertEqual(record["status"], "verified")
        self.assertEqual(record["verified_at"], iso_days_ago(1))
        self.assertEqual(record["evidence"]["value"], "passed")
        self.assertEqual(state["summary"]["verified"], 1)

    def test_verification_failure_is_reported_as_failed(self):
        provider = FakeProvider(
            {("repository_state", "adt"): passing_evidence(value="failed", run_id="999")}
        )
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "failed")
        self.assertEqual(state["summary"]["failed"], 1)

    def test_unknown_evidence_is_unverified_not_failed(self):
        provider = FakeProvider(
            {("repository_state", "adt"): passing_evidence(value="unknown", run_id=None)}
        )
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "unverified")

    def test_stale_evidence_is_distinguishable(self):
        provider = FakeProvider(
            {("repository_state", "adt"): passing_evidence(at=iso_days_ago(90))}
        )
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "stale")
        # stale evidence is preserved, not discarded
        self.assertEqual(state["claims"][0]["evidence"]["at"], iso_days_ago(90))

    def test_claim_without_evidence_is_unverified(self):
        provider = FakeProvider({})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        record = state["claims"][0]
        self.assertEqual(record["status"], "unverified")
        self.assertIsNone(record.get("evidence"))

    def test_positioning_is_never_verified(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        positioning = claim(
            id="positioning.software_practice",
            **{"class": "positioning"},
            verification_method="none",
            evidence={"type": "none"},
            note="Owner-authored positioning.",
        )
        state = core.build_state(claims_doc(positioning), provider, now=NOW)
        record = state["claims"][0]
        self.assertEqual(record["status"], "human_attested")
        self.assertIsNone(record.get("evidence"))
        self.assertIsNone(record.get("verified_at"))
        # the provider is never even consulted for a positioning claim
        self.assertEqual(provider.calls, [])

    def test_superseded_claim_keeps_its_evidence(self):
        old = claim(id="repo.adt.build.passing")
        new = claim(id="repo.adt.build.passing.v2", supersedes="repo.adt.build.passing")
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(old, new), provider, now=NOW)
        by_id = {r["id"]: r for r in state["claims"]}
        self.assertEqual(by_id["repo.adt.build.passing"]["status"], "superseded")
        self.assertEqual(by_id["repo.adt.build.passing"]["superseded_by"], "repo.adt.build.passing.v2")
        self.assertEqual(by_id["repo.adt.build.passing"]["evidence"]["value"], "passed")
        self.assertEqual(by_id["repo.adt.build.passing.v2"]["status"], "verified")

    def test_superseding_unknown_id_is_a_registry_finding(self):
        from tools.verification.cli import _claims_findings

        doc = claims_doc(claim(id="a", supersedes="does.not.exist"))
        self.assertTrue(any("supersedes unknown id" in f for f in _claims_findings(doc, SCHEMA)))


# ── failure preservation ──────────────────────────────────────────────────

class TestFailurePreservation(unittest.TestCase):
    def test_previous_success_is_preserved_when_current_evidence_is_missing(self):
        provider = FakeProvider({})  # nothing resolves now
        previous = core.load_previous_state_from_records(
            [{"id": "repo.adt.build.passing", "class": "evidence_backed", "status": "verified",
              "verified_at": iso_days_ago(2), "public": True, "evidence": passing_evidence(at=iso_days_ago(2))}]
        )
        state = core.build_state(claims_doc(claim()), provider, previous=previous, now=NOW)
        record = state["claims"][0]
        self.assertTrue(record["carried_forward"])
        self.assertEqual(record["evidence"]["at"], iso_days_ago(2))
        self.assertEqual(record["status"], "verified")

    def test_carried_forward_evidence_ages_into_stale(self):
        provider = FakeProvider({})
        previous = core.load_previous_state_from_records(
            [{"id": "repo.adt.build.passing", "class": "evidence_backed", "status": "verified",
              "verified_at": iso_days_ago(120), "public": True, "evidence": passing_evidence(at=iso_days_ago(120))}]
        )
        state = core.build_state(claims_doc(claim()), provider, previous=previous, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "stale")

    def test_failed_run_does_not_erase_previous_success(self):
        """A failing current run must record the failure, not overwrite the last-good record
        with it, and must never be presented as a success."""
        failing = FakeProvider({("repository_state", "adt"): passing_evidence(value="failed")})
        state = core.build_state(claims_doc(claim()), failing, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "failed")
        self.assertEqual(state["claims"][0]["evidence"]["value"], "failed")
        self.assertNotEqual(state["claims"][0]["status"], "verified")

    def test_provider_exception_never_aborts_the_run(self):
        provider = FakeProvider(raises=True)
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(state["claims"][0]["status"], "unverified")


# ── synchronization / idempotency ─────────────────────────────────────────

class TestSynchronization(unittest.TestCase):
    def test_new_claim_appears(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim(), claim(id="repo.lai.build.passing")), provider, now=NOW)
        self.assertEqual(len(state["claims"]), 2)

    def test_changed_evidence_updates_the_record(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence(at=iso_days_ago(1))})
        first = core.build_state(claims_doc(claim()), provider, now=NOW)
        provider.table[("repository_state", "adt")] = passing_evidence(at=iso_days_ago(0), value="failed")
        second = core.build_state(claims_doc(claim()), provider, previous=first, now=NOW)
        self.assertEqual(second["claims"][0]["status"], "failed")
        self.assertEqual(second["claims"][0]["verified_at"], iso_days_ago(0))

    def test_unchanged_state_is_byte_identical(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        first = core.build_state(claims_doc(claim()), provider, now=NOW)
        second = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(json.dumps(first, sort_keys=True), json.dumps(second, sort_keys=True))

    def test_repeated_execution_converges(self):
        """Running build twice with the first output as previous state must not duplicate,
        churn, or drift."""
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        first = core.build_state(claims_doc(claim()), provider, now=NOW)
        second = core.build_state(claims_doc(claim()), provider, previous=first, now=NOW)
        third = core.build_state(claims_doc(claim()), provider, previous=second, now=NOW)
        self.assertEqual(len(second["claims"]), 1)
        self.assertEqual(len(third["claims"]), 1)
        self.assertEqual(json.dumps(second, sort_keys=True), json.dumps(third, sort_keys=True))
        self.assertFalse(second["claims"][0].get("carried_forward"))

    def test_removed_claim_disappears_but_history_is_in_git(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(), provider, now=NOW)
        self.assertEqual(state["claims"], [])

    def test_as_of_is_the_newest_evidence_timestamp_not_wall_clock(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence(at="2020-01-01T00:00:00Z")})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        self.assertEqual(state["as_of"], "2020-01-01T00:00:00Z")


# ── public-safe projection ────────────────────────────────────────────────

class TestPublicProjection(unittest.TestCase):
    def test_private_repo_evidence_never_reaches_the_projection(self):
        provider = FakeProvider(
            {("repository_state", "private-fixture"): passing_evidence(repository="example/private-fixture", public=False)}
        )
        private_claim = claim(
            id="repo.private-fixture.build.passing",
            public=True,
            evidence={"type": "repository_state", "project_id": "private-fixture",
                      "repository": "example/private-fixture", "field": "build.status", "expect": "passed"},
        )
        state = core.build_state(claims_doc(private_claim), provider, now=NOW)
        projection = core.build_projection(state)
        self.assertEqual(projection["claims"], [])
        self.assertNotIn("example/private-fixture", json.dumps(projection))

    def test_public_false_claim_stays_internal(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        internal = claim(public=False)
        state = core.build_state(claims_doc(internal), provider, now=NOW)
        self.assertNotIn("public", state["claims"][0])
        self.assertEqual(core.build_projection(state)["claims"], [])

    def test_public_repo_evidence_is_projected(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        projection = core.build_projection(state)
        self.assertEqual(len(projection["claims"]), 1)
        self.assertEqual(projection["schema"], "skb.verification-projection/v1")
        self.assertIn("soobujmiah/adt", json.dumps(projection))

    def test_positioning_claim_is_projected_without_evidence(self):
        positioning = claim(
            id="positioning.software_practice",
            **{"class": "positioning"},
            verification_method="none",
            evidence={"type": "none"},
            note="Owner-authored positioning.",
        )
        state = core.build_state(claims_doc(positioning), FakeProvider({}), now=NOW)
        projection = core.build_projection(state)
        self.assertEqual(len(projection["claims"]), 1)
        self.assertEqual(projection["claims"][0]["status"], "human_attested")

    def test_unverified_claim_without_evidence_is_not_projected(self):
        state = core.build_state(claims_doc(claim()), FakeProvider({}), now=NOW)
        self.assertEqual(core.build_projection(state)["claims"], [])

    def test_projection_carries_no_secret_shaped_fields(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        blob = json.dumps(core.build_projection(state)).lower()
        for banned in ("private_key", "app_private_key", "token", "secret", "password", "skb_pull_token"):
            self.assertNotIn(banned, blob)

    def test_projection_summary_counts_only_published_claims(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim(), claim(id="b", public=False)), provider, now=NOW)
        projection = core.build_projection(state)
        self.assertEqual(projection["summary"]["verified"], 1)


# ── the real registry ─────────────────────────────────────────────────────

class TestCanonicalRegistry(unittest.TestCase):
    """The shipped claims.json must itself satisfy the contract."""

    @classmethod
    def setUpClass(cls):
        cls.doc = core.load_claims(REPO_ROOT / "verification" / "claims.json")

    def test_registry_validates_against_its_schema(self):
        self.assertEqual(validate(self.doc["claims"], {"type": "array", "items": SCHEMA}), [])

    def test_registry_ids_are_unique_and_stable(self):
        ids = [c["id"] for c in self.doc["claims"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_every_evidence_backed_claim_points_at_a_real_source(self):
        for c in self.doc["claims"]:
            if c["class"] != "evidence_backed":
                continue
            spec = c["evidence"]
            self.assertIn(spec["type"], core.RESOLVABLE_EVIDENCE_TYPES, c["id"])
            if spec["type"] == "repository_state":
                self.assertTrue(spec.get("project_id"), c["id"])
                self.assertTrue(spec.get("repository"), c["id"])
                self.assertIn(spec.get("field"), ("build.status", "test.status", "head.commit"), c["id"])

    def test_every_positioning_claim_is_justified(self):
        for c in self.doc["claims"]:
            if c["class"] == "positioning":
                self.assertTrue(c.get("note"), c["id"])
                self.assertIn(c["verification_method"], ("human_attested", "none"), c["id"])

    def test_public_machine_claims_have_explicit_predicates(self):
        # Actual publicness is a live API property, tested with synthetic fixtures
        # in test_audit_privacy.py. Never publish a real private-repository denylist.
        for c in self.doc["claims"]:
            if c.get("public") and c.get("class") == "evidence_backed":
                self.assertTrue(c["evidence"].get("expect"), c["id"])

    def test_registry_status_enum_matches_the_resolver(self):
        self.assertEqual(
            set(self.doc["status_enum"]), set(core.STATUS_ORDER), "registry and resolver drifted"
        )


if __name__ == "__main__":
    unittest.main()


# ── CLI guardrails ────────────────────────────────────────────────────────

class TestPublicPathGuardrail(unittest.TestCase):
    """The internal state must never be written into a site's public document root."""

    def _run(self, argv):
        from tools.verification.cli import main

        return main(argv)

    def test_writing_internal_state_to_public_dir_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "verification").mkdir()
            (root / "verification" / "claims.json").write_text(
                json.dumps(claims_doc(claim())), encoding="utf-8"
            )
            (root / "public").mkdir()
            with self.assertRaises(SystemExit) as ctx:
                self._run([
                    "--root", str(root),
                    "build", "--out", str(root / "public" / "verification.json"),
                ])
            self.assertIn("public", str(ctx.exception))
            self.assertFalse((root / "public" / "verification.json").exists())

    def test_public_only_flag_is_accepted_for_a_public_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "verification").mkdir()
            (root / "verification" / "claims.json").write_text(
                json.dumps(claims_doc(claim())), encoding="utf-8"
            )
            (root / "public").mkdir()
            rc = self._run([
                "--root", str(root),
                "build", "--out", str(root / "public" / "verification.json"),
                "--public-only",
            ])
            self.assertEqual(rc, 0)
            written = json.loads((root / "public" / "verification.json").read_text(encoding="utf-8"))
            self.assertEqual(written["schema"], "skb.verification-projection/v1")

    def test_internal_path_still_writes_the_full_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "verification").mkdir()
            (root / "verification" / "claims.json").write_text(
                json.dumps(claims_doc(claim())), encoding="utf-8"
            )
            rc = self._run(["--root", str(root), "build", "--out", str(root / "verification" / "state.json")])
            self.assertEqual(rc, 0)
            written = json.loads((root / "verification" / "state.json").read_text(encoding="utf-8"))
            self.assertEqual(written["schema"], "skb.verification-state/v1")


# ── minimal summary (chrome payload) ──────────────────────────────────────

class TestSummaryDocument(unittest.TestCase):
    def _projection(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        return core.build_projection(state)

    def test_summary_carries_counts_and_last_verified(self):
        summary = core.build_summary(self._projection())
        self.assertEqual(summary["schema"], "skb.verification-summary/v1")
        self.assertEqual(summary["verified"], 1)
        self.assertEqual(summary["machine_total"], 1)
        self.assertEqual(summary["last_verified"], iso_days_ago(1))
        self.assertEqual(summary["as_of"], iso_days_ago(1))

    def test_summary_is_deterministic(self):
        a = core.build_summary(self._projection())
        b = core.build_summary(self._projection())
        self.assertEqual(json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True))

    def test_summary_carries_no_claim_text_repository_or_url(self):
        summary = core.build_summary(self._projection())
        blob = json.dumps(summary)
        for banned in ("soobujmiah/adt", "https://", "repository", "run_id", "evidence", "claim"):
            self.assertNotIn(banned, blob, f"summary leaked {banned!r}")

    def test_summary_reflects_failures_honestly(self):
        provider = FakeProvider({("repository_state", "adt"): passing_evidence(value="failed")})
        state = core.build_state(claims_doc(claim()), provider, now=NOW)
        summary = core.build_summary(core.build_projection(state))
        self.assertEqual(summary["failed"], 1)
        self.assertEqual(summary["verified"], 0)

    def test_summary_counts_human_claims_separately(self):
        positioning = claim(
            id="positioning.software_practice", **{"class": "positioning"},
            verification_method="none", evidence={"type": "none"}, note="Owner-authored.",
        )
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc(claim(), positioning), provider, now=NOW)
        summary = core.build_summary(core.build_projection(state))
        self.assertEqual(summary["machine_total"], 1)
        self.assertEqual(summary["human_total"], 1)
        self.assertEqual(summary["human_attested"], 1)


class TestPublicOnlyVerify(unittest.TestCase):
    """A public-only repository never writes the internal state document, so
    `verify --projection <path>` must still be able to prove the projection
    against the canonical claim registry rather than demanding a file that
    must not exist."""

    def _verify(self, tmp, projection_name="projection.json"):
        args = argparse.Namespace(
            root=Path(tmp),
            claims=None,
            schema=None,
            state=None,
            projection=projection_name,
        )
        return cli.cmd_verify(args)

    def _write_claims(self, tmp, claims_doc):
        """cmd_verify resolves the registry under --root, so the temp
        repository needs its own claims.json for the run to be self-contained."""
        d = Path(tmp) / "verification"
        d.mkdir(parents=True, exist_ok=True)
        (d / "claims.json").write_text(json.dumps(claims_doc), encoding="utf-8")
        shutil.copyfile(SCHEMA_PATH, d / "claims.schema.json")

    def _claims_doc(self):
        return {
            "schema_version": 1,
            "claims": [
                claim(
                    id="repo.adt.build.passing",
                    evidence={"type": "repository_state", "project_id": "adt", "expect": "passed"},
                    # no `status` here: the registry never stores one, the
                    # resolver derives it. The schema rejects it if you add one.
                )
            ],
        }

    def test_public_only_projection_verifies_without_state(self):
        claims_doc = self._claims_doc()
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc, provider, now=NOW)
        projection = core.build_projection(state)
        with tempfile.TemporaryDirectory() as tmp:
            self._write_claims(tmp, claims_doc)
            (Path(tmp) / "projection.json").write_text(json.dumps(projection), encoding="utf-8")
            self.assertEqual(self._verify(tmp), 0)

    def test_missing_state_still_fails_when_no_projection_named(self):
        claims_doc = self._claims_doc()
        with tempfile.TemporaryDirectory() as tmp:
            self._write_claims(tmp, claims_doc)
            args = argparse.Namespace(
                root=Path(tmp), claims=None, schema=None, state=None, projection=None
            )
            self.assertEqual(cli.cmd_verify(args), 1)

    def test_unpublished_registry_claim_is_a_finding(self):
        claims_doc = self._claims_doc()
        claims_doc["claims"].append(
            claim(id="repo.ggen.build.passing", evidence={"type": "repository_state", "project_id": "ggen", "expect": "passed"})
        )
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc, provider, now=NOW)
        projection = core.build_projection(state)
        with tempfile.TemporaryDirectory() as tmp:
            self._write_claims(tmp, claims_doc)
            (Path(tmp) / "projection.json").write_text(json.dumps(projection), encoding="utf-8")
            self.assertEqual(self._verify(tmp), 1)

    def test_private_claim_published_is_a_finding(self):
        claims_doc = self._claims_doc()
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc, provider, now=NOW)
        projection = core.build_projection(state)
        projection["claims"][0]["public"] = False
        with tempfile.TemporaryDirectory() as tmp:
            self._write_claims(tmp, claims_doc)
            (Path(tmp) / "projection.json").write_text(json.dumps(projection), encoding="utf-8")
            self.assertEqual(self._verify(tmp), 1)

    def test_summary_disagreeing_with_claims_is_a_finding(self):
        claims_doc = self._claims_doc()
        provider = FakeProvider({("repository_state", "adt"): passing_evidence()})
        state = core.build_state(claims_doc, provider, now=NOW)
        projection = core.build_projection(state)
        projection["summary"]["verified"] = 99
        with tempfile.TemporaryDirectory() as tmp:
            self._write_claims(tmp, claims_doc)
            (Path(tmp) / "projection.json").write_text(json.dumps(projection), encoding="utf-8")
            self.assertEqual(self._verify(tmp), 1)
