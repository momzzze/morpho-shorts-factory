# Quick Start - Stocks API with Database

## 🎯 Test the Full Flow

### 1. Start API

```bash
pnpm dev:api
```

### 2. Test in Postman

1. Import `postman-collection.json`
2. Open **Stocks Module - WITH DATABASE** folder
3. Run these in order:

**First - Save some data:**

- **3. Fetch & Save Fundamentals (AAPL)** → Saves Apple data
- **4. Fetch & Save Fundamentals (MSFT)** → Saves Microsoft data

**Then - View saved data:**

- **1. List All Saved Companies** → See both companies
- **5. Get Saved Data (AAPL)** → View Apple's saved fundamentals

### 3. View in Prisma Studio

```bash
# Open database UI
pnpm --filter api db:studio
```

Go to http://localhost:5555 and:

- Click **companies** table → See AAPL and MSFT
- Click **fundamentals_snapshots** table → See all financial data in rows!

---

## What Each Endpoint Does

| Endpoint                           | What it does                     |
| ---------------------------------- | -------------------------------- |
| `GET /stocks/list`                 | Lists all companies you've saved |
| `GET /stocks/:ticker/info`         | Get company name from SEC        |
| `GET /stocks/:ticker/fundamentals` | **Fetch from SEC & save to DB**  |
| `GET /stocks/:ticker/saved`        | Get saved data from DB           |

---

## The Magic

When you call `/stocks/AAPL/fundamentals`:

1. ✅ Fetches from SEC API
2. ✅ Saves to `companies` table
3. ✅ Saves 10-15 periods to `fundamentals_snapshots` table
4. ✅ Returns the saved data

Now you can **view it in Prisma Studio as nice table rows**! 🎉

---

## No More:

- ❌ Workers
- ❌ Job queues
- ❌ Background tasks
- ❌ Caching complexity

## Just:

- ✅ Fetch from SEC
- ✅ Save to database
- ✅ View in tables

Simple! 🚀
