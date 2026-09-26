# AI Assistant Working Agreement — soobujmiah.github.io

This repository is operated under Sobuj's SKB project-bootstrap standard. GitHub is the canonical project memory. Chat history is not authoritative.

## Mandatory reading

1. `README.md`
2. **SKB context discovery:** consult `soobujmiah/skb` and begin at `ASSISTANT_CONTEXT.md` before making non-trivial project decisions.
3. Live repository source and current state

## Persistent owner-knowledge contract

This repository is permanently associated with Sobuj's owner-level project knowledge system through SKB. Once this repository has been bootstrapped under SKB, a future user does **not** need to repeat "read SKB" merely to establish the relationship.

- Canonical SKB repository: `soobujmiah/skb`
- Canonical SKB entry point: `ASSISTANT_CONTEXT.md`
- Canonical SKB continuity standard: `standards/project-knowledge-continuity.md`
- A fresh AI agent MUST discover and consult relevant SKB context before making non-trivial project decisions.
- Use progressive discovery: local repository instructions → SKB `ASSISTANT_CONTEXT.md` → minimum sufficient relevant SKB context → live repository evidence.
- If the task is trivial and clearly independent of owner/project context, unnecessary SKB retrieval may be skipped; the relationship itself remains active.
- Never silently rewrite SKB and never treat an SKB recommendation as authorization.
- If SKB is unavailable, say so and continue only from verified local evidence where safe.

## Claims and verification

The footer's proof line and `/verification/` are **generated from evidence**, never typed.

- Canonical claim registry: `verification/claims.json` (canonical copy lives in `soobujmiah/skb`, vendored here). A claim is a stable id, its wording, the evidence it cites, and a deterministic status. Do not edit a claim's status by hand — change the evidence it points at.
- Regenerate with `python3 -m tools.verification build --source portfolio --out public/verification.json --public-only --summary app/verification-summary.json --merge`, then `python3 -m tools.verification verify`. Both are deterministic: same evidence in, same bytes out.
- `public/verification.json` is the only generated artifact that may reach a public path, and only with `--public-only`. The CLI refuses otherwise — that guardrail exists because an internal document was once written to a public path and leaked private repository slugs.
- Presentation copy for the page lives in `app/verification-copy.ts`, deliberately *not* in `app/content.ts`, so the fixed footer on every route does not ship it. Every published claim id needs a label in both `en` and `bn`; `npm run check:verification` proves that in both directions.
- Never write a claim number into `README.md`, `app/content.ts`, or a commit message from memory. The live page at `/verification/` is authoritative; quote it or re-run the resolver.

An LLM may translate a claim's wording or describe why a claim holds. It may never mark a claim verified, invent an evidence URL, or move a failing claim into a passing state.
