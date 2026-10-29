# PROJECT: SMB Online Operations Platform

## 0. Mission

You are the lead software engineer, system architect, security engineer, QA engineer, and DevOps engineer for a real Korean small-business operations agency.

Build a production-oriented platform for an agency that manages Naver SmartPlace, Google Business Profile, business information, websites, and routine online administration.

This is not a tutorial, mock landing page, or design-only exercise.

**Your objective is to create an actually runnable, tested, deployable business application.**

The interface, user-facing content, notifications, reports, and documentation intended for Korean operators must be written in natural Korean.

## 1. Autonomous execution rules

1. Inspect the current repository and environment before making changes.
2. If an existing project exists, preserve working functionality and extend it.
3. If no project exists, initialize a new Git repository and application.
4. Make reasonable technical decisions without repeatedly asking questions.
5. Execute commands, install dependencies, implement features, run tests, and repair failures.
6. Do not stop after creating a plan, README, or static mockup.
7. Checkpoint work with meaningful commits when Git is available.
8. Use stable, maintained packages and verify their current documentation.
9. Do not hardcode API keys, passwords, service credentials, or tokens.
10. Do not claim a feature is operational until it has been tested.
11. Do not use fake platform integration results as production data.
12. Never bypass login requirements, CAPTCHA, platform restrictions, or access controls.
13. Implement real external profile modifications only with verified customer authorization and supported platform mechanisms.
14. Work autonomously within the existing permissions. If a credential or infrastructure permission is missing, implement a working local alternative, document the blocker, and continue.
15. Never incur paid infrastructure charges, purchase domains, or create paid subscriptions without an authorized spending arrangement.
16. Finish with a working repository and reproducible deployment instructions.

## 2. Preferred technology stack

Use the following default stack unless the actual repository or environment provides a clearly better solution.

Frontend:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Accessible responsive components
- Korean localization

Backend:
- Next.js route handlers or server actions
- TypeScript
- Zod validation
- Explicit authorization checks

Database:
- Supabase PostgreSQL for production
- Real schema and migrations
- Row-level security where appropriate
- Reproducible local/test database configuration

Authentication:
- Secure administrator authentication
- Optional customer portal as a later phase
- Roles: admin, operator, customer
- Server-side authorization

Email:
- Configurable provider adapter
- Real email delivery when verified credentials are available
- Local preview or test transport when credentials are absent

File storage:
- Private storage for customer documents and evidence
- Short-lived signed access URLs where appropriate

AI:
- Server-side provider adapter
- AI-assisted text and report drafting
- Schema-validated generated output
- Manual fallback when no API credential is available

Deployment:
- Prefer a low-cost platform compatible with the stack
- Use a supported Git-based deployment workflow
- Configure environment variables securely
- Deploy only when the necessary account access exists

Avoid adding infrastructure or subscriptions that are unnecessary for the MVP.

## 3. System architecture

Create the following modules.

### A. Public website

Routes or equivalent:

/
 /services
 /pricing
 /free-audit
 /how-it-works
 /cases
 /faq
 /contact
 /privacy
 /terms

Requirements:

- Premium but trustworthy visual design
- Mobile-first responsive layout
- Fast page loading
- Korean SEO metadata
- Clear value proposition
- Strong free-audit conversion flow
- Accessible forms
- Proper loading and error states
- No fabricated testimonials or performance statistics
- Clearly labeled sample case studies

Homepage content should explain:

"네이버 플레이스, 구글 지도, 홈페이지까지. 사장님이 신경 쓰기 번거로운 온라인 관리 업무를 대신 처리합니다."

Primary CTA:

"무료 온라인 정보 진단 신청"

### B. Free audit application

Create an actual working application form.

Fields:

- Business name
- Industry
- Naver Place URL (optional)
- Google Maps/Profile URL (optional)
- Public business website URL (optional)
- Contact person
- Email
- Phone (optional)
- Requested services
- Additional notes
- Privacy consent
- Service contact consent where legally required
- Separate optional marketing consent

Requirements:

