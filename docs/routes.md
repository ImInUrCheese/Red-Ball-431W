# Routes

All route files live under `backend/routes/`. Routes are registered as Flask Blueprints and imported in `routes/__init__.py`. Each blueprint is registered with the Flask app at startup in `app.py`.

Routes are intentionally thin — they handle HTTP request parsing and response formatting only. All business logic and database access is delegated to the service layer (`backend/services/`).

---

## Registering a New Blueprint

1. Create a new file in `backend/routes/` (e.g. `routes/helpdesk.py`)
2. Define a blueprint and attach routes to it
3. Import and add it to the `blueprints` list in `routes/__init__.py`

```python
# routes/__init__.py
from .home import home_bp
from .login import login_bp
from .your_new_file import your_new_bp

blueprints = [home_bp, login_bp, your_new_bp]
```

---

## Existing Routes

### home.py — Blueprint: `home_bp`

| Method | Path | Description |
|---|---|---|
| GET | `/home` | Placeholder — returns no content |

---

### login.py — Blueprint: `login_bp`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | None | Authenticates a user by email and pre-hashed password |

**Request body:**
```json
{ "email": "user@lsu.edu", "password_hash": "<sha256 hex string>" }
```

**Responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "success": true, "role": "bidder" \| "seller" \| "helpdesk" }` | Valid credentials |
| 401 | `{ "success": false, "error": "Invalid email or password" }` | Invalid credentials |

**Notes:**
- Password is hashed client-side in `frontend/src/api/auth.ts` (SHA-256 via Web Crypto API)
- Hash is compared directly — no server-side hashing
- Frontend uses the returned `role` to route to the appropriate landing page
- On success, Flask sets `session['email']` and `session['role']`

---

### users.py — Blueprint: `users_bp`

All routes require an active session (`session['email']` and `session['role']` set by login).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Session | Returns profile fields for the logged-in user (role-specific) |
| GET | `/payment` | Session | Returns credit card info for the logged-in bidder |

**`GET /profile` responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | Role-specific profile dict (see below) | Success |
| 401 | `{ "error": "Not authenticated" }` | No active session |
| 404 | `{ "error": "Profile not found" }` | User row missing |

Profile shapes by role:
- **Bidder:** `email`, `first_name`, `last_name`, `age`, `major`, `home_address_id`, `image_url`
- **Seller:** `email`, `bank_routing_number`, `bank_account_number`, `balance`, `image_url`
- **Helpdesk:** `email`, `position`, `image_url`

**`GET /payment` responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "card_type", "last_four", "expire_month", "expire_year" }` | Card found |
| 401 | `{ "error": "Not authenticated" }` | No active session |
| 404 | `{ "error": "No payment info found" }` | No card on file |

---

### listings.py — Blueprint: `listings_bp`

| Method | Path | Description |
|---|---|---|
| GET | `/categories/<parent_category>` | Returns direct child category names of the given parent |
| GET | `/categories/leaf` | Returns all leaf-level category names (categories that have no children — these are the only valid categories for a listing) |
| GET | `/listings/category/<category_name>` | Returns all active listings under the given category, with bid stats |
| GET | `/listings/search` | Searches active listings by keyword and/or price range |
| GET | `/listings/<seller_email>/<listing_id>` | Returns full detail for a single listing, including bid stats |
| POST | `/listings` | Creates a new listing for a seller |
| PATCH | `/listings/<seller_email>/<listing_id>` | Updates allowed fields on a listing (blocked if sold or has bids) |
| POST | `/listings/<seller_email>/<listing_id>/deactivate` | Deactivates an active listing and writes a removal audit record |
| POST | `/listings/<seller_email>/<listing_id>/image` | Uploads an image for a listing (multipart/form-data, field: `file`) |
| GET | `/listings/seller/<seller_email>` | Returns all listings grouped by status: `{active, inactive, sold}` |
| GET | `/seller/<email>/active-listings` | Returns active listings for a seller with live bid stats |
| GET | `/seller/<email>/sales-history` | Returns ended (status 0 or 2) listings for a seller |

