# Stocks Module - How to Use

## 🎯 Goal: Save SEC data to database so you can view it in tables

## Workflow

### Step 1: Fetch & Save Data

```bash
# Fetch AAPL from SEC and save to database
curl http://localhost:5001/api/v1/stocks/AAPL/fundamentals
```

This will:

- ✅ Fetch from SEC API
- ✅ Save company to `companies` table
- ✅ Save fundamentals to `fundamentals_snapshots` table

### Step 2: View in Prisma Studio

```bash
# Open Prisma Studio (from apps/api folder)
pnpm db:studio
```

Then open http://localhost:5555 and:

1. Click **companies** table → See AAPL saved
2. Click **fundamentals_snapshots** table → See all the financial data in rows!

### Step 3: Query Saved Data

```bash
# Get data from database (no SEC call)
curl http://localhost:5001/api/v1/stocks/AAPL/saved
```

### Step 4: List All Saved Companies

```bash
curl http://localhost:5001/api/v1/stocks/list
```

---

## All Endpoints

| Method | Endpoint                       | What it does                    |
| ------ | ------------------------------ | ------------------------------- |
| GET    | `/stocks/:ticker/info`         | Get company name & CIK          |
| GET    | `/stocks/:ticker/fundamentals` | **Fetch from SEC & save to DB** |
| GET    | `/stocks/:ticker/saved`        | Get saved data from DB          |
| GET    | `/stocks/list`                 | List all companies in DB        |

---

## Example Flow

```bash
# 1. Start API
pnpm dev:api

# 2. Save Apple data
curl http://localhost:5001/api/v1/stocks/AAPL/fundamentals

# 3. Save Microsoft data
curl http://localhost:5001/api/v1/stocks/MSFT/fundamentals

# 4. List all saved
curl http://localhost:5001/api/v1/stocks/list

# 5. Open Prisma Studio to see tables
pnpm db:studio
# Go to http://localhost:5555
# Click "fundamentals_snapshots" table
# See all the data in nice rows!
```

---

## Database Tables

### `companies` table:

- ticker (AAPL, MSFT, etc.)
- cik (SEC identifier)
- name (Apple Inc.)

### `fundamentals_snapshots` table:

- companyId (links to companies)
- periodEnd (date)
- periodType (annual/quarter)
- revenue
- netIncome
- assets
- liabilities
- equity
- cfo (cash from operations)

---

## What Was Changed

**Before:**

- Just returned raw SEC JSON
- Nothing saved to database
- Couldn't view in Prisma Studio

**After:**

- ✅ Fetches from SEC
- ✅ Saves to database
- ✅ Can view in Prisma Studio tables
- ✅ Can query saved data

No workers, no caching, no complexity - just **fetch → save → view**! 🎉