- Server-side validation
- Proper consent collection
- Anti-spam honeypot and rate limiting
- No unnecessary sensitive information
- Prevent accidental duplicate submissions
- Generate unique request ID
- Persist application to database
- Display confirmation screen
- Notify administrator
- Send acknowledgment to customer when delivery is configured
- Log delivery status without exposing private data

Customer-facing success must reflect actual persistence.

### C. Admin authentication

Build a secure /admin interface.

Required:

- Login
- Logout
- Session management
- Unauthorized access blocking
- Role-based access control
- Safe initial administrator provisioning process
- No publicly available default admin password
- No client-side-only permission checks

### D. CRM dashboard

Create:

/admin/dashboard
/admin/leads
/admin/leads/[id]
/admin/clients
/admin/tasks
/admin/reports
/admin/settings

Features:

- New applications
- Customers
- Lead status
- Search and filters
- Notes
- Assigned operator
- Due dates
- Work history
- Activity timeline
- Client conversion tracking
- CSV export
- Dashboard KPIs

KPI examples:

- Total inquiries
- New leads
- Free audits underway
- Completed audits
- Paid conversions
- Monthly recurring revenue based on recorded contracts
- Overdue tasks

Do not fabricate metrics for real users.

### E. Workflow engine

Implement this status machine:

NEW
DIAGNOSING
PROPOSAL_READY
AWAITING_APPROVAL
APPROVED
IN_PROGRESS
VERIFYING
COMPLETED

Additional statuses:

ON_HOLD
REJECTED
CANCELLED
REVISION_REQUIRED

Requirements:

- Validate allowed transitions
- Maintain immutable transition history
- Capture timestamps and actor
- Create follow-up tasks when appropriate
- Support failed task retries
- Prevent duplicate processing
- Surface actionable failures

Use a durable job mechanism for deferred work when feasible.

### F. Business profile audit

Build a structured audit module.

Audit fields:

- Business identity
- Naver profile URL
- Google profile URL
- Opening hours
- Contact details
- Address
- Website
- Category
- Business description
- Photos
- Menu or service information
- Update requests
- Source URLs
- Last verified date
- Verification status

Create audit statuses:

VERIFIED
POSSIBLE_ISSUE
MISSING
CUSTOMER_CONFIRMATION_REQUIRED
UNAVAILABLE

Important:

Do not claim that public information has been verified simply because an AI model inferred it.

Do not scrape Naver or Google in ways prohibited by their policies.

Manual data entry must always be available.

Use API-based integrations only when authorized and technically available.

### G. Approval workflow

Build a customer approval record for each proposed profile change.

Each change must include:

- Customer
- Business location
- Platform
- Field to change
- Existing value
- Proposed value
- Reason
- Evidence
- Approval status
- Consent timestamp
- Consent version
- Authorized person
- Final execution status

Changes may not be executed on external profiles without valid authorization.

Where secure identity confirmation cannot be provided, use manual approval verification rather than assuming email ownership equals business ownership.

### H. Platform integration architecture

Define a common provider interface:

BusinessProfileProvider:
- getCapabilities()
- getProfile()
- validateChange()
- prepareChange()
- applyApprovedChange()
- getChangeStatus()

Implement adapters:

1. ManualNaverProvider
2. ManualGoogleProvider
3. GoogleBusinessProfileProvider (feature-flagged)
4. FutureNaverOfficialProvider (only if officially supported)

Manual providers should generate structured work instructions and record evidence of completion.

The Google API provider must remain disabled unless real API access, credentials, required scopes, and customer authorization exist.

Never simulate successful external updates.

Do not implement browser automation to evade platform access controls.

Naver must remain a permission-compliant manual workflow until official integration capabilities are verified.

### I. AI content assistant

Create a module for:

- Business description drafts
- Improvement suggestions
- Customer email drafts
- Review response drafts
- Promotional post drafts
- Monthly activity summaries
- Audit report narratives

Features:

- Editable generated output
- Source and input visibility
- Human approval before external publication
- Clear distinction between verified facts and suggestions
- No unsupported factual claims
- No automated fake reviews
- No invented endorsements

Avoid sending unnecessary personal data to third-party AI providers.

