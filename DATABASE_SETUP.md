# Local PostgreSQL and Prisma setup

The project uses Prisma 6.19.0 with PostgreSQL. Keep local credentials in `.env`; do not commit or share that file.

## Configure PostgreSQL on Windows

1. Install PostgreSQL using the official Windows installer. Keep the default port (`5432`) unless you have a reason to change it. During installation, choose and remember a local administrator password.
2. Open pgAdmin and connect to your local PostgreSQL server.
3. Create a login role for the application (for example, `attendance_app`) and set a password you choose locally. Create a database named `attendance_management` owned by that role. Do not use the PostgreSQL administrator account for the application.
4. From PowerShell in the project directory, create your local environment file:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

5. Replace the placeholder `DATABASE_URL` in `.env` with the credentials and database name you configured:

   ```text
   DATABASE_URL="postgresql://attendance_app:YOUR_PASSWORD@localhost:5432/attendance_management?schema=public"
   ```

   This example is a template, not a real credential. URL-encode special characters in the password (for example, `@` as `%40`). Keep `.env` private; it is excluded by `.gitignore`.

If you use a hosted PostgreSQL provider such as Neon, use its connection string and ensure it includes `sslmode=require`.

## Generate the client, migrate, and seed

Run these commands in PowerShell from the project directory after PostgreSQL is running and `.env` has a valid connection string:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate -- --name init
npm.cmd run db:seed
```

`db:migrate` creates and applies the initial migration, then records it under `prisma/migrations`. For later schema changes, use a descriptive migration name, for example:

```powershell
npm.cmd run db:migrate -- --name add_attendance_notes
```

The seed uses safe example-only departments and employees and can be rerun without duplicating those records. It does not create user accounts or passwords.

## Employee sign-in and access

Set a unique `NEXTAUTH_SECRET` in `.env` and set `NEXTAUTH_URL` to the app's base URL. There is no public registration endpoint. Create an account from a trusted project terminal:

```powershell
npm.cmd run db:create-user
```

The command prompts for an email, display name, role, and (for employee accounts) employee code. Password entry is hidden and the password is stored only as a bcrypt hash. Use `ADMIN` for full employee management, `HR` for employee creation and updates, and `EMPLOYEE` for access to the linked employee's own profile. Only an `ADMIN` can delete. Never share database credentials or login passwords.

The Employees list and profile read from PostgreSQL. Server Actions re-check the user's session and role for every create, update, and delete request and validate submitted values independently of the browser. Employee deletion is blocked when attendance history exists.

## Settings and reports

The Settings page stores the organization timezone and default report window in the `SystemSettings` table. Only ADMIN can update them; HR can view them. Reports read attendance from Prisma, restrict EMPLOYEE accounts to their linked employee, and the CSV endpoint applies the same server-side filters and access rules.

For an existing database, deploy pending additive migrations without resetting data:

```powershell
npm.cmd exec prisma -- migrate deploy
npm.cmd exec prisma -- migrate status
```
