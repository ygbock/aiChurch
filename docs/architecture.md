# Church OS Architecture Guidelines

This document outlines the developer platform governance and structural strategy for the FaithFlow Church OS Platform.

## 1. Domain-Driven Modular Architecture
**Rule:** All features MUST belong to a module in `/src/modules/<name>`.
- The `pages/` directory is strictly forbidden for monolithic pages.
- A module can only expose elements via its index (`<name>.module.tsx`).
- Modules should not deep-import files from inside other modules. Use typed contracts instead.

## 2. Event Standards
**Rule:** Cross-domain effects MUST rely on the EventBus.
- Direct mutations across modules are disallowed.
- E.g. A finance donation should publish `DONATION_COMPLETED` rather than directly updating `membership` stats.
- **Event Envelope Constraint:** Every event must conform to `StandardEvent`:
  ```json
  {
    "eventId": "uuid",
    "eventType": "string",
    "organizationId": "string",
    "districtId": "string",
    "branchId": "string",
    "actorId": "string",
    "correlationId": "string",
    "timestamp": "iso-date",
    "version": "1.0",
    "data": {}
  }
  ```

## 3. RBAC Rules
**Rule:** Modules must evaluate permissions locally before rendering via `usePermissions()`.
- Standardize access via `hasPermission('module.action')`.
- Fallbacks should be graceful (hide UI elements rather than exploding the view).

## 4. Naming Conventions
- React Components: PascalCase
- Folders inside modules: `pages/`, `components/`, `hooks/`, `services/`, `store/`. All lowercase.
- Events: UPPER_SNAKE_CASE (e.g., `MEMBER_REGISTERED`).

## 5. State Isolation Rules
**Rule:** State managers (Zustand, Context) MUST NOT be updated by other modules directly.
- The Finance Module cannot import and call `setMembershipTotal`.
- Use local selectors. Share state reading via explicit contracts if necessary.

## 6. Widget Contracts
**Rule:** Dashboard UI is composed via the `DashboardWorkspace` component.
- Modules must register their widgets to `WidgetRegistry`.
- Widgets must handle their own data fetching, loading UI, ErrorBoundaries, and caching.
- If a widget fails, the rest of the workspace MUST remain operational.

## 7. Tenant Rules
**Rule:** The app operates on a multi-tenant hierarchy (Organization -> District -> Branch).
- Every Firestore path MUST use the tenant structure.
- Example: `districts/{districtId}/branches/{branchId}/members`
- You must always extract tenant ID from `useTenant()`.