Provide a functioning non-AI template fallback.

### J. Reports

Generate Korean-language business audit and work-completion reports.

Required content:

- Customer and business information
- Audit date
- Checked platforms
- Issues found
- Recommended improvements
- Approved changes
- Executed changes
- Platform status
- Before/after evidence
- Remaining actions
- Completion date

Implement:

- Browser preview
- PDF export
- Report versioning
- Private access controls
- Download support

Use appropriate Korean fonts through a legal distribution method.

The PDF must render Korean text correctly.

### K. Notifications

Implement:

- New lead notification
- Customer acknowledgment
- Approval request notification
- Work completion notification
- Overdue task notice
- Optional monthly report notice

Use provider interfaces and retry-safe delivery.

Do not send unsolicited bulk marketing campaigns.

Marketing consent must remain separate from operational messages.

### L. Subscription and revenue tracking

Create a lightweight internal module for:

- Service packages
- Proposed quotes
- Contracts
- Billing period
- Monthly recurring revenue
- Payment status
- One-off service orders

Do not pretend payment was received.

Do not collect card numbers directly.

Real payment integration is optional and should be enabled only after business and payment-provider requirements are met.

## 4. Database design

At minimum, design and migrate tables for:

- users
- organizations
- businesses
- leads
- clients
- service_packages
- subscriptions
- tasks
- business_profiles
- audits
- audit_items
- proposed_changes
- approvals
- reports
- report_files
- notifications
- activity_logs
- consent_records

Use foreign keys, appropriate unique indexes, timestamps, and database constraints.

Ensure customer data cannot be read across tenants.

Define retention and deletion procedures.

Do not expose server secrets to the browser.

## 5. Automation flows

Implement the following workflows.

### Workflow 1: Lead intake

Form submission
→ Validation
→ Database insertion
→ Lead ID assignment
→ Admin notification
→ Customer acknowledgment
→ Initial audit task creation

### Workflow 2: Audit preparation

New audit task
→ Retrieve provided information
→ Validate sources
→ Build structured audit checklist
→ Generate draft recommendations
→ Mark unverified fields
→ Assign operator

### Workflow 3: Change approval

Operator prepares change
→ Customer receives approval request
→ Approval evidence recorded
→ Authorization validated
→ Approved task enters execution queue
→ Operator or supported API performs change
→ Result verified
→ History updated

### Workflow 4: Completion report

Task completed
→ Collect verified results
→ Create report
→ Generate PDF
→ Store privately
→ Notify client
→ Record completion

### Workflow 5: Monthly maintenance

Active monthly contract
→ Due date reached
→ Create inspection task
→ Notify operator
→ Run permitted checks
→ Generate findings
→ Request customer approval for changes
→ Deliver activity report

### Workflow 6: Sales follow-up

Free service completed
→ Create follow-up task
→ Prepare personalized paid-service proposal
→ Record response
→ Update conversion status

Keep this a legitimate customer follow-up workflow, not an unsolicited mass messaging system.

## 6. Visual design

Design direction:

- Professional Korean SaaS
- White or subtle neutral background
- Dark navy, charcoal, or restrained blue accents
- Minimalist layout
- Strong information hierarchy
- Clear buttons and forms
- Mobile-first design
- Consistent typography
- Accessible contrast
- Empty states and loading states

Avoid excessive animation, fake counters, misleading trust badges, and generic template appearance.

Use actual working components rather than static images of dashboards.

## 7. Security and reliability

Implement or document:

- Input validation
- Server-side authorization
- Database access restrictions
- Rate limiting
- Anti-spam protection
- Secure environment configuration
- Data minimization
- Audit logging
- Private file access
- Sensitive data redaction in logs
- Safe error handling
- No credentials in source control
- Protected production admin provisioning
- Dependency checks
- Backup and recovery guidance
- Consent evidence preservation
- Safe account disconnection and offboarding

Use threat-model thinking for customer impersonation, unauthorized profile modification, exposed customer documents, and accidental mass email sending.

## 8. Testing

Write automated tests where practical.

Required test scenarios:

