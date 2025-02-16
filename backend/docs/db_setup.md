## Database Setup For Local Development

For local development, follow these steps to set up your PostgreSQL database:

1. **Install PostgreSQL:**  
   - **MacOS (using Homebrew):**
     ```bash
     brew install postgresql
     brew services start postgresql
     ```
   - **Other OS:**  
     Download and install PostgreSQL from [postgresql.org/download](https://www.postgresql.org/download/).

2. **Create a Database:**  
   Open your terminal and run:
   ```bash
   createdb brain_cleaner
   ```
   (If you see errors, ensure PostgreSQL is running.)

3. **User Management:**  
   - **List Users:**  
     Connect to PostgreSQL:
     ```bash
     psql postgres
     ```
     Then list users with:
     ```sql
     \du
     ```
   - **Create a New User (if needed):**   
     In the `psql` shell, run:
     ```sql
     CREATE USER myuser WITH PASSWORD 'mypassword';
     -- Optionally, create a database owned by this user:
     CREATE DATABASE brain_cleaner OWNER myuser;
     ```

4. **Set the Connection String:**  
   Create a `.env` file in your backend directory with the following content:
   ```env
   DATABASE_URL=postgres://myuser:mypassword@localhost:5432/brain_cleaner
   ```
   Replace `myuser` and `mypassword` with your PostgreSQL credentials.  
   **Note:** The `.env` file must be located in the root of the backend directory (i.e. `backend/.env`).

5. **Run Migrations:**  
   To create the required tables (for example, the `users` table), run:
   ```bash
   psql -d brain_cleaner -f migrations/create_users_table.sql
   ```

6. **Ensure the Database is Running on the URL:**  
   The PostgreSQL server runs as a background service listening for connections on port **5432** (the default port).  
   - Make sure the server is running (on MacOS, use `brew services start postgresql`).
   - Verify that your connection string in the `.env` file uses port **5432**.  
   This ensures that your backend can connect to the PostgreSQL server at `localhost:5432`.
   - **Sanity Check:** Confirm the database is accessible by running: 
   ```bash
   psql -d brain_cleaner -c "SELECT 1"
   ```