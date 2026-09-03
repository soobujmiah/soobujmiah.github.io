# Portfolio Content & Positioning Policy

This document defines the professional positioning and curation standards for the public portfolio.

## Primary Positioning

> **Independent Software & AI Systems Engineer**  
> **On-Device AI • Android • Linux • ARM64 • GPU/NPU**

Core identity statement:
> An independent software and AI systems engineer focused on on-device AI, Android, Linux, ARM64, and GPU/NPU acceleration. Self-taught and evidence-driven, backed by an 8+ year operational foundation in industrial safety, progress reporting, and institutional systems, building and validating software systems from first principles.

## Core Specializations & Disciplines

### 1. ARM64 Toolchain & Developer Tooling
- Native ARM64 Linux and Android development environments
- Compilers: Clang, LLVM, GCC
- Build systems: CMake, Ninja, Make, Gradle
- Tooling: Android SDK/NDK, AAPT2, D8/R8, apksigner, Flutter/Dart, Python, Git
- Capability statement: *Building and validating development toolchains for ARM64 Android/Linux environments, including compilers, build systems, SDK/NDK tooling, native dependencies, and real-device workflows.*

### 2. On-Device AI Systems & Inference
- Local LLM deployment using llama.cpp and GGUF quantization
- KV-cache prefix reuse and multithreaded CPU tuning
- Model checksum verification (SHA-256) and offline lifecycle management
- RAG, OCR, and AI agent workflow boundaries

### 3. Linux Userspace on Android & Graphics Virtualization
- PRoot Debian ARM64 on Android without root
- Termux-X11 desktop integration and Xfce4
- Mesa Turnip (Vulkan) + Zink (OpenGL-on-Vulkan) translation layers
- D-Bus system services and TCP-routed PulseAudio

### 4. Android Native & System Automation
- Kotlin and Flutter development with strict user-consent models
- Accessibility service integration and Shizuku (UID 2000) privileged execution
- Replay-protected audit hash chains and Scoped Storage / SAF

### 5. Real-Device Engineering & Root-Cause Debugging
- Execution model: *Device → Environment → Toolchain → Build → Deploy → Validate → Diagnose → Document*
- Debugging loop: *Symptom → Reproduce → Evidence → Localize → Hypothesis → Experiment → Root Cause → Fix → Verify → Document*
- Agent-assisted loop: Claude Code operates as the on-device coding/engineering agent inside the PRoot Debian workstation; GitHub Actions CI handles remote builds, ADB handles deployment to the physical device, and failures feed back into another fix → rebuild → redeploy → retest pass.
- Physical hardware: Redmi Turbo 4 Pro (`25053RT47C`, Snapdragon 8s Gen 4 / `SM8735`, Adreno 825, 12 GB RAM, Android 16 API 36)

### 6. Operations & Data Pipelines
- 8+ years across industrial reporting (Saudi Aramco / PCMC gas plants) and educational administration (Rabeya Education Family)
- Deterministic document generation and Jsoup data extraction
- Core rule: *Document everything, verify before reporting, own the outcome.*

## Project Hierarchy

### Flagship Projects
- **GGEN:** AI Creative & Document Studio (Pure Dart core, 143 unit tests, deterministic `TextFlowEngine`, `.ggen` persistence with SHA-256 receipts).
- **LAI:** Bangla-First Local AI & Automation Runtime (llama.cpp CPU inference 12–20 tok/s, Shizuku consent gates, symbolized driver diagnostics).

### Systems, Toolchains & Research
- **Ternux:** No-Root Linux Workstation on Android (PRoot Debian + Mesa Turnip/Zink on Adreno 825).
- **ADT:** Android Development Toolchain for ARM64 Linux (AAPT2 + D8 + apksigner pipeline).

### Supporting Work
- **DataKhoj:** Universal structured data extractor (Kotlin + Jsoup, Room DB with 85 contract assertions).
- **Songjog:** Owner-facing Flutter business ledger (SQLite, deterministic integer minor-unit BDT, 74 tests).
- **RGEN:** Document automation engine (Dual Python & Dart PDF rendering).
- **DocDr:** Mobile-first document workspace (Flutter); clean from-scratch rebuild of the document-generation approach proven in RGEN work. Early development, not yet released.
- **Sobkichu:** Hyperlocal Bangladesh super-app architecture specification.

## Excluded Content

- Personal family roles ("Father") or family-centric biographies
- Personal relationship or non-professional life stories
- Unverified production claims or fabricated benchmarks
- Private credentials, tokens, or unredacted internal datasets
