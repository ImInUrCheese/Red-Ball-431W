# Routes

All route files live under `backend/routes/`. Routes are registered as Flask Blueprints and imported in `routes/__init__.py`. Each blueprint is registered with the Flask app at startup in `app.py`.

Routes are intentionally thin — they handle HTTP request parsing and response formatting only. All business logic and database access is delegated to the service layer (`backend/services/`).

---

## Registering a New Blueprint

1. Create a new file in `backend/routes/` (e.g. `routes/listings.py`)
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
| GET | `/home` | Placeholder endpoint — returns no content |

---

### login.py — Blueprint: `login_bp`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | None | Authenticates a user by email and pre-hashed password |

**Request body:**
```json
{
  "email": "user@lsu.edu",
  "password_hash": "<sha256 hex string>"
}
```

**Responses:**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ "success": true, "role": "bidder" \| "seller" \| "helpdesk" }` | Valid credentials |
| 401 | `{ "success": false, "error": "Invalid email or password" }` | Invalid credentials |

**Notes:**
- The password is hashed client-side in `frontend/src/api/auth.ts` using the Web Crypto API (SHA-256) before being sent
- The hash is compared directly against the stored hash — no server-side hashing occurs in this route
- The frontend uses the returned `role` to route the user to the appropriate landing page
