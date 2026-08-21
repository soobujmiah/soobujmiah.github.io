# Portfolio Content — Public Curation Layer

This file defines the public-facing content direction for the portfolio.

## Source-of-truth model

`soobujmiah/skb` is the private knowledge/source layer. This repository is the public presentation layer.

Before publishing a new claim here:

1. Prefer verified repository/device evidence over assumptions.
2. Distinguish vision, implemented code, tested behavior, and production readiness.
3. Keep private context, credentials, secrets, and unnecessary personal data out.
4. Prefer concise public claims over exhaustive technical detail.

## Positioning

**Operations Support · Linux Systems · On-Device AI**

Core message:

> An operations professional who can also build, automate, document, and troubleshoot the technology that removes friction from real-world work.

## Public capability pillars

### Operations & Administration
- Office administration
- Records and document management
- Data entry and processing
- Registration workflows
- Progress reporting
- Logistics and coordination
- Back-office support

### Digital Operations
- Social media management
- Website SEO and content updates
- Email marketing
- Graphics and promotional video
- Digital workflow support

### Linux & Android Systems
- Termux and PRoot Linux
- Debian userspace
- Termux:X11 and desktop environments
- Shell automation
- Linux troubleshooting
- Android-as-Linux-workstation engineering
- Mesa / Zink / Turnip / Vulkan investigation

### Local AI & LLM Systems
- llama.cpp and GGUF workflows
- Offline/local LLM deployment
- Model lifecycle and integrity
- AI-agent workflows
- RAG/OCR/agent architecture
- Android automation boundaries

### Software & Engineering
- Kotlin / Android / Compose
- C++ / JNI
- Python
- HTML / CSS / JavaScript
- Git / GitHub / CI
- Technical documentation

## Signature story

A defining differentiator is building and testing Linux and local-AI tooling primarily from an Android phone rather than relying on a conventional PC.

Public framing:

> **I turned an Android phone into my Linux development workstation.**

This should emphasize the engineering process and evidence, not imply that every acceleration path is production-ready.

## Selected work

### LAI
Bangla-first local AI and Android automation runtime. Public claims should emphasize local CPU inference, model integrity, diagnostics, and consent-driven automation. Vendor Vulkan acceleration should not be presented as a stable production feature while the device-driver crash remains unresolved.

### NpuHub
Vendor-neutral local-AI platform/reference architecture covering backend abstraction, RAG, OCR, model/runtime boundaries, and agent foundations.

### Ternux
Android-to-Linux workstation project covering Termux/PRoot Debian, X11 desktop integration, graphics-stack investigation, automation, and technical evidence.

### RGEN
Document automation connected directly to real education/administrative workflows.

### DataKhoj
Cross-platform data-collection architecture spanning Android/Kotlin and Python extraction workflows.

### GGEN
Documentation-first AI Creative & Document Studio foundation with optional local, cloud, or custom AI.

### Sobkichu
Bangladesh-first hyperlocal super-app architecture/prototype. Present as a product/architecture vision and tested slices, not as a finished production platform.

## Professional narrative

Sobuj's differentiator is the combination of real-world operations experience and self-directed systems engineering:

> **I understand the process — and I can build the technology that makes the process better.**

## Working principles

- Document everything.
- Verify before reporting.
- Own the outcome.
- Privacy/local-first where appropriate.
- Evidence over claims.
- Failed experiments are useful when they are documented honestly.

## Claims to avoid

Do not publish:

- unverified production-readiness claims
- stable GPU/NPU acceleration claims where runtime evidence contradicts them
- formal engineering credentials that do not exist
- private SKB context
- credentials, tokens, private keys, or private datasets
- inflated project maturity or user/customer numbers
