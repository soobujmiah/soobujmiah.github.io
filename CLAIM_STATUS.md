# Public Claim Status

This document defines how technical claims are presented publicly in the portfolio.

## Verified

Claims supported by current repository evidence, repeatable device/runtime testing, or established professional experience.

- Operations and office administration experience.
- Linux/Android workstation work using Termux, PRoot/Debian and X11 tooling.
- Local LLM experimentation and deployment using llama.cpp/GGUF workflows.
- Git/GitHub-based software development and technical documentation.
- LAI CPU-side local inference and the documented Android automation/runtime architecture.
- Device-specific diagnostics and runtime investigation.

## Experimental

Capabilities under active development, dependent on device/runtime constraints, or not yet suitable to describe as stable production features.

- Vulkan acceleration paths on the Redmi Turbo 4 Pro / Adreno 825 environment.
- GPU-accelerated llama.cpp execution where the proprietary Qualcomm Vulkan driver remains a limiting factor.
- NPU/QNN acceleration and related backend work that has not yet passed the project's qualification gates.
- Experimental AI-agent, RAG/OCR, and automation integrations when the specific implementation is still evolving.

Experimental claims should use language such as "investigating", "prototype", "experimental", or "under development".

## Historical benchmark

Measurements that were genuinely observed during a particular test/configuration but should not be interpreted as current production capability.

- Historical graphics/runtime benchmark figures such as **465 FPS**.
- Historical **8K context** test/configuration claims.
- Other one-off performance numbers tied to a specific device, driver, model, build, resolution, or runtime configuration.

Historical benchmark figures must include enough context to prevent readers from interpreting them as guaranteed current performance.

## Public presentation rule

A benchmark is evidence of what happened in a defined test; it is not automatically a product capability. A project vision is not automatically an implemented feature. A working experiment is not automatically production-ready.

The portfolio therefore uses this hierarchy:

**Verified → current public capability**  
**Experimental → active/limited development**  
**Historical benchmark → observed past measurement**

Private SKB context, credentials, secrets, and unsupported claims are never promoted to the public portfolio merely for completeness.
