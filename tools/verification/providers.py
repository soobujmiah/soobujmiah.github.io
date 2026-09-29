"""Evidence providers -- the only place this package touches the filesystem or network.

Two providers, both read-only:

``RegistryProvider``
    SKB-side. Reads the already-pulled canonical aggregate in ``projects/registry/``.
    Optionally uses a GitHub API token for the ``public_repository`` / ``github_pages``
    evidence types; without a token those claims simply do not resolve, which is an honest
    ``unverified`` rather than a fabricated result.

``PortfolioProvider``
    Consumer-side (``soobujmiah/soobujmiah.github.io``). Reads the repository's own
    ``.repo/project.yaml`` from disk and every other repository's state through the GitHub
    REST API. It only ever has the ambient, same-repository ``GITHUB_TOKEN`` that GitHub
    Actions provides to every job, so it can read public repositories and nothing else --
    private repositories return 404 and their claims resolve to ``unverified``. That is the
    security boundary, enforced by GitHub rather than by this module.

No provider in either direction writes anywhere, and neither holds a PAT or an App key.
"""
from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

API_ROOT = "https://api.github.com"
API_VERSION = "2022-11-28"


def _now_z(value: Any) -> str | None:
    if isinstance(value, str) and value:
        return value
    return None


def _extract_state_field(state: dict[str, Any], field: str) -> dict[str, Any] | None:
    if field == "build.status":
        return state.get("build") or {}
    if field == "test.status":
        return state.get("test") or {}
    if field == "head.commit":
        head = state.get("head") or {}
        return {
            "status": "present" if head.get("commit") else "unknown",
            "at": head.get("committed_at"),
            "commit": head.get("commit"),
        }
    if field == "sync.status":
        sync = state.get("sync") or {}
        head = state.get("head") or {}
        return {
            "status": sync.get("status") or "unknown",
            "at": sync.get("last_synced_at") or sync.get("attempted_at") or head.get("committed_at"),
            "commit": head.get("commit"),
        }
    if field in ("phases.source", "phases.active", "phases.next", "phases.completed"):
        phases = state.get("phases") or {}
        build = state.get("build") or {}
        sync = state.get("sync") or {}
        head = state.get("head") or {}
        at = build.get("at") or sync.get("last_synced_at") or sync.get("attempted_at") or head.get("committed_at")
        commit = build.get("commit") or head.get("commit")
        run_id = build.get("run_id")
        source = phases.get("source") or "not_configured"
        if field == "phases.source":
            val = source
        elif source == "not_configured":
            val = "unknown"
        elif field == "phases.active":
            val = phases.get("active") or "none"
        elif field == "phases.next":
            val = phases.get("next") or "none"
        else:
            completed = phases.get("completed") or []
            val = ", ".join(completed) if completed else "none"
        return {"status": val, "at": at, "commit": commit, "run_id": run_id}
    return None


class RegistryProvider:
    """Resolve evidence from SKB's ``projects/registry/<project_id>.json`` aggregate."""

    def __init__(self, registry_dir: Path, token: str = "") -> None:
        self.registry_dir = Path(registry_dir)
        self.token = token
        self._public_cache: dict[str, bool | None] = {}

    def _is_public(self, repository: str | None) -> bool | None:
        """True/False from the API, or None when no token is available. Never guesses: an
        unknown answer keeps a claim internal rather than risking a private repository
        reaching a public projection."""
        if not repository:
            return None
        if repository in self._public_cache:
            return self._public_cache[repository]
        info = self._api_get(f"{API_ROOT}/repos/{repository}")
        result = None if info is None else (info.get("private") is False)
        self._public_cache[repository] = result
        return result

    # -- repository_state -------------------------------------------------
    def _registry_entry(self, project_id: str) -> dict[str, Any] | None:
        path = self.registry_dir / f"{project_id}.json"
        if not path.exists():
            return None
        try:
            with path.open("r", encoding="utf-8") as fh:
                return json.load(fh)
        except (OSError, json.JSONDecodeError):
            return None

    def _state_block(self, entry: dict[str, Any], field: str) -> dict[str, Any] | None:
        return _extract_state_field(entry, field)

    # -- API --------------------------------------------------------------
    def _api_get(self, url: str) -> dict[str, Any] | None:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, OSError, json.JSONDecodeError):
            return None

    def resolve(self, evidence_type: str, spec: dict[str, Any]) -> dict[str, Any] | None:
        if evidence_type == "repository_state":
            entry = self._registry_entry(spec.get("project_id", ""))
            if entry is None:
                return None
            block = self._state_block(entry, spec.get("field", ""))
            if block is None:
                return None
            repository = entry.get("repository") or spec.get("repository")
            return {
                "type": "repository_state",
                "project_id": spec.get("project_id"),
                "repository": repository,
                "field": spec.get("field"),
                "value": block.get("status"),
                "at": block.get("at"),
                "commit": block.get("commit"),
                "run_id": block.get("run_id"),
                "public": self._is_public(repository),
                "url": _repo_yaml_url(repository, (entry.get("provenance") or {}).get("source_commit") or (entry.get("head") or {}).get("branch") or "main"),
            }
        if evidence_type == "public_repository":
            info = self._api_get(f"{API_ROOT}/repos/{spec.get('repository')}")
            if info is None:
                return None
            return {
                "type": "public_repository",
                "repository": spec.get("repository"),
                "value": "public" if info.get("private") is False else "private" if info.get("private") is True else "unknown",
                "public": info.get("private") is False,
                "at": _now_z(info.get("pushed_at")),
                "url": info.get("html_url"),
            }
        if evidence_type == "github_pages":
            repositories = spec.get("repositories") or []
            results, stamps = [], []
            for repository in repositories:
                info = self._api_get(f"{API_ROOT}/repos/{repository}")
                if info is None:
                    return None
                results.append({"repository": repository, "has_pages": bool(info.get("has_pages")),
                                "public": info.get("private") is False})
                stamps.append(info.get("pushed_at"))
            if not results:
                return None
            published = all(r["has_pages"] for r in results)
            return {
                "type": "github_pages",
                "repositories": results,
                "value": "published" if published else "not_published",
                "public": all(r["public"] for r in results),
                "at": max((s for s in stamps if s), default=None),
                "url": f"https://api.github.com/repos/{repositories[0]}",
            }
        return None


