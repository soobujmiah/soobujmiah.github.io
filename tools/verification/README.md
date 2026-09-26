# tools/verification

Deterministic, non-LLM claim verification. Canonical home: `tools/verification/` in
`soobujmiah/skb`; vendored into consumer repositories the same way `tools/repo_knowledge/`
and `schemas/*.schema.json` already are.

Contract: `verification/README.md` and `governance/VERIFICATION_AND_CLAIMS.md`.

## Usage

```bash
# SKB (canonical state, resolved from the pulled registry aggregate)
python3 -m tools.verification build --source registry \
  --out verification/state.json --merge

# Consumer repository (public-safe projection for the Portfolio)
python3 -m tools.verification build --source portfolio \
  --out public/verification.json --merge

python3 -m tools.verification verify
python3 -m tools.verification status
```

`--merge` is what implements failure preservation: a claim whose evidence cannot be resolved
in this run carries its previous record forward instead of being erased or downgraded.

## What it does not do

- It never invents evidence. A claim with no resolvable evidence is `unverified`, full stop.
- It never rewrites a `positioning` claim's text, and never marks one `verified`.
- It never writes to another repository, and introduces no credential of its own.
- It never calls an LLM.

## Tests

```bash
python3 -m unittest discover -s tools/verification/tests -p 'test_*.py' -v
```
