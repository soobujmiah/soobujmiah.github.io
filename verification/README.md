# Verification claim registry

**Canonical location:** `verification/claims.json` in `soobujmiah/skb`.
**Contract:** this file + `verification/claims.schema.json` + `governance/VERIFICATION_AND_CLAIMS.md`.

## What this is

The registry of **claims** — the statements the public Portfolio makes that can be
checked against deterministic repository/CI evidence — and, for each one, a pointer to the
evidence that backs it.

It is deliberately **not** an evidence store. Evidence has exactly one canonical home per
repository:

| Fact | Canonical source |
|---|---|
| head commit, build/test status, last successful/failed build, events | that repository's own `.repo/project.yaml` + `.repo/events/` (`governance/REPO_STATE_PROTOCOL.md`) |
| the cross-project aggregate of the above | `projects/registry/<project_id>.json`, pulled by `scripts/pull_skb_registry.py` |
| whether a repository is public / publishes Pages | the GitHub API, read at resolution time |
| human-judgement fields (`status`, `maturity`, `next_gate`) | `projects/state/<project_id>.md`, human-authored |

`claims.json` therefore only ever records an **identity, a classification, and a pointer**.
Duplicating the evidence here would create a second source of truth, which is exactly what
`schemas/README.md`'s rule for agents forbids.

## Claim classes

| Class | Meaning | Who may write the text | Automation may |
|---|---|---|---|
| `evidence_backed` | An objectively testable statement. | Owner / agent, as a curated edit to this file. | refresh its **status, timestamp and evidence** from the canonical source. |
| `positioning` | Human-authored positioning or an owner-recorded figure/device observation. | Owner / agent, as a curated edit. | nothing. Never rewrite it, never mark it verified. |

The split is mandatory. *"I build practical software."* is positioning. *"Project X has a
successful CI build."* is evidence-backed. A statement that mixes the two (e.g. *"Songjog has
94 tests green on CI"*) is split into two claims: the machine-checkable half becomes
`evidence_backed`, the human-recorded half becomes `positioning`.

## Status values

Resolved deterministically by `tools/verification/`:

| Status | Meaning |
|---|---|
| `verified` | Evidence resolved, matched the expected value, and is within `freshness.max_age_days`. |
| `failed` | Evidence resolved and did **not** match (e.g. `build.status: failed`). |
| `stale` | Evidence resolved and matched, but is older than `freshness.max_age_days`. |
| `unverified` | No evidence could be resolved now **and** none was carried forward. |
| `superseded` | A newer claim declares `supersedes: <this id>`. The record is preserved. |
| `human_attested` | Class `positioning`. Reported separately from machine verification. |

`human_attested` exists because the alternative is worse: without it a human statement is
either falsely reported `verified` or misleadingly reported `unverified`. It is the one
value beyond the five the integration brief enumerates, and this paragraph is its
justification.

## Failure preservation

The resolver merges, never erases (same rule as `tools/repo_knowledge`'s
`_run_block` and policy rule 6/7 of
`governance/DETERMINISTIC_STATE_SYNC_POLICY.md`):

1. Try to resolve the claim's evidence now.
2. If it resolves, record it — including a `failed` result.
3. If it does not resolve, carry the previous record for the same claim id forward
   unchanged. Its original `verified_at` then ages it into `stale` honestly.
4. If there is nothing to carry forward, report `unverified`.

A failed verification therefore never erases a previously successful one, and the Portfolio
can never present a failed verification as successful.

## Idempotency

`verified_at` always comes from the evidence (`build.at`, `test.at`, `head.committed_at`,
`pushed_at`), never from wall-clock time, and `as_of` is the newest evidence timestamp.
Two runs over identical inputs produce byte-identical output.

## Public-safe projection

`public: true` on a claim is necessary but not sufficient. A claim is published only when
its evidence resolves against a **public** repository. `tools/verification/` filters on that,
so no private-repository metadata, private run id, or internal field can reach the public
Portfolio. See `governance/VERIFICATION_AND_CLAIMS.md` § Security.

## Adding a claim

1. Add the entry to this file, with a stable `id` that has never been used before.
2. Choose the class honestly. If the statement contains a human-recorded figure, it is
   `positioning`.
3. Point `evidence` at a real canonical source. If there is none, the claim is
   `positioning`.
4. Set `public` to `false` if the evidence touches a private repository.
5. Run `python3 -m tools.verification build` and commit the regenerated state.
6. Vendor `verification/claims.json` into any consumer repository, exactly as
   `tools/repo_knowledge/` and `schemas/*.schema.json` are already vendored.
