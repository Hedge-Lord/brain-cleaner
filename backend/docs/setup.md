# Getting Started

This document provides instructions to set up and run the Brain Cleaner Backend application.

## Prerequisites

- Node.js and npm
- PostgreSQL

## Setup

1. **Clone the repository and install dependencies:**
   
   ```bash
   git clone <repository-url>
   cd brain-cleaner/backend
   npm install
   ```

2. **Environment Variables:**

   Create a `.env` file in the `backend` directory with the following fields (password may not be required):

   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/brain_cleaner
   JWT_SECRET=secret
   ```

   - `DATABASE_URL`: This is the connection string for your PostgreSQL database. It specifies the username, host, port, and database name, ensuring the application connects to the correct database.

   - `JWT_SECRET`: This secret key is used to sign and verify JSON Web Tokens (JWTs) for authentication. It must be kept secret to maintain token integrity.

3. **Run the Application:**

   Start the application using:

   ```bash
   npm start
   ```

4. **Running Tests:**

   Run the test suite with:

   ```bash
   npx mocha tests
   ```

## API Endpoints

All endpoints are prefixed with `/api/v1`. For example:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

For more details, refer to the API documentation.
