# Receipt Tracker System

This is a full-stack web application for tracking receipt images through a predefined approval workflow, built with Next.js, React, TypeScript, Ant Design, Vercel Postgres (Prisma ORM), Vercel Blobs, and NextAuth.js.

## Project Structure

```
receipt-tracker-system/
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (pages/routes, layouts, API routes)
│   │   ├── api/          # Next.js API Routes (for backend logic)
│   │   │   ├── auth/     # Authentication endpoints (e.g., [nextauth]/route.ts for NextAuth.js)
│   │   │   ├── receipts/ # API for CRUD on receipts, approval/rejection actions
│   │   │   └── users/    # API for user management (if needed for initial setup/admin)
│   │   ├── (auth)/       # Group for authentication related pages (e.g., login.tsx)
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── dashboard/    # Dynamic dashboard pages based on user roles
│   │   │   ├── layout.tsx # Dashboard common layout
│   │   │   ├── page.tsx  # Redirects based on role
│   │   │   ├── hr/       # HR specific dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── mgm/      # MGM specific dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── gm/       # GM specific dashboard
│   │   │   │   └── page.tsx
│   │   │   └── security/ # Security specific dashboard
│   │   │       └── page.tsx
│   │   ├── receipts/     # Pages for individual receipt details, creation
│   │   │   ├── create/
│   │   │   │   └── page.tsx # HR receipt creation form
│   │   │   └── [id]/
│   │   │       └── page.tsx # Receipt detail view
│   │   ├── layout.tsx    # Root layout for the application
│   │   └── page.tsx      # Home/landing page
│   ├── components/       # Reusable React components
│   │   ├── auth/         # Auth-related components (e.g., LoginForm)
│   │   ├── common/       # General UI components (e.g., LoadingSpinner, ErrorMessage)
│   │   ├── receipts/     # Components specific to receipts (e.g., ReceiptForm, ReceiptTable)
│   │   └── layout/       # Navigation, header, footer components
│   ├── lib/              # Utility functions, database client, auth configuration
│   │   ├── auth.ts       # Authentication helpers/config (e.g., NextAuth.js config)
│   │   ├── prisma.ts     # Prisma client instance setup
│   │   └── blob.ts       # Vercel Blob client setup and helpers
│   ├── types/            # TypeScript type definitions for models, props, etc.
│   └── styles/           # Global styles, Ant Design theme overrides, utility classes
├── .env                  # Environment variables (e.g., DATABASE_URL, BLOB_READ_WRITE_TOKEN, NEXTAUTH_SECRET)
├── .gitignore            # Git ignore rules for node_modules, .next, dist, etc.
├── next.config.js        # Next.js configuration
├── package.json          # Project metadata, scripts, and dependencies
├── tsconfig.json         # TypeScript compiler configuration
└── README.md             # Basic installation, setup, and usage instructions
```

## Setup and Installation

1.  **Clone the repository (if not already done):**
    ```bash
    git clone <your-repo-url>
    cd receipt-tracker-system/my-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the `my-app` directory with the following variables:

    ```env
    DATABASE_URL="YOUR_VERCEL_POSTGRES_CONNECTION_STRING"
    BLOB_READ_WRITE_TOKEN="YOUR_VERCEL_BLOB_READ_WRITE_TOKEN"
    NEXTAUTH_SECRET="A_LONG_RANDOM_STRING_FOR_NEXTAUTH_SECRET"
    NEXTAUTH_URL="http://localhost:3000" # Or your deployment URL
    ```
    *   `DATABASE_URL`: Obtain this from your Vercel Postgres database settings.
    *   `BLOB_READ_WRITE_TOKEN`: Obtain this from your Vercel Blob settings.
    *   `NEXTAUTH_SECRET`: Generate a strong, random string. You can use `openssl rand -base64 32` in your terminal.

4.  **Prisma Migrations:**
    Apply the Prisma schema to your database. This will create the `User` and `Receipt` tables.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **User Seeding (for Development):**
    You can create initial users for development purposes. Here's a simple script you can run once:

    Create a file named `seed.ts` in the `prisma` directory:

    ```typescript
    // prisma/seed.ts
    import { PrismaClient } from '@prisma/client';
    import bcrypt from 'bcryptjs';

    const prisma = new PrismaClient();

    async function main() {
      console.log('Start seeding...');

      const passwordHash = await bcrypt.hash('password', 10);

      const hrUser = await prisma.user.upsert({
        where: { username: 'hr_user' },
        update: {},
        create: {
          username: 'hr_user',
          passwordHash,
          role: 'HR',
        },
      });

      const mgmUser = await prisma.user.upsert({
        where: { username: 'mgm_user' },
        update: {},
        create: {
          username: 'mgm_user',
          passwordHash,
          role: 'MGM',
        },
      });

      const gmUser = await prisma.user.upsert({
        where: { username: 'gm_user' },
        update: {},
        create: {
          username: 'gm_user',
          passwordHash,
          role: 'GM',
        },
      });

      const securityUser = await prisma.user.upsert({
        where: { username: 'security_user' },
        update: {},
        create: {
          username: 'security_user',
          passwordHash,
          role: 'SECURITY',
        },
      });

      console.log(`Created users: ${hrUser.username}, ${mgmUser.username}, ${gmUser.username}, ${securityUser.username}`);
      console.log('Seeding finished.');
    }

    main()
      .catch((e) => {
        console.error(e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
    ```

    Then, add the following to your `package.json` scripts:

    ```json
    "prisma:seed": "ts-node prisma/seed.ts"
    ```

    And run it:
    ```bash
    npm run prisma:seed
    ```

6.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

    The application will be accessible at `http://localhost:3000`.

## Usage

*   **Login:** Use the seeded users (e.g., `hr_user`/`password`, `mgm_user`/`password`, etc.) to log in.
*   **HR User:** Can create new receipts and view their own created receipts.
*   **MGM User:** Can view and approve/reject receipts that are `PENDING_MGM`.
*   **GM User:** Can view and approve/reject receipts that are `APPROVED_BY_MGM_PENDING_GM`.
*   **Security User:** Has a read-only view of all receipts that have passed the initial MGM approval, or have been rejected.

## Deployment

This application is designed for deployment on Vercel. Ensure your environment variables (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `NEXTAUTH_SECRET`) are configured in your Vercel project settings.