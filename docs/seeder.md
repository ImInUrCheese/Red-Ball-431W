# Seeder

The seeder lives at `backend/seed.py`. It runs automatically on every backend startup via `init_db()`, which is called inside the Flask app context in `app.py`. It is idempotent — each table is only seeded if it is empty.

---

## How It Works

### `parse(file_path, type_map={})`

Reads a CSV file and returns a dict mapping each column header to a list of values.

```python
parse("testdb/Users.csv")
# → { 'email': ['a@lsu.edu', ...], 'password': ['abc123', ...] }
```

**Supported type converters** (passed via `type_map`):

| Converter | Input example | Output |
|---|---|---|
| `int` | `"42"` | `42` |
| `float` | `"3.14"` | `3.14` |
| `'price'` | `"$50 "` | `50.0` — strips `$` and whitespace |
| `'date'` | `"5/5/21"` | `datetime.date(2021, 5, 5)` |
| *(default)* | `"text"` | `"text"` — stripped string |

Empty fields are parsed as `None`.

---

### `seed(table, data, size)`

Inserts `size` rows into `table` using the column dict produced by `parse`. String values are stripped of whitespace before insertion.

```python
seed(Users, data, len(data['email']))
```

For tables where the CSV column names do not match the model column names (e.g. `Seller_Email` → `seller_email`), the data dict is manually remapped before calling `seed`.

---

### `init_db()`

Entry point called on startup. Steps:

1. `db.create_all()` — creates any missing tables
2. `SET FOREIGN_KEY_CHECKS=0` — disables FK validation during seeding to allow insertion in any order
3. Seeds each table if empty (see order below)
4. `SET FOREIGN_KEY_CHECKS=1` + final commit — re-enables FK validation

---

## Seeding Order

Tables are seeded in dependency order where possible. FK checks are disabled throughout, so the order is not strictly required but is kept logical for clarity.

| Order | Table | Notes |
|---|---|---|
| 1 | `ZipcodeInfo` | No dependencies |
| 2 | `Address` | FK → `ZipcodeInfo` |
| 3 | `Users` | No dependencies. Passwords are SHA-256 hashed before insertion |
| 4 | `Helpdesk` | FK → `Users`. CSV header `Position` mapped to model column `position` |
| 5 | `Bidders` | FK → `Users`, `Address` |
| 6 | `Sellers` | FK → `Users` |
| 7 | `LocalVendors` | FK → `Sellers`, `Address`. CSV headers remapped to snake_case |
| 8 | `CreditCards` | FK → `Bidders`. CSV header `card type` (with space) remapped to `card_type` |
| 9 | `Requests` | FK → `Users` |
| 10 | `Categories` | Self-referential — see special logic below |
| 11 | `AuctionListings` | FK → `Sellers`, `Categories`. `Reserve_Price` parsed with `'price'` converter |
| 12 | `Bids` | FK → `AuctionListings`, `Bidders` |
| 13 | `Transactions` | FK → `AuctionListings`, `Bidders`. `Date` parsed with `'date'` converter |
| 14 | `Ratings` | FK → `Bidders`, `Sellers`. `transaction_id` left as `NULL` for seed data |

---

## Categories — Special Seeding Logic

The `Categories` table is self-referential (`parent_category` → `category_name`). The CSV only contains child→parent pairs and does not include rows for top-level categories that have no parent of their own.

The seeder handles this in three steps:

1. **Insert `'All'`** — the root node with `parent_category = NULL`
2. **Detect orphan parents** — find any value that appears in `parent_category` but never in `category_name` across the CSV. These are top-level categories (e.g. `'Tv & Home Theater'`) that have no row of their own
3. **Insert orphan parents** with `parent_category = 'All'`
4. **Insert all CSV rows** as normal

This ensures every FK reference within the category hierarchy resolves to an existing row once FK checks are re-enabled.

---

## CSV Source Files

All CSV files are located in `backend/testdb/`.

| File | Table |
|---|---|
| `Users.csv` | `users` |
| `Bidders.csv` | `bidders` |
| `Sellers.csv` | `sellers` |
| `Helpdesk.csv` | `helpdesk` |
| `Local_Vendors.csv` | `local_vendors` |
| `Credit_Cards.csv` | `credit_cards` |
| `Address.csv` | `address` |
| `Zipcode_Info.csv` | `zipcode_info` |
| `Requests.csv` | `requests` |
| `Categories.csv` | `categories` |
| `Auction_Listings.csv` | `auction_listings` |
| `Bids.csv` | `bids` |
| `Transactions.csv` | `transactions` |
| `Ratings.csv` | `ratings` |
