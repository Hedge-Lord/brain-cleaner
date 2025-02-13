# Users Table Documentation

## Table Structure

| Column Name | Data Type   | Description                                  |
|-------------|-------------|----------------------------------------------|
| id          | SERIAL      | Primary key for the user, auto-incremented. |
| email       | VARCHAR(255)| Unique email address for the user.          |
| password    | VARCHAR(255)| Hashed password for user authentication.     |
| created_at  | TIMESTAMP   | Timestamp for when the user was created.    |

## Notes
- **Simplicity**: The current structure is very minimal, we may want to extend it later.
