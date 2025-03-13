# Supabase Migration Guide

## Overview
This guide will help you migrate your application from direct PostgreSQL to Supabase.

## Steps Completed
- ✅ Installed Supabase JavaScript client
- ✅ Updated database connection code to use Supabase
- ✅ Added Supabase credentials to .env file
- ✅ Created SQL script for setting up tables in Supabase

## Remaining Setup Steps

### 1. Set Up Supabase Tables
1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql` and execute it
4. Alternatively, you can use the Table Editor to create tables with the same structure

### 2. Update Authentication Logic
Since you're using Supabase, consider leveraging their built-in auth system:

```javascript
// Example of signing up a user with Supabase
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Example of signing in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

Replace your existing auth implementation in `auth.controller.js` with Supabase Auth.

### 3. Update Data Migration (Optional)
If you need to migrate existing data:

1. Export your data from PostgreSQL
```bash
pg_dump -t users -t videos --data-only --column-inserts yourdb > data_export.sql
```

2. Modify the SQL file as needed and import it into Supabase via the SQL Editor

### 4. Testing
Test all database operations to ensure they work correctly with Supabase:
- User registration/login
- Video saving and retrieval
- Any other database operations

## Troubleshooting
- If you see any SQL parsing errors, you might need to update the SQL parsing functions in `db/index.js`
- For complex queries, consider using the Supabase client directly rather than the SQL compatibility layer

## Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
