# Expense Tracker

A full-stack, multi-tenant Expense Tracker application built with React, TypeScript, Express, Prisma, and PostgreSQL.

The application allows users to manage expenses, budgets, spending reports, and CSV exports through a modern dashboard. It also supports tenant/workspace isolation, role-based authorization, subscription plans, licensing, and plan-based feature entitlements.

## Features

### Core Expense Features

- User registration and login
- JWT authentication
- Protected API routes
- Create expenses
- View expenses
- Update expenses
- Delete expenses
- Filter expenses by month
- Filter expenses by category
- Clear filters
- Monthly expense summary
- Total expense calculation
- Average expense calculation
- Highest expense calculation
- Category-wise expense totals
- Input validation
- Future-date validation
- Pagination
- Infinite scrolling
- Error handling
- Loading states
- Empty states

### Multi-Tenant Workspaces

The application supports multiple isolated workspaces/tenants.

Features include:

- Create a new workspace
- Join an existing workspace using a workspace slug
- Tenant-specific expense data
- Tenant-specific budgets
- Tenant-specific subscriptions
- Tenant isolation enforced on the backend
- Workspace slug validation
- Tenant-aware JWT authentication

When a new workspace is created, the first user becomes the workspace `OWNER`.

Users joining an existing workspace are assigned the `MEMBER` role.

### Roles

The application supports three roles:

- `OWNER`
- `ADMIN`
- `MEMBER`

Role-based authorization is enforced by the backend.

The `OWNER` has permission to manage the workspace subscription and licensing.

### Subscription and Licensing

The application supports three subscription plans:

- FREE
- PRO
- BUSINESS

Subscription functionality includes:

- Subscription creation
- Plan changes
- Subscription status
- Subscription expiry
- License key generation
- License information
- Plan usage information
- Feature entitlements
- Seat limits
- Monthly expense limits
- Owner-only subscription management

The backend centrally evaluates subscription entitlements instead of relying only on frontend UI restrictions.

### Plan Entitlements

Subscription plans control access to application features and usage limits.

Entitlements include:

- Monthly expense limits
- Workspace seat limits
- Timeline reporting
- CSV export
- Monthly budgets
- Other plan-specific feature access

Feature restrictions are enforced server-side.

If a user attempts to access a restricted feature directly through the API, the backend returns a structured entitlement error.

### Timeline Reporting

The dashboard includes a Spending Timeline report.

Timeline reports support:

- Day grouping
- Week grouping
- Month grouping
- Date-range filtering
- Tenant-specific expense aggregation
- Subscription entitlement enforcement

The timeline is displayed using a frontend chart and refreshes when expense or subscription data changes.

### Monthly Budgets

Users can create and manage monthly budgets for expense categories.

Budget functionality includes:

- Create a monthly budget
- Edit a monthly budget
- Delete a monthly budget
- Track category spending
- Display budget amount
- Display amount spent
- Display remaining budget
- Display budget progress
- Highlight over-budget categories

Budget access is controlled by subscription entitlements.

### CSV Export

Expenses can be exported as CSV.

The export supports the currently selected expense filters, including:

- Month
- Category

The CSV contains:

- Date
- Category
- Note
- Amount

CSV export is protected by server-side subscription entitlement checks.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Vitest
- React Testing Library
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Zod
- JSON Web Tokens
- Vitest
- Supertest

## Architecture

