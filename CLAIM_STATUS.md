# Public Claim Status & Evidence Model

This document defines how technical claims are categorized and presented publicly in the portfolio.

## 1. Verified

Claims supported by current repository evidence, automated test suites, repeatable physical device validation, or established professional track record.

- **ARM64 Native Toolchain (ADT):** Native aarch64 `aapt2` resource linking with Android 35 platform APIs, JVM `d8` bytecode compilation (`classes.dex`), and host `apksigner` v1/v2/v3 verification.
- **Agent-Assisted Device Development Workflow:** Claude Code operating as the on-device coding/engineering agent inside PRoot Debian ARM64; GitHub Actions CI for remote builds, ADB for deployment to the physical Redmi Turbo 4 Pro, and an iterative diagnose → fix → rebuild → redeploy → retest cycle — evidenced by this repository's own commit history.
- **GGEN Pure-Dart Engine Core:** 143 passing unit tests in `packages/ggen_core` (237 app tests); deterministic `TextFlowEngine` with conservation invariant `rendered + overflow == story.length`; transactional `.ggen` persistence with SHA-256 state receipts.
- **LAI On-Device CPU Inference:** Real ARM64 llama.cpp CPU adapter with Qwen 2.5 1.5B GGUF; verified 12–20 tok/s decode; 0.5–0.7s TTFT with KV-prefix caching; SHA-256 model checksum verification.
- **Ternux Linux Workstation on Android:** Turnkey no-root PRoot Debian ARM64 environment; X11 desktop via Termux-X11; TCP PulseAudio routing; direct acceleration on `/dev/kgsl-3d0`.
- **Songjog Business Ledger:** 74/74 passing CI tests; SQLite local persistence; deterministic minor-unit BDT integer arithmetic (no floats); persistent JSONL telemetry surviving process restarts.
- **DataKhoj Android Core:** Kotlin/Jsoup extraction engine with pure-JVM `:core`; Room database backed by 85 contract assertions.
- **Technical Operations & Administration:** 8+ years across industrial progress reporting (Saudi Aramco / PCMC gas-plant projects) and institutional administrative operations (Rabeya Education Family).

## 2. Experimental / Research

Capabilities under active development, dependent on device/driver constraints, or undergoing qualification before production status.

- **Adreno Vulkan Acceleration:** Symbolized `SIGSEGV` in `vkCmdBindPipeline+0x4` in vendor `vulkan.adreno.so` on Snapdragon 8s Gen 4 / Adreno 825 during matrix multiplication (`MUL_MAT`). Contained by fail-closed CPU-default routing.
- **NPU / Hexagon / QNN / LiteRT:** Abstraction interfaces and fallback logic defined in DataKhoj; native NPU kernel execution remains in qualification.
- **Multi-Step Autonomous Agent Loops:** High-privilege tool execution gated by explicit user proposals and Shizuku allowlists; autonomous multi-step loops remain under active research.
- **Bangla Vision OCR:** Model boundary defined; custom Bangla printed/handwritten OCR model integration in progress.

## 3. Historical Benchmark

Measurements observed during specific test configurations on defined hardware — not universal production guarantees.

- **465 FPS:** Peak frame rate recorded in `glmark2-es2` via Mesa Turnip + Zink translation on Redmi Turbo 4 Pro (Adreno 825).
- **12–20 tok/s:** Observed decode rate running Qwen 2.5 1.5B Q4_K_M on 8-core arm64-v8a CPU with 4 threads.
- **0.5–0.7s TTFT:** Time-to-first-token recorded on prompt evaluation with warm KV cache on physical hardware.

## Public Presentation Axioms

> **Evidence over assumptions.**  
> **Root cause over symptoms.**  
> **Verification over claims.**
