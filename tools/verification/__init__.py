"""Deterministic claim verification for the SKB ecosystem.

Canonical home: ``tools/verification/`` in ``soobujmiah/skb``. Vendored into consumer
repositories (currently ``soobujmiah/soobujmiah.github.io``) exactly the way
``tools/repo_knowledge/`` and ``schemas/*.schema.json`` already are.

The contract this package implements is ``verification/README.md`` and
``governance/VERIFICATION_AND_CLAIMS.md``. In short:

* a **claim** is a statement, classified either ``evidence_backed`` or ``positioning``;
* **evidence** is never stored here -- it is read at resolution time from the canonical
  source (``.repo/project.yaml`` in each repository, ``projects/registry/`` in SKB, or the
  GitHub API);
* resolution is pure and deterministic: no LLM, no wall-clock ``verified_at``, and merging
  that never erases the last known good evidence.
"""

__all__ = ["core", "providers", "validate"]
