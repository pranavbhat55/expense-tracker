# Expense Tracker

A full-stack Expense Tracker application for managing personal expenses. Users can register, log in, create, update, delete, filter, and review their expenses through a React frontend and Express backend.

## Features

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
- Expense summary
- Total expense calculation
- Average expense calculation
- Highest expense calculation
- Category-wise expense totals
- Input validation
- Error handling
- Backend API tests
- Frontend UI interaction tests

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Vitest
- React Testing Library

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
│   ├── src/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

Before running the project, install:

- Node.js
- npm
- PostgreSQL

## Database Setup

This project uses PostgreSQL with Prisma.

### 1. Create a PostgreSQL database

Create a database named `expense_tracker`:

```sql
CREATE DATABASE expense_tracker;
```

You may use a different database name if you update the connection string accordingly.

### 2. Configure environment variables

Inside the `backend` folder, create a file named:

```text
.env
```

Add your database connection and JWT secret:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/expense_tracker"
JWT_SECRET="your_secret_key"
```

Replace:

- `USERNAME` with your PostgreSQL username.
- `PASSWORD` with your PostgreSQL password.
- `expense_tracker` with your database name if different.
- `your_secret_key` with a secure secret.

Do not commit your `.env` file to Git.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

## Backend Setup

From the project root:

```bash
cd backend
npm install
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

You can verify that the backend is running by visiting:

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Frontend Setup

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## How to Use

1. Start PostgreSQL.
2. Start the backend with:

```bash
cd backend
npm run dev
```

3. Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

4. Open:

```text
http://localhost:5173
```

5. Register a new user.
6. Log in with your registered credentials.
7. Add expenses.
8. Edit existing expenses.
9. Delete expenses.
10. Filter expenses by month or category.
11. View the expense summary.

## Expense Features

The application supports the following expense operations:

- Create an expense
- View all expenses
- View an individual expense
- Update an expense
- Delete an expense

Each expense can include:

- Amount
- Category
- Date
- Optional note

## Filtering

Expenses can be filtered by:

- Month
- Category

Filters can also be cleared to return to the full expense list.

## Expense Summary

The application provides an expense summary containing:

- Total expenses
- Number of expenses
- Average expense amount
- Highest expense amount
- Category-wise totals

## Authentication

The application includes:

- User registration
- User login
- JWT-based authentication
- Protected expense routes

Users must be authenticated before accessing expense-related API endpoints.

## API Endpoints

### Health

```text
GET /health
```

### Authentication

```text
POST /auth/register
POST /auth/login
```

### Expenses

```text
GET /expenses
POST /expenses
GET /expenses/:id
PUT /expenses/:id
DELETE /expenses/:id
```

Expenses can be queried with filters such as:

```text
GET /expenses?month=2026-08
GET /expenses?category=Food
```

### Expense Summary

```text
GET /expenses/summary
```

A month can be supplied when supported:

```text
GET /expenses/summary?month=2026-08
```

## Running Tests

### Backend Tests

From the `backend` directory:

```bash
npm test
```

The backend tests currently cover:

- Health API success response
- Unauthorized expense access
- Invalid login credentials

### Frontend Tests

From the `frontend` directory:

```bash
npm test
```

The frontend test currently covers:

- Entering an email address
- Entering a password

## Production Builds

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

## Development

To run the complete application locally:

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

### Terminal 3 — Optional database management

Use PostgreSQL or Prisma tools as needed.

## Author

Pranav