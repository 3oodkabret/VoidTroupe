================================================================
  VOID TROUPE - AI Personality Analysis Platform
  Big Five (OCEAN) Personality Traits Discovery
================================================================

REQUIREMENTS
------------
Before you begin, make sure you have the following installed:

  1. Node.js (version 18 or higher)
     Download: https://nodejs.org/

  2. pnpm (package manager)
     Install by running:
       npm install -g pnpm

  3. PostgreSQL (version 14 or higher)
     Download: https://www.postgresql.org/download/
     After installing, create a database:
       psql -U postgres
       CREATE DATABASE void_troupe;
       \q


SETUP INSTRUCTIONS
------------------

Step 1 — Install dependencies
  Open a terminal in this project folder and run:

    pnpm install

Step 2 — Set environment variables
  Create a file called ".env" in the root of the project
  (same folder as this README.txt) with the following content:

    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/void_troupe
    SESSION_SECRET=some-random-secret-string-here

  Replace YOUR_PASSWORD with your PostgreSQL password.

Step 3 — Push the database schema
  This creates the required tables in your database:

    pnpm --filter @workspace/db run push

Step 4 — Run codegen (generates API types)
  This only needs to be run once (or when you change the API):

    pnpm --filter @workspace/api-spec run codegen

Step 5 — Start the backend (API Server)
  Open a terminal and run:

    pnpm --filter @workspace/api-server run dev

  The API server will start at http://localhost:8080
  (It handles requests at the /api path)

Step 6 — Start the frontend (in a second terminal)
  Open another terminal and run:

    pnpm --filter @workspace/void-troupe run dev

  The frontend will start at http://localhost:5173

Step 7 — Open the app
  Visit http://localhost:5173 in your browser.


PROJECT STRUCTURE
-----------------
  artifacts/
    api-server/       — Express backend (Node.js + TypeScript)
    void-troupe/      — React frontend (Vite + Tailwind CSS)
  lib/
    db/               — Database schema (Drizzle ORM + PostgreSQL)
    api-spec/         — OpenAPI specification
    api-client-react/ — Generated React Query hooks
    api-zod/          — Generated Zod validation schemas
  scripts/            — Utility scripts


FEATURES
--------
  - Landing page explaining the platform
  - Analysis page: write about yourself (min. 50 words)
  - Real-time word count as you type
  - Results dashboard with Radar Chart & Bar Charts
  - Big Five traits: Openness, Conscientiousness, Extraversion,
    Agreeableness, Neuroticism (OCEAN)
  - All analyses saved to the database
  - History page to view past analyses


NOTE ON AI
----------
  The current AI analysis uses a mock function that generates
  deterministic personality scores based on your text content.
  To plug in your real TensorFlow/LSTM model, replace the
  `mockAnalyze()` function in:

    artifacts/api-server/src/routes/analyze.ts


TROUBLESHOOTING
---------------
  - "Cannot find module" errors: run `pnpm install` again
  - Database connection errors: check your DATABASE_URL in .env
  - Port already in use: change the port by setting PORT=XXXX
    before the dev command
  - Schema errors: run `pnpm --filter @workspace/db run push-force`


================================================================
  Built with React, Vite, Tailwind CSS, Express, PostgreSQL,
  Drizzle ORM, Recharts, and TypeScript.
================================================================
