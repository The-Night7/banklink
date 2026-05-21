# BudgetLink Setup

## Prerequisites
- Node.js 20+
- npm 11+
- Firebase CLI
- Powens sandbox or production credentials

## Environment
1. Copy `.env.example` to `.env`.
2. Fill `POWENS_CLIENT_ID`, `POWENS_CLIENT_SECRET`, `POWENS_BASE_URL`, and `POWENS_WEBHOOK_SECRET`.
3. Keep the provided Firebase public config, or replace it if you point to another Firebase project.

## Install
```bash
npm install
```

## Local development
```bash
npm run build --workspace=@budgetlink/functions
npm run dev --workspace=@budgetlink/client
firebase emulators:start
```

## Web export
```bash
npm run build
```

## CSV fallback
- The current client import flow expects standard headers:
  - `date`
  - `amount`
  - `label`
  - `merchant`
  - `category`
  - `account`

## Notes
- Google sign-in is wired for web popup flow.
- Mobile Google OAuth still needs native client IDs.
- Powens endpoint paths are centralized in `apps/functions/src/providers/powens.ts`.
