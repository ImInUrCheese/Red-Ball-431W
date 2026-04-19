# Services

All service files live under `backend/services/`. Services are the only layer that reads from or writes to the database. Routes call services; services never call routes. Some services call other services where a business rule requires it — see the dependency notes below.

---

## Service Dependencies

```
image_service          (no dependencies)
notification_service   (no dependencies)
       ↑                      ↑
bid_service            → notification_service
transaction_service    → notification_service
user_service           → image_service
listing_service        → image_service
helpdesk_service       (no dependencies)
rating_service         (no dependencies)
```

---

## image_service.py

Handles image file validation, saving, and URL resolution. Does not touch the database — it only manages files on disk. Called by `user_service` and `listing_service`.

**Accepted formats:** `.jpg`, `.jpeg`, `.png`

**Storage location:** `backend/static/images/` — served by Flask at `/static/images/<filename>`

**Default image:** `backend/model/DefaultUserImage.jpg` is copied into `static/images/` on startup by `ensure_default_image()` (called from `app.py`). All `image_filename = NULL` cases resolve to this file.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `ensure_default_image` | — | `None` | Copies `DefaultUserImage.jpg` from `model/` to `static/images/` if not already present. Called once at app startup |
| `get_image_url` | `filename: str \| None` | `str` | Returns `/static/images/<filename>`, or `/static/images/DefaultUserImage.jpg` when `filename` is `None` |
| `save_image` | `file` | `dict` | Validates extension, generates a UUID-based filename, saves to `static/images/`. Returns `{success, filename}` or `{success, error}` |

---

## notification_service.py

Handles creation and retrieval of user notifications. Called internally by `bid_service` and `transaction_service`.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `create_notification` | `user_email`, `notification_type`, `message`, `seller_email?`, `listing_id?` | `None` | Creates and commits a notification for a user |
| `get_user_notifications` | `user_email` | `list[dict]` | Returns all notifications for a user, newest first |
| `mark_read` | `notification_id` | `bool` | Marks a single notification as read. Returns `False` if not found |
| `mark_all_read` | `user_email` | `None` | Marks all unread notifications for a user as read |

---

## user_service.py

Handles authentication, registration, and profile management for all user roles.

### Authentication

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `authenticate` | `email`, `password_hash` | `dict` | Verifies credentials. Returns `{success, role}` or `{success, error}` |
| `_get_role` | `email` | `str` | Returns `'bidder'`, `'seller'`, `'helpdesk'`, or `'unknown'` |

### Registration

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `register_bidder` | `email`, `password_hash`, `first_name`, `last_name`, `age`, `major?`, `home_address_id?` | `dict` | Creates `Users` + `Bidders` rows. Returns `{success}` or `{success, error}` |
| `register_seller` | `email`, `password_hash`, `bank_routing_number`, `bank_account_number` | `dict` | Creates `Users` + `Sellers` rows. Balance initialised to `0.0` |
| `register_helpdesk` | `email`, `password_hash`, `position` | `dict` | Creates `Users` + `Helpdesk` rows |

All registration functions reject duplicate emails.

### Profile Reads

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `get_bidder_profile` | `email` | `dict \| None` | Returns bidder fields. `None` if not found |
| `get_seller_profile` | `email` | `dict \| None` | Returns seller fields including balance |
| `get_helpdesk_profile` | `email` | `dict \| None` | Returns email and position |

### Profile Updates

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `update_bidder_profile` | `email`, `first_name?`, `last_name?`, `age?`, `major?`, `home_address_id?` | `dict` | Updates only the fields provided. Email cannot be changed |
| `update_seller_profile` | `email`, `bank_routing_number?`, `bank_account_number?` | `dict` | Updates only the fields provided |
| `update_password` | `email`, `new_password_hash` | `dict` | Replaces the stored password hash |
| `upload_user_image` | `email`, `file` | `dict` | Validates and saves a profile image (`.jpg`, `.jpeg`, `.png`), stores the filename on the `Users` row. Returns `{success, image_url}` or `{success, error}`. Falls back to `DefaultUserImage.jpg` when no image is set |

All profile read functions (`get_bidder_profile`, `get_seller_profile`, `get_helpdesk_profile`) include an `image_url` field in their returned dict, resolved via `image_service.get_image_url`.

---

## listing_service.py

Handles category browsing, auction listing CRUD, and product search.

### Category Hierarchy

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `get_subcategories` | `parent_category` | `list[str]` | Returns direct children of a category node, sorted alphabetically |
| `get_listings_by_category` | `category_name` | `list[dict]` | Returns all active (`status=1`) listings under a category |

### Listing Detail

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `get_listing_detail` | `seller_email`, `listing_id` | `dict \| None` | Returns full listing info plus `highest_bid`, `bid_count`, `bids_remaining` |