def _repo_yaml_url(repository: str | None, branch: str = "main") -> str | None:
    if not repository:
        return None
    from urllib.parse import quote
    return f"https://github.com/{repository}/blob/{quote(branch, safe='')}/.repo/project.yaml"


class PortfolioProvider:
    """Resolve evidence for the public Portfolio: local ``.repo/project.yaml`` plus the
    public GitHub API for every other repository it references."""

    def __init__(self, root: Path, token: str = "", project_id: str = "portfolio") -> None:
        self.root = Path(root)
        self.token = token
        self.project_id = project_id
        self._repo_cache: dict[str, dict[str, Any] | None] = {}
        self._state_cache: dict[str, dict[str, Any] | None] = {}

    # -- local ------------------------------------------------------------
    def _local_state(self) -> dict[str, Any] | None:
        path = self.root / ".repo" / "project.yaml"
        if not path.exists():
            return None
        try:
            import yaml  # local import: PyYAML is the only third-party dependency
        except ImportError:  # pragma: no cover
            return None
        try:
            with path.open("r", encoding="utf-8") as fh:
                return yaml.safe_load(fh)
        except Exception:
            return None

    # -- API --------------------------------------------------------------
    def _api_get(self, url: str) -> dict[str, Any] | None:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, OSError, json.JSONDecodeError):
            return None

    def _repo_info(self, repository: str) -> dict[str, Any] | None:
        if repository not in self._repo_cache:
            self._repo_cache[repository] = self._api_get(f"{API_ROOT}/repos/{repository}")
        return self._repo_cache[repository]

    def _remote_state(self, repository: str, branch: str) -> dict[str, Any] | None:
        key = f"{repository}@{branch}"
        if key in self._state_cache:
            return self._state_cache[key]
        url = f"{API_ROOT}/repos/{repository}/contents/.repo/project.yaml?ref={branch}"
        info = self._api_get(url)
        state: dict[str, Any] | None = None
        if info and isinstance(info.get("content"), str):
            try:
                import yaml
                state = yaml.safe_load(base64.b64decode(info["content"]).decode("utf-8"))
            except Exception:
                state = None
        self._state_cache[key] = state
        return state

    def _state_for(self, spec: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        """Return (project_state, repo_info) for the claim's target repository."""
        repository = spec.get("repository")
        project_id = spec.get("project_id")
        if project_id == self.project_id and (self.root / ".repo" / "project.yaml").exists():
            return self._local_state(), self._repo_info(repository) if repository else None
        if not repository:
            return None, None
        info = self._repo_info(repository)
        if info is None:
            return None, None
        branch = info.get("default_branch") or "main"
        return self._remote_state(repository, branch), info

    def resolve(self, evidence_type: str, spec: dict[str, Any]) -> dict[str, Any] | None:
        if evidence_type == "repository_state":
            state, info = self._state_for(spec)
            if state is None:
                return None
            field = spec.get("field", "")
            block = _extract_state_field(state, field)
            if block is None:
                return None
            repository = spec.get("repository")
            if info is not None:
                repository = info.get("full_name") or repository
            return {
                "type": "repository_state",
                "project_id": spec.get("project_id"),
                "repository": repository,
                "field": field,
                "value": block.get("status"),
                "at": block.get("at"),
                "commit": block.get("commit"),
                "run_id": block.get("run_id"),
                "public": None if info is None else (info.get("private") is False),
                "url": _repo_yaml_url(repository, (state.get("head") or {}).get("branch") or "main"),
            }
        if evidence_type == "public_repository":
            info = self._repo_info(spec.get("repository", ""))
            if info is None:
                return None
            return {
                "type": "public_repository",
                "repository": spec.get("repository"),
                "value": "public" if info.get("private") is False else "private" if info.get("private") is True else "unknown",
                "public": info.get("private") is False,
                "at": _now_z(info.get("pushed_at")),
                "url": info.get("html_url"),
            }
        if evidence_type == "github_pages":
            repositories = spec.get("repositories") or []
            results, stamps = [], []
            for repository in repositories:
                info = self._repo_info(repository)
                if info is None:
                    return None
                results.append({"repository": repository, "has_pages": bool(info.get("has_pages")),
                                "public": info.get("private") is False})
                stamps.append(info.get("pushed_at"))
            if not results:
                return None
            published = all(r["has_pages"] for r in results)
            return {
                "type": "github_pages",
                "repositories": results,
                "value": "published" if published else "not_published",
                "public": all(r["public"] for r in results),
                "at": max((s for s in stamps if s), default=None),
                "url": f"https://api.github.com/repos/{repositories[0]}",
            }
        return None
