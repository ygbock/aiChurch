# Church OS Architecture & Governance Rules

## Cross-Domain Boundaries

Modules **CANNOT**:
- directly mutate another module’s state
- directly import another module’s stores
- bypass permissions
- bypass tenant context

Modules **MAY**:
- emit events
- consume contracts
- call approved APIs
- use shared services

*This is a mandatory engineering policy.*

## Performance Optimization

When adding or expanding features, implement the following optimizations:
- Route chunk splitting
- Widget-level lazy loading
- Dynamic imports
- Background prefetching
- Module-level caching

*Goal: keep the platform scalable as modules grow.*

## Frontend Governance Standard

Going forward, new features **MUST**:
- belong to a module (in `/src/modules/`)
- avoid the `pages/` directory (no new monolithic pages allowed)
- expose typed contracts
- emit events where appropriate
- respect tenant boundaries (`useTenant`)
- respect RBAC (`usePermissions`)
- support feature flags (`useFeatureFlags`)

## Target End State Architecture

The final platform architecture should resemble a modular enterprise ERP / ministry operating system:

```text
Church ERP Operating System

Core Platform
│
├── Authentication
├── RBAC
├── Tenant Context
├── Event System
├── Analytics
├── Audit
├── Notifications
├── Feature Flags
├── Platform Registry
│
├── Finance Module
├── Membership Module
├── Attendance Module
├── Bible School Module
├── Events Module
├── Welfare Module
├── Communications Module
├── Ministries Module
└── Administration Module
```

## Long-Term Platform Vision

We are building:
- a modular enterprise ERP
- a ministry operating system
- a multi-tenant SaaS platform
- a fintech-enabled church ecosystem

The architecture supports:
- national organizations
- district hierarchies
- branch ecosystems
- thousands of concurrent users
- mobile applications
- external integrations
- AI automation
- analytics pipelines