1. Valid application is saved.
2. Invalid input is rejected.
3. Duplicate requests are handled.
4. Unauthorized admin access is blocked.
5. An operator cannot access another tenant's data.
6. Valid status changes succeed.
7. Invalid status changes fail.
8. A profile change without approval cannot be executed.
9. Consent records are retained.
10. Reports generate successfully.
11. Korean characters render correctly in PDFs.
12. Emails are not falsely marked as delivered.
13. API failures do not create fake success.
14. Notification retries do not send duplicates.
15. A local environment starts without production credentials using documented test alternatives.
16. Mobile screens remain usable.

Run available lint, type-check, unit/integration tests, production build, and browser-based end-to-end tests.

Fix failures and rerun the relevant checks.

## 9. Development phases

### Milestone 1: Foundation

- Initialize project
- Configure dependencies
- Create database schema
- Create application layout
- Configure authentication
- Build public pages

### Milestone 2: Working MVP

- Application form
- CRM dashboard
- Customer records
- Task workflow
- Basic notifications
- Local test environment

### Milestone 3: Operational automation

- Audit module
- Approval records
- Report creation
- PDF export
- Follow-up tasks
- Monthly maintenance scheduler

### Milestone 4: Production readiness

- Security review
- Automated tests
- Failure handling
- Environment configuration
- Deployment
- Live smoke tests

### Milestone 5: Documentation and handoff

- README.md
- .env.example
- Architecture documentation
- Database setup guide
- Deployment guide
- Admin operations guide
- Platform integration limitations
- Cost estimation
- Test report
- Remaining blockers

## 10. Repository structure

Use an organized repository comparable to:

src/
  app/
  components/
  features/
  lib/
  server/
  integrations/
  emails/
  reports/

supabase/
  migrations/

tests/
docs/
scripts/

Do not force this structure when an existing repository already follows a reasonable architecture.

Add an AGENTS.md file describing coding standards, architecture rules, test commands, and safety constraints for future Codex tasks.

## 11. Deployment requirements

Attempt real deployment when the environment provides the required infrastructure access.

Before declaring success:

- Build production bundle
- Run migrations
- Configure production environment
- Validate domain or deployment URL
- Verify public pages
- Submit a test application
- Confirm data persistence
- Test admin login
- Generate a test report
- Verify logs and failure handling

Remove or clearly isolate test records from production reporting.

If deployment is blocked by missing credentials or permissions, do not claim successful deployment.

Instead, deliver a working local build with exact deployment instructions and a short explanation of the blocker.

## 12. Collaboration with ChatGPT Work

If a shared repository contains product or business documents, read them first.

Use these files as project context:

- BUSINESS_PLAN.md
- PRODUCT_REQUIREMENTS.md
- DESIGN_GUIDE.md
- AUTOMATION_WORKFLOWS.md
- CUSTOMER_JOURNEY.md
- ACCEPTANCE_CRITERIA.md

When specifications are unclear, prefer reasonable MVP decisions that minimize cost and complexity.

Document any material architecture decisions.

Do not silently conflict with existing business requirements.

## 13. Mandatory acceptance criteria

The MVP is complete only if:

- The public website works.
- A real application form persists data.
- Admin authentication works.
- An administrator can inspect and manage customers.
- Workflow statuses are actually saved.
- Approval records work.
- Audit records can be created.
- Reports can be generated and downloaded.
- Automatic notifications work in configured environments.
- No platform changes occur without authorization.
- Tests and production build pass.
- Deployment is verified if infrastructure access exists.
- All remaining blockers are accurately documented.

## 14. Final report

At the end, report:

1. Repository location
2. Production URL, if verified
3. Implemented features
4. Commands executed
5. Tests performed and results
6. Database and environment requirements
7. Security measures
8. Actual automation coverage
9. Known limitations
10. Missing third-party permissions or API approvals
11. Remaining work ordered by priority

Distinguish:

- Implemented
- Tested locally
- Deployed
- Verified in production
- Blocked

Never describe mock behavior as a real integration.

**Start implementation immediately. Continue through coding, testing, debugging, and deployment verification to the maximum extent supported by the environment.**