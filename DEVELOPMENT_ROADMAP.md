# Faith Healing Bible Church System - Development Roadmap

This document outlines the structured development roadmap for the church management system. As the application grows in complexity—with multiple dashboards, roles, and modules—this roadmap will serve as our guide to ensure logical progression and prevent feature fragmentation.

## Phase 1: Foundation & Core Architecture 🟡 (Nearing Completion)
*Objective: Establish the base infrastructure, data hierarchy, and security protocols.*

- [x] Firebase Project Configuration & Authentication Setup.
- [x] Hierarchical Data Modeling (Global System > Districts > Branches > Members).
- [x] Role-Based Access Control (RBAC) System (`superadmin`, `district`, `admin`, `member`).
- [x] Initial UI Shell & Navigation Layout based on Roles.
- [x] Security Rules formulation for core structural collections.
- [ ] Complete `users` and `accessControl` synchronization safety checks.

## Phase 2: People & Leadership Management 🟢 (Current Focus)
*Objective: Unify how members are created, managed, and promoted to leadership across all tiers.*

- [x] Standardized Member Creation (Global, District, Branch levels).
- [x] Centralized Leadership Provisioning (Linking Auth accounts to existing member records).
- [x] Force Password Change flow for newly provisioned leaders.
- [ ] Member Profile Detail Views (Personal info, family ties, ministerial involvement).
- [ ] Member Transfer System (Moving members seamlessly between Branches/Districts).
- [ ] Advanced Member Filtering & Bulk Operations.

## Phase 3: Branch Operations & Pastoral Care ⚪️ (Upcoming)
*Objective: Empower Branch Admins and Pastors to manage day-to-day church activities.*

- [ ] Dedicated **Branch Admin Dashboard** refinement.
- [ ] **Attendance Tracking:**
  - Service definitions (Sunday Service, Bible Study, etc.).
  - Headcount submissions vs. Individual check-ins.
- [ ] **First Timers & Guest Management:**
  - Data capture for visitors.
  - Follow-up pipelines and conversion tracking.
- [ ] **Care Groups / Cells:**
  - Creation of smaller sub-groups within branches.
  - Cell leader assignments and meeting reports.
- [ ] **Milestones & Sacraments:**
  - Tracking Baptisms, Dedications, Marriages.
  - Baptism request workflows (Approval pipeline up to District/HQ).

## Phase 4: Financial Management & Reporting ⚪️ (Planning)
*Objective: Secure, transparent, and hierarchical management of church funds and remittances.*

- [ ] **Income Tracking:**
  - Categorized tracking (Tithes, Offerings, Pledges, Special Projects).
  - Individual giving histories (restricted access to Financial Secretaries).
- [ ] **Expense Management:**
  - Expense logging, categorization, and digital approval workflows.
- [ ] **Remittance System:**
  - Automated calculation of Headquarter/District percentages.
  - Remittance tracking and status updates (Pending, Submitted, Acknowledged).
- [ ] **Financial Analytics:**
  - Revenue vs Expense charts.
  - District vs Branch performance comparisons for Superadmins.

## Phase 5: Member Experience & Engagement ⚪️ (Planning)
*Objective: Provide a seamless front-end experience for everyday church members.*

- [ ] **Member Portal Dashboard:**
  - Viewing personal profile and dependent (children) information.
  - Securely viewing personal giving history/statements.
- [ ] **Announcements & Notifications:**
  - Global, District, and Branch-specific broadcast messages.
- [ ] **Resource Library:**
  - Uploading and sharing sermon notes, videos, or doctrinal materials.

## Phase 6: System Hardening & Polish ⚪️ (Finalization)
*Objective: Ensure absolute security, data integrity, and high-quality user experience.*

- [ ] **Audit Logging:**
  - Comprehensive trail of who did what and when (especially for financial and access-level changes).
- [ ] **Data Export/Import:**
  - CSV/Excel export for members and financial records.
  - Safe import tools for migrating legacy church data.
- [ ] **Automated Communications:**
  - Email/SMS triggers for birthdays, anniversaries, or leadership appointments.
- [ ] **Final UI/UX Polish:**
  - Comprehensive responsive design review.
  - Accessibility (a11y) enhancements.
- [ ] **Comprehensive Firestore Security Rules Audit.**

---
*Note: This roadmap should be updated dynamically as features are completed or as new prioritized requirements emerge.*
