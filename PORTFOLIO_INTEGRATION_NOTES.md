# Portfolio claim-status integration

The public claim-status page is available at `claims.html`.

This safe branch is based directly on `main` and intentionally leaves `index.html` unchanged. This prevents a partial/truncated file response from damaging the existing portfolio body, scripts, structured data, or UI.

## Status
- Verified / Experimental / Historical Benchmark taxonomy: implemented in `claims.html` and `CLAIM_STATUS.md`.
- Main-page metadata/navigation integration: deferred until a complete, lossless `index.html` edit can be applied.
- Existing portfolio body and runtime: unchanged on this branch.
