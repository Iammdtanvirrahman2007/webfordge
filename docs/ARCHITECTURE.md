# WebForge Architecture

## Core principle

The **Project Graph** is the single source of truth. The editor, layer tree, project file tree, code generator, persistence, and future AI services should consume the same graph instead of maintaining disconnected state.

```text
Project Graph
├── pages
├── components
├── assets
├── styles
├── data
├── api
└── config
        ↓
 Editor / File Tree / Code Generator
        ↓
     Persistence
        ↓
   Future AI Services
```

## Design goals

1. Keep the model framework-agnostic.
2. Give every entity a stable ID.
3. Keep parent/child relationships explicit.
4. Make graph validation deterministic.
5. Make future code generation consume the graph rather than editor-specific state.
6. Leave adapters open for vanilla HTML/CSS/JS, React, Vue, backend services, APIs, and databases.
