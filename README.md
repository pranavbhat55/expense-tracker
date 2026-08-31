# Expense Tracker

A full-stack Expense Tracker application for managing personal expenses through a modern React dashboard and REST API backend.

Users can register, log in, create, update, delete, filter, analyze, and export their expenses. The dashboard also provides spending charts and monthly category budgets.

## Features

### Core Features

- User registration
- User login
- JWT authentication
- Protected expense routes
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
- Error handling
- Loading states
- Empty states

### Additional Features

- Spending-by-category chart
- Monthly budgets per category
- Edit monthly budgets
- Delete monthly budgets
- Budget progress tracking
- Remaining budget calculation
- Over-budget highlighting
- CSV export of filtered expenses
- Pagination
- Infinite scrolling
- Responsive dashboard UI
- Pastel/beige themed interface
- Frontend UI interaction tests
- Backend API tests

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

## Project Structure

```text
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
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── tests/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   └── package.json
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

For example:

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

Do not commit the .env file to Git.

3. Install backend dependencies
cd backend
npm install
4. Generate Prisma client
npx prisma generate
5. Apply database migrations
npx prisma migrate dev
Backend Setup

From the project root:

cd backend
npm install
npm run dev

The backend runs at:

http://localhost:3000
Health Check

You can verify that the backend is running at:

http://localhost:3000/health

Expected response:

{
  "status": "ok"
}
Frontend Setup

Open another terminal and run:

cd frontend
npm install
npm run dev

The frontend normally runs at:

http://localhost:5173

Open the displayed Vite URL in your browser.

How to Use
Start PostgreSQL.
Start the backend:
cd backend
npm run dev
Open another terminal.
Start the frontend:
cd frontend
npm run dev
Open the frontend in your browser.
Register a new account.
Log in with your account.
Add an expense.
View your expenses in the dashboard.
Edit an existing expense.
Delete an expense.
Filter expenses by month.
Filter expenses by category.
Clear the filters when needed.
Review the monthly expense summary.
View the spending-by-category chart.
Create a monthly budget for a category.
Edit or delete an existing budget.
Monitor budget progress.
Review over-budget warnings.
Export filtered expenses as a CSV file.
Continue scrolling to load additional expenses.
Expense Features

Each expense can contain:

Amount
Category
Date
Optional note

The application supports:

Creating expenses
Viewing expenses
Viewing individual expenses through the API
Updating expenses
Deleting expenses

Expenses are displayed with the most recent expenses first.

Expense Validation

The application validates expense data on the backend.

Validation includes:

Amount must be greater than zero
Category is required
Date must be valid
Date cannot be in the future
Month filters must use YYYY-MM format
Category filters cannot be empty
Pagination values are validated

The frontend also provides immediate feedback for invalid input where applicable.

Filtering

Expenses can be filtered by:

Month

Example:

2026-08
Category

Example:

Food

Filters can be combined and cleared to return to the full expense list.

Expense Summary

The dashboard provides a monthly expense summary containing:

Total expenses
Number of expenses
Average expense amount
Highest expense amount
Category-wise spending totals

When a month is selected, the summary reflects the selected month.

Spending Chart

The dashboard includes a spending-by-category chart.

The chart provides a visual breakdown of spending across expense categories for the selected month.

Changing the selected month updates the displayed spending information.

Monthly Budgets

Users can set monthly spending limits for individual categories.

Budget functionality includes:

Create a monthly budget
Edit a monthly budget
Delete a monthly budget
Track category spending against the budget
Display the amount spent
Display the budget amount
Display the remaining budget
Display budget progress
Highlight categories when spending exceeds the budget

When spending exceeds a category's monthly budget, the dashboard displays an over-budget warning.

CSV Export

Expenses can be exported as a CSV file.

The export uses the currently selected expense filters.

Supported filters include:

Month
Category

The CSV contains:

Date
Category
Note
Amount
Pagination and Infinite Scrolling

Expenses are loaded in pages rather than loading the entire expense history at once.

As the user reaches the bottom of the expense list, additional expenses are automatically loaded.

This helps keep the application responsive when there are many expenses.

Authentication

The application includes:

User registration
User login
JWT-based authentication
Protected expense routes
Protected budget routes

Users must be authenticated before accessing protected expense and budget functionality.

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
Expense Filters
GET /expenses?month=2026-08
GET /expenses?category=Food

Filters can also be combined where supported.

Expense Summary
GET /expenses/summary

Example:

GET /expenses/summary?month=2026-08
Budgets
GET /budgets
POST /budgets
PUT /budgets/:id
DELETE /budgets/:id

Example:

GET /budgets?month=2026-08

Budget endpoints require authentication.

Running Tests
Frontend Tests

From the frontend directory:

npm test

The frontend test suite covers UI interactions and application behavior.

Backend Tests

From the backend directory:

npm test

Backend tests cover API behavior and validation/authentication scenarios included in the test suite.

Production Builds
Backend
cd backend
npm run build
Frontend
cd frontend
npm run build

A successful frontend build may display a Vite bundle-size warning for large JavaScript chunks. This is a warning and does not indicate a failed build.

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

This can be used to inspect the development database.

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
Empty expense results
Loading states
Responsive Design

The frontend is designed to work across:

Desktop
Tablet
Mobile

The dashboard, forms, summary cards, budgets, chart, filters, and expense list adapt to smaller screen sizes.

Git Workflow

Development work is performed on feature branches.

The final Expense Tracker implementation is available on:

feature/expense-tracker

The project is submitted through a pull request targeting:

main
Author

Pranav