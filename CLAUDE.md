@AGENTS.md

# Dash Finance

## Overview

Personal finance dashboard to track expenses and income month by month. Interface in Brazilian Portuguese. Multi-user support with server-side authentication. All data is persisted in PostgreSQL.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | Framework (App Router) |
| React | 19.2.4 | UI |
| TypeScript | 5 | Types |
| Tailwind CSS | 4 | Styling |
| PostgreSQL | 16 | Database (Docker, port 5433) |
| Prisma | 7 | ORM |
| iron-session | 8 | Session via HTTP-only cookie |
| bcryptjs | — | Password hashing |

## Project Structure

```
app/
  layout.tsx                    # Root layout (Header + AuthProvider)
  page.tsx                      # Main dashboard — all core logic
  globals.css                   # Tailwind imports
  fundos/page.tsx               # Investment tracking page
  relatorio/page.tsx            # Report page with charts
  api/
    auth/
      register/route.ts         # POST — create user + set session cookie
      login/route.ts            # POST — validate credentials + set session cookie
      logout/route.ts           # POST — destroy session cookie
      me/route.ts               # GET — return current session user
    expenses/
      route.ts                  # GET (list), POST (create)
      [id]/route.ts             # PATCH (update), DELETE
    categories/
      route.ts                  # GET (list), POST (create)
      [id]/route.ts             # DELETE
      [id]/subcategories/route.ts         # POST (add subcategory)
      [id]/subcategories/[subId]/route.ts # DELETE
    contributions/
      route.ts                  # GET (list), POST (create)
      [id]/route.ts             # DELETE

components/
  Header.tsx                    # Nav bar with links and logout button
  ExpenseList.tsx               # List of expense/income cards with grouping
  ExpenseCard.tsx               # Individual card with visual status and actions
  AddExpenseModal.tsx           # Add/edit expense or income modal
  DeleteConfirmModal.tsx        # Delete confirmation with 3 scope options
  EditScopeModal.tsx            # Scope selector for editing recurring expenses
  ManageCategoriesModal.tsx     # Category/subcategory CRUD
  LoginForm.tsx                 # Login/register form
  AddContributionModal.tsx      # Investment contribution modal

hooks/
  useExpenses.ts                # Expense state — fetches from /api/expenses
  useCategories.ts              # Category state — fetches from /api/categories
  useContributions.ts           # Contribution state — fetches from /api/contributions

contexts/
  AuthContext.tsx               # Auth state — fetches from /api/auth/*

lib/
  db.ts                         # PrismaClient singleton (with @prisma/adapter-pg)
  session.ts                    # getSession() via iron-session
  expenseFilter.ts              # Monthly filtering logic (pure client-side)
  auth.ts                       # Legacy file — no longer imported, safe to delete

types/
  expense.ts                    # Expense and DisplayExpense interfaces
  category.ts                   # Category and Subcategory interfaces
  contribution.ts               # Contribution interface

prisma/
  schema.prisma                 # Database schema
  migrations/                   # Migration history
prisma.config.ts                # Prisma CLI config (datasource URL for migrations)
docker-compose.yml              # PostgreSQL service definition
```

## Database

PostgreSQL runs in Docker on port **5433** (5432 is used by a local Postgres instance).

### Connection

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `dash_finance` |
| Username | `dash` |
| Password | `dash` |

### Schema (`prisma/schema.prisma`)

**User**
```
id           String   @id @default(uuid())
username     String   @unique
passwordHash String
createdAt    DateTime @default(now())
```

**Expense**
```
id             String      @id @default(uuid())
userId         String      → User (cascade delete)
name           String
value          Float
type           ExpenseType  (fixed | one_time)
fixedMode      FixedMode?   (unlimited | installments)
installments   Int?
dueDate        String?      YYYY-MM-DD
endDate        String?      YYYY-MM — last month to show (inclusive)
excludedMonths String[]     months to skip: ["YYYY-MM"]
paidMonths     String[]     months marked as paid
kind           ExpenseKind  (expense | income)
categoryId     String?
subcategoryId  String?
notes          String?
attachments    Json         Attachment[] stored as JSON
createdAt      DateTime
```

