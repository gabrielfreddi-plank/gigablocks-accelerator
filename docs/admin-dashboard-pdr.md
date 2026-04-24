# Product Design Request: Company Administrator Dashboard

**Status:** Draft  
**Created:** 2026-04-24  
**Version:** 1.0

---

## Executive Summary

Implement minimal company administrator dashboard to display and manage core company information. MVP focuses on page setup and core data display without advanced features.

---

## Objectives

1. Provide admin interface for company profile management
2. Display current company stats (user count, active services)
3. Establish foundation for future feature expansion
4. Ensure admin-only access control

---

## Scope (MVP)

### In Scope
- Company information display (name, industry, plan, etc.)
- Current user count metric
- Active services list
- Basic edit form for company info fields
- Admin role verification

### Out of Scope (Phase 2+)
- Advanced analytics
- Service management/provisioning
- User management interface
- Billing/subscription changes
- Audit logs
- Activity tracking

---

## User Stories

### US-1: View Company Dashboard
```
As a company administrator
I want to see dashboard with company overview
So that I can monitor core company metrics
```

**Acceptance Criteria:**
- Dashboard loads company data
- Displays company name, industry, plan type
- Shows current active user count
- Shows list of active services
- Mobile responsive layout

### US-2: Edit Company Information
```
As a company administrator
I want to edit company details
So that I can keep company info current
```

**Acceptance Criteria:**
- Edit form for name, industry, description
- Save changes with validation
- Confirmation toast/alert on save
- Error handling for failed updates

### US-3: Admin Access Control
```
As system administrator
I want only admins to access dashboard
So that sensitive company data is protected
```

**Acceptance Criteria:**
- Route guards prevent unauthorized access
- Non-admins redirected to appropriate page
- Clear permission error messaging

---

## Technical Approach

### Architecture
```
routes/
  admin/
    dashboard/
      page.tsx         // Main dashboard page
      layout.tsx       // Layout wrapper
    company/
      page.tsx         // Edit company info
      
components/
  admin/
    CompanyOverview.tsx     // Stats display
    CompanyEditor.tsx       // Edit form
    ServicesList.tsx        // Active services
```

### Data Model (Existing)
- `companies` table — company metadata
- `users` table — count via filter
- `services` table — active services per company

### API Endpoints (Required)
- `GET /api/companies/:id` — fetch company details
- `PUT /api/companies/:id` — update company info
- `GET /api/companies/:id/users/count` — user count
- `GET /api/companies/:id/services` — active services list

### Auth/Authorization
- Middleware check: `user.role === 'admin'`
- Verify `user.company_id` matches requested company
- Redirect non-admins to `/dashboard`

---

## UI Layout (Minimal)

```
┌─────────────────────────────────────┐
│     Company Admin Dashboard         │
├─────────────────────────────────────┤
│                                     │
│  Company Info Card:                 │
│  ├─ Name, Industry, Plan Type      │
│  ├─ [Edit] Button                  │
│                                     │
│  Quick Stats:                       │
│  ├─ Active Users: X                │
│  ├─ Active Services: X             │
│                                     │
│  Services List:                     │
│  ├─ Service 1 (Active)             │
│  ├─ Service 2 (Active)             │
│                                     │
└─────────────────────────────────────┘
```

---

## Success Metrics

- Dashboard loads in <2s
- Form submission <1s
- Zero permission bypass attempts pass security audit
- Mobile viewport renders correctly at 320px+

---

## Dependencies

- Next.js App Router (existing)
- Database schema (companies, users, services)
- Authentication middleware
- UI component library

---

## Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Unauthorized data access | Role-based middleware check + DB row-level security |
| Stale user count metric | Real-time query or cached with 5min TTL |
| Form validation gaps | Client + server validation with error messages |

---

## Timeline

- **Phase 1 (MVP):** Page setup, data display, basic edit (2-3 days)
- **Phase 2:** Advanced features, audit logs (TBD)

---

## Appendix

### Database Query Examples

**Count active users:**
```sql
SELECT COUNT(*) FROM users WHERE company_id = $1 AND active = true;
```

**Fetch active services:**
```sql
SELECT id, name, status FROM services WHERE company_id = $1 AND status = 'active';
```