**`GET /listings/search` query params:** `keyword` (string), `min_price` (float), `max_price` (float) — all optional

**`POST /listings` request body:**
```json
{
  "seller_email": "seller@lsu.edu",
  "category": "Textbooks",
  "auction_title": "My Auction",
  "product_name": "Item Name",
  "product_description": "Optional description",
  "quantity": 1,
  "reserve_price": 10.0,
  "max_bids": 5
}
```
Returns `{ "success": true, "listing_id": <int> }` on success (HTTP 201).

**`PATCH /listings/<seller_email>/<listing_id>` request body:** any subset of the allowed fields:
`category`, `auction_title`, `product_name`, `product_description`, `quantity`, `reserve_price`, `max_bids`

**`POST /listings/<seller_email>/<listing_id>/deactivate` request body:**
```json
{ "removal_reason": "Reason text" }
```

---

### bids.py — Blueprint: `bids_bp`

| Method | Path | Description |
|---|---|---|
| POST | `/bids` | Places a bid (validates increment, auction end, and turn-taking rules) |
| GET | `/bids/<seller_email>/<listing_id>` | Returns current bid stats: `bid_count`, `bids_remaining`, `highest_bid`, `highest_bidder` |
| GET | `/bids/<seller_email>/<listing_id>/history` | Returns full bid history ordered by price descending: `[{bidder_email, bid_price}]` |
| GET | `/bids/<seller_email>/<listing_id>/status` | Returns auction completion status: `{complete, winner?, reserve_met?, highest_bid?}` |
| GET | `/bids/bidder/<email>` | Returns all active auctions the bidder has bid on, with their highest bid and leading status |

**`POST /bids` request body:**
```json
{
  "bidder_email": "bidder@lsu.edu",
  "seller_email": "seller@lsu.edu",
  "listing_id": 1,
  "bid_price": 25.00
}
```

**`POST /bids` responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "success": true, "highest_bid", "bids_remaining", "auction_complete" }` | Bid placed |
| 400 | `{ "success": false, "error": "<reason>" }` | Validation failed |

Possible error strings: `"Listing not found"`, `"Auction has ended"`, `"Bid must be at least $X.XX"`, `"You must wait for another bidder before bidding again"`

---

### notifications.py — Blueprint: `notifications_bp`

| Method | Path | Description |
|---|---|---|
| GET | `/notifications/<user_email>` | Returns all notifications for the user, newest first |
| PATCH | `/notifications/<notification_id>/read` | Marks a single notification as read |
| PATCH | `/notifications/<user_email>/read-all` | Marks all notifications for the user as read |

**`GET /notifications/<user_email>` response shape per item:**
`notification_id`, `user_email`, `notification_type`, `message`, `seller_email?`, `listing_id?`, `is_read`, `created_at`

---

### ratings.py — Blueprint: `ratings_bp`

| Method | Path | Description |
|---|---|---|
| GET | `/ratings/seller/<seller_email>/average` | Returns `{ "average_rating": float \| null }` |
| GET | `/ratings/seller/<seller_email>` | Returns all ratings for a seller |
| GET | `/ratings/check` | Checks if a bidder is eligible to rate a transaction |
| POST | `/ratings` | Submits a rating |

**`GET /ratings/check` query params:** `bidder_email`, `seller_email`, `transaction_id`

**`POST /ratings` request body:**
```json
{
  "bidder_email": "bidder@lsu.edu",
  "seller_email": "seller@lsu.edu",
  "transaction_id": 1,
  "rating": 5,
  "rating_desc": "Optional description"
}
```

---

## Routes Not Yet Implemented

| Feature | Notes |
|---|---|
| `POST /register` (bidder / seller / helpdesk) | Registration service functions exist; routes not built |
| `PATCH /profile` | Profile update services exist; routes not built |
| `POST /transactions` | `record_transaction` service exists; route not built |
| Helpdesk request routes | All helpdesk service functions exist; routes not built |
