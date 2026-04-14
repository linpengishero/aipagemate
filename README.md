<<<<<<< HEAD
# aipagemate

<p align="center">
  <strong>AI-powered landing page generator with reusable component workflow.</strong>
</p>

<p align="center">
  <em>Build launch-ready pages in minutes, not days.</em><br/>
  <em>几分钟生成可上线的落地页与个人博客，而不是几天。</em>
</p>

<p align="center">
  🌐 Website: <a href="https://www.aipagemate.com">https://www.aipagemate.com</a>
</p>

---

## Overview

**aipagemate** is an AI-assisted generation platform focused on:
- **landing pages**
- **personal blogs**

It is intentionally optimized for these high-conversion and content-first scenarios instead of trying to be a generic website builder.

It helps you:
- clarify requirements through AI-guided Q&A,
- generate page plans for landing/blog scenarios,
- generate reusable shared components,
- generate pages that reference shared components via placeholders,
- preview, edit, and export results.

The project focuses on **component reuse across pages**, **structured generation workflow**, and **practical engineering controls** (validation, repair, retry, persistence).

---

## Key Features

- **AI requirement flow** (clarification -> plan -> page plan -> generation)
- **Landing page & personal blog oriented planning and generation**
- **Shared component generation** (project-level)
- **Placeholder-driven page generation** to enforce component reuse
- **Vue SFC validation & repair pipeline** for safer generated code
- **Visual preview workspace** with editing tools
- **Export workflows** (page/project/PDF and related pipelines)
- **IndexedDB project storage** for local persistence

---

## Tech Stack

- **Framework:** Nuxt 3 + Vue 3 + TypeScript
- **Styling:** TailwindCSS
- **State/Composition:** Pinia + VueUse
- **AI Integration:** OpenAI SDK and custom role/orchestrator architecture
- **Persistence:** IndexedDB-based project storage

---

## Quick Demo

1. Create a project in `AI Web Design` workspace.
2. Describe your landing page or personal blog idea in the AI assistant.
3. Confirm design plan and page plan.
4. Generate shared components and pages.
5. Preview, refine, and export.

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn 1.22+

### Install

```bash
yarn install
```

### Run in development

```bash
yarn dev
```

Default dev port in this project is `3006`.

### Build

```bash
yarn build
```

### Start production server

```bash
yarn start
```

### Lint / Type Check

```bash
yarn lint
yarn typecheck
```

---

## Project Structure (high level)

- `pages/aiwebdesign/` – main AI web generation pages and workspace entry
- `components/aiweb/` – project browser, preview workspace, dialogs, web editor UI
- `utils/aiweb/roles/` – AI roles (planner, engineers, runtime helpers)
- `utils/aiweb/orchestrators/` – generation orchestration and workflow logic
- `utils/aiweb/workflows/` – export and post-generation pipelines
- `utils/webDB/` – IndexedDB storage and data access

---

## Architecture Notes

aipagemate uses a staged flow:

1. Requirement analysis and clarification
2. Design planning
3. Page planning (with component planning data)
4. Component generation (project-level reusable assets)
5. Page generation (with mandatory shared-component placeholders)
6. Validation, repair, and persistence

This separation improves controllability and makes reuse more consistent for landing/blog projects.

---

## Roadmap (SaaS)

The upcoming SaaS version is planned to expand beyond the current landing-page focus with:

- **Template Library** for faster project starts
- **Template Marketplace** for publishing and trading templates
- **Online Component Library** for reusable blocks and online editing
- **Automatic payment integration**
- **One-click deployment workflow**
- **More output targets** including Shopify templates, WordPress templates, and React project export

---

## License

This project is licensed under the **Apache-2.0 License**.

See the `LICENSE` file for details.

---