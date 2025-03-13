# Brain Cleaner

A web application for processing documents and generating content.

## Project Structure

- `frontend/`: React application built with Vite
- `backend/`: Node.js Express API server

## Prerequisites

- Node.js and npm
- PostgreSQL

## Backend Setup

1. **Install dependencies:**

```bash
cd backend
npm install
```

2. **Set up PostgreSQL database:**

- Install PostgreSQL:
  ```bash
  # MacOS (using Homebrew)
  brew install postgresql
  brew services start postgresql
  
  # Other OS: Download from postgresql.org/download
  ```

- Create database:
  ```bash
  createdb brain_cleaner
  ```

- Create a user (if needed):
  ```bash
  psql postgres
  CREATE USER myuser WITH PASSWORD 'mypassword';
  CREATE DATABASE brain_cleaner OWNER myuser;
  ```

3. **Configure environment variables:**

Create a `.env` file in the `backend` directory:

```
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/brain_cleaner
JWT_SECRET=your_secret_key
```

4. **Start the backend server:**

```bash
npm start
```

The backend server will run on http://localhost:3000 by default.

## Frontend Setup

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

The frontend development server will run on http://localhost:5173 by default.

3. **Build for production:**

```bash
npm run build
```

## Running the Full Application

1. Start the backend server in one terminal:
```bash
cd backend
npm start
```

2. Start the frontend development server in another terminal:
```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:5173 in your browser.