**Category**
```
id        String   @id @default(uuid())
userId    String   → User (cascade delete)
name      String
createdAt DateTime
```

**Subcategory**
```
id         String → Category (cascade delete)
categoryId String
name       String
```

**Contribution**
```
id         String               @id @default(uuid())
userId     String               → User (cascade delete)
date       String               YYYY-MM-DD
value      Float
kind       ContributionKind     (aporte | retirada)
type       ContributionType     (cripto | investimento)
subtype    ContributionSubtype? (bitcoin | etc | outros)
quantidade Float?
cotacao    Float?
createdAt  DateTime
```

### Important: Prisma 7 breaking changes

- `datasource` in `schema.prisma` has **no `url`** — it goes in `prisma.config.ts`
- `PrismaClient` requires an `adapter` — uses `PrismaPg` from `@prisma/adapter-pg`
- `prisma.config.ts` loads dotenv explicitly because the CLI doesn't read `.env` before the config file
- The `attachments` field is `Json` in Prisma — cast with `as unknown as` to the TypeScript type
- `ExpenseType` enum: `one_time` in DB ↔ `"one-time"` in TypeScript (conversion in API routes)

## Data Models

### `Expense` (`types/expense.ts`)

```typescript
interface Expense {
  id: string;
  name: string;
  value: number;
  type: "fixed" | "one-time";
  fixedMode?: "unlimited" | "installments";
  installments?: number;
  dueDate?: string;          // YYYY-MM-DD
  endDate?: string;          // YYYY-MM (last month, inclusive)
  excludedMonths?: string[]; // ["YYYY-MM", ...]
  paidMonths?: string[];     // ["YYYY-MM", ...]
  kind?: "expense" | "income";
  categoryId?: string;
  subcategoryId?: string;
  notes?: string;
  attachments?: Attachment[];
  createdAt: string;
}
```

### `DisplayExpense` (`types/expense.ts`)

Extends `Expense` with computed fields for rendering:

```typescript
interface DisplayExpense extends Expense {
  displayValue: number;      // For installments: value / installments
  installmentInfo?: string;  // e.g. "3/10"
  isPaid: boolean;
  isOverdue: boolean;
  categoryLabel?: string;    // e.g. "Moradia > Aluguel"
}
```

## Business Logic

### Monthly filtering (`lib/expenseFilter.ts`)

- **`one-time`**: shown only in the month of `dueDate`.
- **`fixed / unlimited`**: shown from `dueDate` month onward until `endDate` (if set), skipping `excludedMonths`.
- **`fixed / installments`**: shown for N months starting from `dueDate`. `displayValue` = `value / installments`.

### Payment status

- `isPaid`: the viewed month is in `paidMonths`.
- `isOverdue`: `dueDate` is in the past AND `isPaid === false`.

### Deleting recurring expenses (`DeleteConfirmModal`)

Three strategies:
1. **This month only** → adds month to `excludedMonths`.
2. **This and all future** → sets `endDate` to the previous month.
3. **All occurrences** → deletes the record entirely.

### Editing recurring expenses (`EditScopeModal`)

Same three scopes. "This month" and "from here forward" create a one-time override and truncate the original.

## Auth

- Registration: `POST /api/auth/register` — bcrypt hash, creates User, sets session cookie
- Login: `POST /api/auth/login` — bcrypt compare, sets session cookie
- Session: iron-session encrypted cookie (`dash-finance-session`)
- All API routes check `session.userId`; return 401 if missing

## Hooks

All hooks accept `userId` in their signature for call-site compatibility, but the parameter is ignored — auth is server-side.

```typescript
const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses(user.userId);
const { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useCategories(user.userId);
const { contributions, addContribution, deleteContribution } = useContributions(user.userId);
```

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Production server
npm run db:up        # docker compose up -d
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:studio    # Prisma Studio (visual DB browser)
```
