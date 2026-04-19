# Backend — Database Schema

All models are defined using Flask-SQLAlchemy and live under `backend/model/`. The database is MySQL. Tables are created automatically on startup via `db.create_all()` in `seed.py`.

---

## File Structure

| File | Models |
|---|---|
| `model/users.py` | `Users`, `Bidders`, `Sellers`, `Helpdesk`, `LocalVendors` |
| `model/address.py` | `ZipcodeInfo`, `Address`, `CreditCards` |
| `model/requests.py` | `Requests` |
| `model/listings.py` | `Categories`, `AuctionListings`, `ListingRemovals`, `Bids`, `Transactions`, `Ratings` |
| `model/notifications.py` | `Notifications` |

All models are re-exported from `model/__init__.py` so that importing from `model` registers them with SQLAlchemy's metadata before `db.create_all()` runs.

---

## Tables

### Users
**File:** `model/users.py`

| Column | Type | Constraints |
|---|---|---|
| `email` | String(255) | Primary Key |
| `password` | String(255) | NOT NULL — stored as SHA-256 hash |
| `image_filename` | String(255) | nullable — UUID-based filename saved in `static/images/` |

Base table for all user types. Every bidder, seller, and helpdesk member has a row here. `image_filename` is shared across all roles since every user can have a profile image. When `NULL`, the system serves `DefaultUserImage.jpg`.

---

### Bidders
**File:** `model/users.py`

| Column | Type | Constraints |
|---|---|---|
| `email` | String(255) | Primary Key, FK → `users.email` |
| `first_name` | String(100) | NOT NULL |
| `last_name` | String(100) | NOT NULL |
| `age` | Integer | NOT NULL |
| `home_address_id` | String(32) | FK → `address.address_id`, nullable |
| `major` | String(100) | nullable |

Subset of `Users`. Bidders can place bids and make purchases.

---

### Sellers
**File:** `model/users.py`

| Column | Type | Constraints |
|---|---|---|
| `email` | String(255) | Primary Key, FK → `users.email` |
| `bank_routing_number` | String(50) | NOT NULL |
| `bank_account_number` | String(50) | NOT NULL |
| `balance` | Float | NOT NULL |

Subset of `Users`. Includes both student sellers (also bidders) and local vendors.

---

### Helpdesk
**File:** `model/users.py`

| Column | Type | Constraints |
|---|---|---|
| `email` | String(255) | Primary Key, FK → `users.email` |
| `position` | String(100) | NOT NULL |

Subset of `Users`. Staff who manage helpdesk requests.

---

### LocalVendors
**File:** `model/users.py`

| Column | Type | Constraints |
|---|---|---|
| `email` | String(255) | Primary Key, FK → `sellers.email` |
| `business_name` | String(255) | NOT NULL |
| `business_address_id` | String(32) | NOT NULL, FK → `address.address_id` |
| `customer_service_phone_number` | String(20) | NOT NULL |

Subclass of `Sellers`. All local vendors are sellers, but not all sellers are local vendors.

---

### ZipcodeInfo
**File:** `model/address.py`

| Column | Type | Constraints |
|---|---|---|
| `zipcode` | String(10) | Primary Key |
| `city` | String(100) | NOT NULL |
| `state` | String(50) | NOT NULL |

---

### Address
**File:** `model/address.py`

| Column | Type | Constraints |
|---|---|---|
| `address_id` | String(32) | Primary Key — MD5 hash |
| `zipcode` | String(10) | NOT NULL, FK → `zipcode_info.zipcode` |
| `street_num` | Integer | NOT NULL |
| `street_name` | String(255) | NOT NULL |

Referenced by `Bidders.home_address_id` and `LocalVendors.business_address_id`.

---

### CreditCards
**File:** `model/address.py`

| Column | Type | Constraints |
|---|---|---|
| `credit_card_num` | String(20) | Primary Key |
| `card_type` | String(50) | NOT NULL |
| `expire_month` | Integer | NOT NULL |
| `expire_year` | Integer | NOT NULL |
| `security_code` | String(4) | NOT NULL |
| `owner_email` | String(255) | NOT NULL, FK → `bidders.email` |

A bidder may have multiple credit cards. One card belongs to one bidder only.

---

### Requests
**File:** `model/requests.py`

| Column | Type | Constraints |
|---|---|---|
| `request_id` | Integer | Primary Key, autoincrement |
| `sender_email` | String(255) | NOT NULL, FK → `users.email` |
| `helpdesk_staff_email` | String(255) | NOT NULL — no FK, supports pseudo-account `helpdeskteam@lsu.edu` |
| `request_type` | String(50) | NOT NULL — e.g. `ChangeID`, `AddCategory`, `MarketAnalysis` |
| `request_desc` | String(255) | NOT NULL |
| `request_status` | Integer | NOT NULL, default `0` — `0`: incomplete, `1`: complete |

New requests are assigned to `helpdeskteam@lsu.edu` until a staff member claims them.

---