```text
React + TypeScript Frontend
            |
            v
       REST API
            |
            v
Express + TypeScript Backend
            |
     +------+------+
     |             |
     v             v
JWT Authentication  Role Authorization
     |             |
     +------+------+
            |
            v
    Entitlement Service
            |
            v
          Prisma
            |
            v
       PostgreSQL

expense-tracker/

├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/
│   │   └── server.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── tests/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   └── package.json
│
├── .gitignore
└── README.md
Prerequisites

Before running the project, install:

Node.js
npm
PostgreSQL

Make sure PostgreSQL is running before starting the backend.

Database Setup

The backend uses PostgreSQL with Prisma.

1. Create the PostgreSQL database

Create a database named:

expense_tracker
CREATE DATABASE expense_tracker;
You may use a different database name if you update the database connection string.

2. Configure environment variables

Inside the backend folder, create:

.env

Add:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker"
JWT_SECRET="your_secret_key"

Replace:

USERNAME with your PostgreSQL username
PASSWORD with your PostgreSQL password
expense_tracker with your database name if different
your_secret_key with a secure JWT secret

Do not commit .env files or real credentials to Git.

3. Install backend dependencies
cd backend
npm install
4. Generate Prisma Client
npx prisma generate
5. Apply database migrations

For development:

npx prisma migrate dev

For deploying existing migrations:

npx prisma migrate deploy
Database Migration

The multi-tenant role and authorization functionality includes the migration:

20260910100000_add_workspace_roles

The migration adds the database changes required for workspace roles and related functionality.

Backend Setup

From the project root:

cd backend
npm install
npm run dev

The backend runs at:

http://localhost:3000
Health Check

Verify that the backend is running:

GET /health

Expected response:

{
  "status": "ok"
}
Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

The frontend normally runs at:

http://localhost:5173

Open the displayed Vite URL in your browser.

How to Use
Start PostgreSQL.
Start the backend.
Start the frontend.
Register a new account.
Create a new workspace by leaving the workspace slug empty.
The first user becomes the workspace OWNER.
Add expenses.
Review the dashboard summary.
Create monthly budgets.
View the spending chart.
Open Spending Timeline.
Switch between Day, Week, and Month views.
Open Plan & Billing.
Review subscription plan and entitlement information.
Change subscription plan as the workspace owner.
Export expenses as CSV when the current plan allows it.
Joining an Existing Workspace

To join an existing workspace:

Register a new user.
Enter the existing workspace slug.
The user joins the workspace as a MEMBER.

For example:

Workspace slug: technova

If technova already exists, a new user can join that workspace.

Roles

Example workspace:

technova
├── Rahul Sharma
│   └── OWNER
│
└── Amit Kumar
    └── MEMBER

The workspace owner can manage the subscription.

Members can access functionality according to their role and the workspace subscription entitlements.

Subscription Plans

The application provides three plans:

FREE
PRO
BUSINESS

Each plan has different usage limits and feature entitlements.

The backend determines whether a requested operation is permitted based on the tenant's current subscription.

Subscription API

The current subscription and entitlement information can be retrieved through:

GET /subscriptions/me

The response includes information such as:

User role
Current subscription
Plan
Subscription status
License information
Entitlements
Usage information

Subscription management is restricted to the workspace owner.

Timeline Reporting

Timeline reports can be accessed through the expense reporting API.

The report supports:

Day
Week
Month

The report is generated using tenant-specific expense data.

The backend validates:

Tenant access
Date range
Grouping value
Subscription entitlement
Expense Features

Each expense can contain:

Amount
Category
Date
Optional note

The application supports:

Creating expenses
Viewing expenses
Updating expenses
Deleting expenses
Filtering expenses
Pagination
Infinite scrolling

Expenses are displayed with the most recent expenses first.

Expense Validation

Backend validation includes:

Amount must be greater than zero
Category is required
Date must be valid
Date cannot be in the future
Month filters must use YYYY-MM format
Category filters cannot be empty
Pagination values are validated

The frontend also provides immediate feedback where applicable.

Filtering

Expenses can be filtered by:

Month

Example:

2026-08
Category

Example:

Food

Filters can be combined where supported.

Expense Summary

The dashboard provides:

Total expenses
Number of expenses
Average expense amount
Highest expense amount
Category-wise spending totals

Example:

GET /expenses/summary?month=2026-08
Spending Chart

The dashboard includes a spending-by-category chart.

The chart provides a visual breakdown of spending across categories for the selected month.

Monthly Budgets

Example:

GET /budgets?month=2026-08

Budget endpoints require authentication and are subject to subscription entitlements.

CSV Export

Expenses can be exported through:

GET /expenses/export

The export supports expense filters such as:

GET /expenses/export?month=2026-08
GET /expenses/export?category=Food

CSV export is subject to the current subscription entitlement.

Pagination and Infinite Scrolling

Expenses are loaded in pages instead of loading the entire expense history at once.

As the user reaches the bottom of the expense list, additional expenses are automatically loaded.

Authentication and Authorization

The application uses JWT-based authentication.

Authentication provides:

User identity
Tenant identity
User role

The backend uses the authenticated tenant ID when accessing tenant-owned resources.

Authorization middleware enforces role-specific operations.

Subscription management is restricted to the workspace OWNER.

Tenant Isolation

Tenant isolation is enforced on the backend.

Tenant-owned resources include:

Expenses
Budgets
Subscriptions
Reports

A request cannot access another tenant's data simply by changing a resource ID.

The authenticated tenant ID is used when querying and modifying tenant-owned data.

Entitlement Errors

The backend returns structured errors for restricted operations.

Examples include:

FEATURE_NOT_ENTITLED
EXPENSE_QUOTA_EXCEEDED

This allows the frontend to display appropriate locked or upgrade states while keeping enforcement on the server.

API Endpoints
Health
GET /health
Authentication
POST /auth/register
POST /auth/login
Expenses
GET /expenses
POST /expenses
GET /expenses/:id
PUT /expenses/:id
DELETE /expenses/:id
GET /expenses/export
Expense Filters
GET /expenses?month=2026-08
GET /expenses?category=Food
Expense Summary
GET /expenses/summary
GET /expenses/summary?month=2026-08
Timeline Reporting
GET /expenses/timeline

Timeline access is subject to subscription entitlements.

Budgets
GET /budgets
POST /budgets
PUT /budgets/:id
DELETE /budgets/:id
Subscriptions

Current subscription:

GET /subscriptions/me

Subscription operations include:

POST /subscriptions
POST /subscriptions/change-plan

Legacy subscription routes are retained for compatibility.

Running Tests
Frontend Tests

From the frontend directory:

npm test

The frontend test suite covers UI interactions and application behavior.

Current verification:

2 test files passed
12 tests passed
Backend Tests

From the backend directory:

npm test

The backend test suite covers API behavior, authentication, validation, and entitlement scenarios included in the test suite.

Current verification:

4 test files passed
10 tests passed
Production Builds
Backend
cd backend
npm run build
Frontend
cd frontend
npm run build

A successful frontend build may display a Vite bundle-size warning for large JavaScript chunks. This is a performance warning and does not indicate a failed build.

Development

To run the complete application locally:

Terminal 1 — Backend
cd backend
npm run dev
Terminal 2 — Frontend
cd frontend
npm run dev
Optional — Prisma Studio

From the backend directory:

npx prisma studio

Prisma Studio can be used to inspect the development database.

Environment Variables

The backend requires environment variables for local development.

Example:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker"
JWT_SECRET="your_secret_key"

Never commit real credentials or secrets to the repository.

Error Handling

The application provides feedback for common errors, including:

Invalid login credentials
Invalid expense data
Invalid budget data
Future expense dates
Failed API requests
Failed expense operations
Failed budget operations
Expired subscriptions
Restricted subscription features
Expense quota exceeded
Workspace not found
Unauthorized role operations
Empty expense results
Loading states
Responsive Design

The frontend is designed to work across:

Desktop
Tablet
Mobile

The dashboard, forms, summary cards, budgets, charts, filters, and expense list adapt to smaller screen sizes.

Verification

The current implementation has been verified with:

Backend
Prisma Client generation
Prisma migration deployment
TypeScript build
10 backend tests passing
Frontend
Production build
12 frontend tests passing
ESLint passing

Database migration deployment reported:

No pending migrations to apply.
Git Workflow

Development work is performed on feature branches.

The completed implementation is available on:

feature/multi-tenant

The branch has been pushed to the remote repository and is ready for pull request review.

Author

Pranav