### Seller Listing Management

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `get_seller_listings` | `seller_email` | `dict` | Returns listings grouped by status: `{active, inactive, sold}` |
| `create_listing` | `seller_email`, `category`, `auction_title`, `product_name`, `product_description`, `quantity`, `reserve_price`, `max_bids` | `dict` | Creates a new active listing. Auto-assigns the next `listing_id` for that seller |
| `update_listing` | `seller_email`, `listing_id`, `**fields` | `dict` | Updates allowed fields. Blocked if listing is sold or if active with existing bids |
| `deactivate_listing` | `seller_email`, `listing_id`, `removal_reason` | `dict` | Sets status to `0` and writes a `ListingRemovals` audit record |

| `upload_listing_image` | `seller_email`, `listing_id`, `file` | `dict` | Validates and saves a listing image (`.jpg`, `.jpeg`, `.png`), stores the filename on the `AuctionListings` row. Returns `{success, image_url}` or `{success, error}`. Falls back to `DefaultUserImage.jpg` when no image is set |

**`update_listing` allowed fields:** `category`, `auction_title`, `product_name`, `product_description`, `quantity`, `reserve_price`, `max_bids`

All listing serializers (`get_listing_detail`, `get_listings_by_category`, `get_seller_listings`, `search_listings`) include an `image_url` field in every listing dict, resolved via `image_service.get_image_url`.

### Search

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `search_listings` | `keyword?`, `min_price?`, `max_price?` | `list[dict]` | Searches active listings using SQL `ILIKE` across title, name, description, category, and seller email. Optionally filters by price range |

---

## bid_service.py

Handles bid placement and auction completion logic. Calls `notification_service` internally when an auction ends.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `place_bid` | `bidder_email`, `seller_email`, `listing_id`, `bid_price` | `dict` | Places a bid after validating all three rules (see below). Triggers `_close_auction` if `max_bids` is reached |
| `get_listing_bids` | `seller_email`, `listing_id` | `dict \| None` | Returns `bid_count`, `bids_remaining`, `highest_bid`, `highest_bidder` |
| `check_auction_complete` | `seller_email`, `listing_id` | `dict \| None` | Returns `{complete, winner, reserve_met, highest_bid}` |

**Bid validation rules enforced by `place_bid`:**

| Rule | Description |
|---|---|
| Increment rule | New bid must be at least `$1.00` higher than the current highest bid |
| Auction end rule | Bid count must be less than `max_bids` |
| Turn-taking rule | A bidder cannot place two consecutive bids on the same listing |

**Auction completion (`_close_auction`, internal):**

Called automatically by `place_bid` when `max_bids` is reached. Behaviour depends on whether the reserve price is met:

- **Reserve met:** Sets listing to `status=0` (pending payment), notifies winner with `auction_won` and `payment_due`, notifies all other bidders with `auction_lost`
- **Reserve not met:** Sets listing to `status=0` (inactive), notifies all bidders with `auction_ended_no_sale`

---

## transaction_service.py

Records completed payments and updates listing status. Calls `notification_service` on completion.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `record_transaction` | `seller_email`, `listing_id`, `buyer_email`, `payment` | `dict` | Creates a `Transactions` row and sets listing `status=2` (sold) in one commit. Blocked if listing is still active (`status=1`) or already sold (`status=2`) |
| `get_buyer_transactions` | `buyer_email` | `list[dict]` | Returns all transactions for a buyer, newest first |
| `get_seller_transactions` | `seller_email` | `list[dict]` | Returns all transactions for a seller, newest first |

---

## helpdesk_service.py

Manages helpdesk requests submitted by users.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `create_request` | `sender_email`, `request_type`, `request_desc` | `dict` | Creates a new request assigned to `helpdeskteam@lsu.edu` with `status=0` |
| `get_pending_requests` | — | `list[dict]` | Returns all requests with `status=0` |
| `get_requests_by_staff` | `helpdesk_staff_email` | `list[dict]` | Returns all requests assigned to a specific staff member |
| `assign_request` | `request_id`, `helpdesk_staff_email` | `dict` | Reassigns a request to a specific staff member |
| `complete_request` | `request_id` | `dict` | Sets request `status=1` (complete) |

**Request types** (not exhaustive — new types can be added without schema changes): `ChangeID`, `AddCategory`, `MarketAnalysis`

---

## rating_service.py

Handles seller ratings submitted by bidders after a completed transaction.

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `can_rate` | `bidder_email`, `seller_email`, `transaction_id` | `dict` | Checks eligibility: transaction must exist, belong to the bidder and seller, and have no existing rating. Returns `{eligible}` or `{eligible, reason}` |
| `submit_rating` | `bidder_email`, `seller_email`, `transaction_id`, `rating`, `rating_desc?` | `dict` | Calls `can_rate` first. Submits rating using the transaction date |
| `get_seller_average_rating` | `seller_email` | `float \| None` | Returns average rating rounded to 2 decimal places. `None` if no ratings exist |
| `get_seller_ratings` | `seller_email` | `list[dict]` | Returns all ratings for a seller |

**Rating eligibility rules:**
- Bidder must have a completed transaction with the seller (`transaction_id` must exist and match both parties)
- Each transaction can only be rated once (`transaction_id` uniqueness enforced)