### Categories
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `category_name` | String(100) | Primary Key |
| `parent_category` | String(100) | FK → `categories.category_name`, nullable |

Self-referential hierarchy. The root node is `'All'` with `parent_category = NULL`. Top-level categories have `parent_category = 'All'`.

---

### AuctionListings
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `seller_email` | String(255) | Primary Key (composite), FK → `sellers.email` |
| `listing_id` | Integer | Primary Key (composite) — per-seller counter |
| `category` | String(100) | NOT NULL, FK → `categories.category_name` |
| `auction_title` | String(255) | NOT NULL |
| `product_name` | String(255) | NOT NULL |
| `product_description` | String(1000) | nullable |
| `quantity` | Integer | NOT NULL |
| `reserve_price` | Float | NOT NULL |
| `max_bids` | Integer | NOT NULL — auction ends when bid count reaches this |
| `status` | Integer | NOT NULL, default `1` — `1`: active, `0`: inactive, `2`: sold |
| `image_filename` | String(255) | nullable — UUID-based filename saved in `static/images/` |

`listing_id` is unique per seller, not globally. The composite `(seller_email, listing_id)` is the global identifier used as a FK in `Bids`, `Transactions`, and `ListingRemovals`.

**Status transitions:**
- Created → `1` (active)
- Auction ends, reserve met → `0` (hidden pending payment) → `2` (sold, after payment)
- Auction ends, reserve not met → `0` (inactive)
- Seller deactivates → `0` (inactive)

---

### ListingRemovals
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `removal_id` | Integer | Primary Key, autoincrement |
| `seller_email` | String(255) | NOT NULL, composite FK → `auction_listings` |
| `listing_id` | Integer | NOT NULL, composite FK → `auction_listings` |
| `removal_reason` | String(500) | NOT NULL |
| `bids_at_removal` | Integer | NOT NULL — remaining bids at time of removal |
| `removed_at` | DateTime | NOT NULL, default now |

Audit table populated when a seller deactivates a listing. Required by the schema extension spec.

---

### Bids
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `bid_id` | Integer | Primary Key, autoincrement |
| `seller_email` | String(255) | NOT NULL, composite FK → `auction_listings` |
| `listing_id` | Integer | NOT NULL, composite FK → `auction_listings` |
| `bidder_email` | String(255) | NOT NULL, FK → `bidders.email` |
| `bid_price` | Float | NOT NULL |

Each bid has a system-generated `bid_id`. Business rules (increment, turn-taking, auction end) are enforced in `bid_service.py`, not at the DB level.

---

### Transactions
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `transaction_id` | Integer | Primary Key, autoincrement |
| `seller_email` | String(255) | NOT NULL, composite FK → `auction_listings` |
| `listing_id` | Integer | NOT NULL, composite FK → `auction_listings` |
| `buyer_email` | String(255) | NOT NULL, FK → `bidders.email` |
| `date` | Date | NOT NULL |
| `payment` | Float | NOT NULL |

Created by `transaction_service.record_transaction` after a winning bidder completes payment. Creating a transaction also sets the listing status to `2` (sold).

---

### Ratings
**File:** `model/listings.py`

| Column | Type | Constraints |
|---|---|---|
| `bidder_email` | String(255) | Primary Key (composite), FK → `bidders.email` |
| `seller_email` | String(255) | Primary Key (composite), FK → `sellers.email` |
| `date` | Date | Primary Key (composite) |
| `rating` | Integer | NOT NULL — expected range 1–5 |
| `rating_desc` | String(255) | nullable |
| `transaction_id` | Integer | FK → `transactions.transaction_id`, nullable |

`transaction_id` is nullable to support historical seed data that predates the transaction table. For new ratings submitted through the system, `transaction_id` is required and used to prevent duplicate ratings per transaction.

---

### Notifications
**File:** `model/notifications.py`

| Column | Type | Constraints |
|---|---|---|
| `notification_id` | Integer | Primary Key, autoincrement |
| `user_email` | String(255) | NOT NULL, FK → `users.email` |
| `notification_type` | String(50) | NOT NULL |
| `message` | String(500) | NOT NULL |
| `seller_email` | String(255) | nullable — loose listing reference, no FK |
| `listing_id` | Integer | nullable — loose listing reference, no FK |
| `is_read` | Integer | NOT NULL, default `0` — `0`: unread, `1`: read |
| `created_at` | DateTime | NOT NULL, default now |

**Valid notification types:**

| Type | Trigger |
|---|---|
| `auction_won` | Bidder wins auction (reserve met) |
| `auction_lost` | Auction ends, bidder did not win |
| `auction_ended_no_sale` | Auction ends, reserve not met |
| `payment_due` | Winner needs to complete payment |
| `bid_placed` | Bid successfully placed |
| `bid_rejected` | Bid rejected with reason |
| `listing_removed` | A listing the user bid on was deactivated |

Listing reference (`seller_email`, `listing_id`) is stored without a FK constraint because notifications must persist even if listing data changes.
