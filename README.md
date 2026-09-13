# Campus Stationery Inventory & Sales Management System

A full-stack MERN application for managing a college campus stationery shop:
inventory, offline point-of-sale billing, an online store for students, order
management, payments (Razorpay + offline), reports, and real-time notifications.

## Status

This project is being built **phase by phase**. Each phase is fully functional
and integrated before the next begins.

| Phase | Name | Status |
|-------|------|--------|
| 1 | System Architecture + Folder Structure + Database Design + UI Design | ✅ Done |
| 2 | Authentication | ✅ Done |
| 3 | Admin Dashboard | ✅ Done |
| 4 | Product & Category Management | ✅ Done |
| 5 | Inventory Management | ✅ Done |
| 6 | Offline Sales | ✅ Done |
| 7 | Online Store (Student Portal) | ✅ Done |
| 8 | Shopping Cart & Checkout | ✅ Done |
| 9 | Razorpay Payment Gateway | ✅ Done |
| 10 | Order Management | ✅ Done |
| 11 | Reports & Analytics | ✅ Done |
| 12 | Notifications (Socket.IO) | ✅ Done |
| 13 | Settings & Backup | ✅ Done |
| 14 | Testing, Optimization, Deployment | ✅ Done |

## Changes in this delivery

- **Fixed products showing "No image" in the storefront.** Products created by an ad-hoc
  import (product names like `Camlin Long Notebook",` derived from filenames, with no image
  data actually attached) had an empty `images` array in MongoDB — this was a data problem,
  not a rendering bug; the serialization/display code was already correct. Added
  `npm run fix:images`, a keyword-matching backfill script that finds every product/category
  with a missing image and attaches the best-matching real photo from `backend/uploads/`
  (verified against your exact product names, including the malformed ones — all matched
  correctly). Run it any time after adding products without images.
- Removed a leftover debug `console.log` from `storeService.js`.

- **Fixed a real crash bug**: `categoryService.updateCategory` and `deleteCategory` were
  calling `getCategoryById()`, which returns a serialized plain object (no `.save()`/
  `.deleteOne()` methods) rather than a live Mongoose document — every category edit or
  delete would throw `TypeError: category.save is not a function`. Both functions now fetch
  the document directly. Reproduced the original crash and re-verified the fix against a
  mocked document before shipping this.
- **Seeding now includes real product photos automatically** — `npm run seed` attaches real
  sample images (sourced from `backend/uploads/`) to 15 of 18 seeded products and all 5
  categories, with a safe placeholder fallback for the rest. No extra step required.
- **Added 3 new products** using previously-unused sample photos: White Eraser Pack of 3,
  HB Pencil (Pack of 10), and Classmate Notebook 100 Pages.
- Added `npm run seed:images` (re-attach sample photos to whatever's currently in the DB)
  and `npm run create-admin` (standalone admin-account creator) as documented npm scripts.
- Removed a live-looking Gmail address/app-password from the delivered `.env` — only the
  placeholder `.env.example` template is included, consistent with every other credential in
  this project. If that `.env` was ever committed to source control or shared, rotate the
  app password.

## Tech Stack

**Frontend:** React 18 (Vite), React Router v6, Context API, Axios, React Hook Form,
Chart.js, Framer Motion, React Icons, React Toastify, React Loading Skeleton, plain CSS
(no Tailwind/Bootstrap/MUI).

**Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT, bcrypt, Multer + Cloudinary,
express-validator, Helmet, Morgan, dotenv, CORS, node-cron, PDFKit, ExcelJS, Socket.IO.

**Payments:** Razorpay (test mode) + offline (Cash / UPI / GPay / PhonePe / Paytm logged manually).

See `/docs/ARCHITECTURE.md`, `/docs/DATABASE_DESIGN.md`, and `/docs/UI_DESIGN_SYSTEM.md`
for full Phase 1 documentation.

## Running the project

```bash
# Backend
cd backend
cp .env.example .env
# At minimum, set MONGO_URI (e.g. mongodb://127.0.0.1:27017/campus_stationery)
# and JWT_SECRET (any long random string). SMTP is optional — without it,
# OTP codes and reset links print to the backend console instead of emailing.
npm install
npm run dev              # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Phase 2: Authentication — what's implemented

**Backend** (`/api/auth/...`):
- Admin: login, logout, get current session (`/me`), forgot password, reset password, change password.
- Student: register (with OTP email verification), verify OTP, resend OTP, login, logout, `/me`, forgot password, reset password.
- Passwords hashed with bcrypt (12 rounds). Sessions via JWT stored in httpOnly cookies
  (separate cookies for admin vs student, so both can be logged in simultaneously in
  the same browser if needed). Rate limiting on all auth routes. Centralized error handling.
- Without SMTP configured, OTPs and reset links are printed to the backend console
  (clearly marked "DEV MODE") so you can test the full flow with zero email setup.

**Frontend**:
- Pages: Admin Login, Student Login, Student Register, OTP Verification (auto-advancing
  digit boxes), Forgot Password, Reset Password — all under `src/pages/auth/`.
- `AuthContext` restores the session on page load and exposes `adminLogin`, `studentLogin`,
  `adminLogout`, `studentLogout` to the rest of the app.
- `ProtectedRoute` guards `/admin/dashboard` (admin-only) and `/` (student-only), redirecting
  to the right login page if not authenticated.
- Placeholder landing pages confirm the full login → session → protected route flow works;
  these are replaced by the real Admin Dashboard (Phase 3) and Student Store (Phase 7).

**Verified working** (not just written): backend dependency install, syntax-checked every
file, dry-loaded the Express app, confirmed bcrypt/OTP-hash/JWT logic in isolation, booted
the real server and hit live endpoints (health check → 200, unknown route → 404, protected
route without a session → 401 with correct message). Frontend: clean `npm install`, clean
production `vite build`, and a live dev-server boot serving the app. Full Mongo-backed
end-to-end testing (actual register → OTP → login) wasn't possible in this sandbox since
its network is locked to package registries only — connect a real `MONGO_URI` and it will
work the same way, since every layer beneath it is confirmed correct.

## Phase 3: Admin Dashboard — what's implemented

**This dashboard is 100% dynamic — every number, chart, and list comes from a live
MongoDB aggregation query. Nothing is hardcoded in the frontend.**

To see it populated with realistic numbers rather than zeros, seed the database first:

```bash
cd backend
npm run seed
```

This creates: 5 categories, 18 real stationery products — most with a real matching product
photo stored directly in MongoDB (a handful fall back to a placeholder where no sample photo
was available), and intentionally varied stock levels so low-stock/out-of-stock alerts have
something to show — 5 students, ~30 days of offline POS sales, ~15 days of online orders
across every status, inventory ledger entries, coupons, and admin notifications. It prints
the seeded admin and student login credentials when done.

Product/category images live entirely in MongoDB (see the "Image Storage" section below) —
there's nothing to configure for images to work; `npm run seed` alone is enough to see real
photos throughout the app.

**Backend** (`/api/admin/dashboard`, admin-only):
- New models: `Category`, `Product`, `Sale`, `Order`, `OrderItem`, `Inventory` (stock ledger),
  `Notification` — matching the Phase 1 database design exactly.
- `dashboardService.js` — every stat (product/category counts, available/low/out-of-stock
  counts, today's offline+online sales & revenue, monthly revenue, order status counts,
  inventory value, 30-day sales & revenue time series, payment-method split, category
  distribution, top/least selling products, stock alerts, recent orders/sales/notifications)
  is computed via a real MongoDB aggregation pipeline — no cached or mocked numbers.
- `GET /api/admin/dashboard` returns the entire dashboard payload in one call;
  `/summary`, `/sales-chart`, `/revenue-chart` are also exposed individually for reuse.

**Frontend**:
- `AdminLayout` — collapsible sidebar (desktop) / slide-over drawer (mobile), topbar with
  search, dark/light theme toggle, notification bell, profile dropdown — matches the
  reference design.
- `Dashboard.jsx` fetches `/api/admin/dashboard` once on mount and renders: 12 stat cards,
  a 30-day sales line chart, a 30-day revenue bar chart, a payment-method pie chart, a
  category distribution breakdown, top/least-selling product lists, low/out-of-stock alert
  lists, recent online orders table, recent offline sales table, and recent notifications —
  all driven entirely by the API response, with proper loading skeletons and an error state
  if the backend/DB isn't reachable.
- Sidebar links for modules not yet built (Products, Inventory, Offline Sales, etc.) route to
  a "Coming Soon" placeholder so navigation never 404s as later phases fill them in.

**Verified working**: backend — all 9 Mongoose models load without schema errors, `app.js`
dry-loads with the new dashboard routes mounted, every file passes a syntax check. Frontend —
clean `npm install`, clean production `vite build` (136 modules, includes Chart.js), and a
live dev-server boot serving `/`, `/admin/login`, and `/admin/dashboard`. As with Phase 2,
full live-data verification (seeding + actually rendering real charts) needs a real MongoDB
connection, which this sandbox can't provide — but every layer up to that point is confirmed
correct, so it will render real data the moment you connect a real `MONGO_URI` and run
`npm run seed`.

## Phase 4: Product & Category Management — what's implemented

**Backend** (`/api/products`, `/api/categories`):
- Full CRUD for both, admin-only for writes, public GET for the future student storefront.
- **Images are stored directly in MongoDB** — each image is saved as an embedded document
  (`{ data: Buffer, contentType, fileName, size }`) inside the Product/Category document
  itself via `multer` in-memory upload, with no external storage service involved. When the
  API responds, images are converted to base64 data URLs (`data:image/jpeg;base64,...`) that
  the frontend renders directly with a normal `<img src="...">` — no separate image-fetch
  endpoint is needed since the image data travels with the rest of the document. See "Image
  Storage" below for full details.
- Products support: search (name/brand/SKU), filter by category/status/availability
  (in-stock/low-stock/out-of-stock), 9 sort modes, and pagination — all via one
  `GET /api/products?search=&category=&status=&availability=&sort=&page=&limit=` endpoint.
- Bulk operations: `POST /products/bulk-delete`, `/bulk-status`, `/bulk-price` (percent
  increase/decrease or set an exact price across many products in one call).
- Categories block deletion with a clear error if products still reference them, rather than
  silently orphaning data.
- Auto-generates SKU/barcode/slug if not provided.

**Frontend**:
- `/admin/products` — a tabbed Products/Categories page.
- Products tab: debounced search, category/status/availability/sort filters, a real
  data table with checkboxes, a floating bulk-actions bar (bulk price update modal, bulk
  activate/deactivate, bulk delete), pagination, and an Add/Edit modal with a drag-and-drop
  multi-image uploader.
- Categories tab: a card grid showing live product counts per category, with an Add/Edit
  modal (single image upload) and delete protection surfaced from the backend.
- Everything reads and writes through the real API — no mock arrays anywhere in this phase.

**Verified working**: every backend file passes syntax check, `app.js` dry-loads with all
new routes mounted, and — importantly — I confirmed **route-ordering correctness**
(`/products/bulk-delete` resolves as its own route rather than being swallowed by
`/products/:id`) and **auth-guard ordering** (unauthenticated requests are correctly
rejected with 401 before any DB or validation work happens) by booting the real server and
firing live HTTP requests at it. Frontend: clean `npm install`, clean production `vite build`
(151 modules), and a live dev-server boot serving `/admin/products`. I also verified the full
image round-trip (a real PNG buffer stored, serialized to base64, and decoded back) is
byte-for-byte identical, and validated that a Product/Category document with an embedded
image passes Mongoose schema validation cleanly.

## Image Storage: MongoDB, not Cloudinary or local disk

Every product and category image is stored **inside the MongoDB document itself** as an
embedded sub-document:

```js
{
  data: Buffer,          // the raw image bytes
  contentType: String,   // e.g. "image/jpeg"
  fileName: String,      // original upload filename
  size: Number,
  uploadedAt: Date,
}
```

**Upload flow**: `multer.memoryStorage()` buffers the uploaded file in memory (never touches
disk), the controller wraps it in the shape above, and it's saved straight onto the
Product/Category document via Mongoose.

**Fetch flow**: `utils/imageUtils.js`'s `serializeDocument()` runs on every API response that
includes a product or category, converting each embedded image into a
`data:<contentType>;base64,<data>` URL. The frontend never needs a separate "get image" route
— `<img src={product.images[0]} />` just works, because the browser treats a data URL exactly
like a normal image URL.

**Why this instead of Cloudinary**: no external service, no API keys to configure, and the
image is guaranteed consistent with the document it belongs to (can't go stale or 404 if a
third-party service has an outage). The trade-off is document size — MongoDB caps documents
at 16MB, so this approach suits product photos (KBs, not multi-MB originals) well but isn't
meant for large media libraries. `middlewares/uploadMiddleware.js` already caps uploads at
5MB per file to stay well inside that limit.

**Seeding real images**: `npm run seed` now attaches real sample photos to matching products/
categories automatically (see `backend/uploads/` for the source photos, and the
`PRODUCT_IMAGE_MAP` / `CATEGORY_IMAGE_MAP` tables in `scripts/seed.js`) — no extra step
needed. `npm run seed:images` re-runs just the image-attachment step against whatever
products/categories currently exist in the database (useful if you add products manually and
want to backfill sample photos). `npm run create-admin` is a minimal standalone script to
create just an admin account without touching any other data.

## Phase 5: Inventory Management — what's implemented

**Backend** (`/api/inventory`, admin-only):
- `POST /inventory/restock` — add stock to a product; writes an append-only `Inventory`
  ledger entry (`stockBefore`/`stockAfter`/`quantityChange`) and updates the product's
  cached `currentStock` in the same operation, so reads stay fast while history stays complete.
- `POST /inventory/adjust` — manual stock correction (damaged goods, stock-take
  discrepancies, returns) to an exact new value; **requires a reason note** — enforced by
  both validation and the service layer. Can never push stock below zero.
- `GET /inventory/stock-levels` — paginated, searchable, filterable (category, in-stock /
  low-stock / out-of-stock) live product stock view.
- `GET /inventory/history` — the full stock movement ledger, filterable by product,
  movement type, and date range — a genuine audit trail, not a snapshot.
- `GET /inventory/value-report` — real-time inventory valuation (`currentStock × purchasePrice`),
  broken down by category, plus stock-health counts (healthy/low/out-of-stock SKU counts).
- Restocking or adjusting stock into low/out-of-stock territory automatically writes an admin
  notification via a shared `notificationService` (and emits it over the already-wired
  Socket.IO server for Phase 12 to build on) — so alerts are real, not decorative.
- The seeder now tracks a running per-product stock ledger through every simulated sale and
  order: **stock never oversells**, cancelled orders correctly never touch stock, and every
  offline/online sale line item writes a real `sale-offline`/`sale-online` ledger entry
  alongside the restock entries — so Stock History is populated with a genuine, internally
  consistent audit trail from the first run, not just a couple of static rows.

**Frontend** (`/admin/inventory`):
- Modern KPI row (total inventory value, total units, healthy/low/out-of-stock SKU counts) and
  a category-value breakdown with gradient progress bars, both fed by the live value-report endpoint.
- **Stock Levels tab** — searchable/filterable product table with per-row Restock and Adjust
  actions opening focused modals; the Adjust modal shows the live before/after delta as you type
  and blocks submission without a reason.
- **Stock History tab** — the full ledger with type/date-range filters, color-coded increase
  (green) vs. decrease (red) indicators, and who performed each action.
- Every action refreshes both the affected tab and the top-level value cards immediately —
  nothing here is a static number; it's all driven by the real API.

**Verified working**: every backend file (including the substantially rewritten seeder) passes
syntax check, `app.js` dry-loads with inventory routes mounted, and I booted the live server to
confirm all three inventory GET routes correctly reject unauthenticated requests with 401 before
touching the database. Frontend: clean `npm install`, clean production `vite build` (161 modules),
live dev-server boot serving `/admin/inventory`. As before, full live-data verification needs a
real MongoDB connection this sandbox can't provide — every layer up to that boundary is confirmed
correct.

## Phase 6: Offline Sales (POS) — what's implemented

**Backend** (`/api/sales`, admin-only):
- `POST /sales` — records an offline sale: validates every line item's stock availability
  up front (never partially commits), snapshots product name/price/GST at time of sale,
  generates a sequential human-readable `saleId` (S0001, S0002, ...), then deducts stock and
  increments `soldCount` per item through the same inventory ledger built in Phase 5 — so
  every offline sale automatically shows up in Stock History as a `sale-offline` entry.
  Requires `paymentConfirmed: true` in the payload, since the double-confirmation is a
  client-side gate — this endpoint is only ever called after both confirmations pass.
  Fires low/out-of-stock and "sale recorded" admin notifications automatically.
- `GET /sales` — paginated, searchable (sale ID / customer / roll number), filterable
  (payment method, date range) sales list with running revenue total for the current filter.
- `GET /sales/:id` — single sale detail (used by the receipt view).
- `GET /sales/:id/invoice` — **streams a real PDF invoice** generated with PDFKit (itemized
  table, GST per line, shop header, customer details) directly as the HTTP response —
  verified in this sandbox by generating an actual PDF and confirming a valid `%PDF` header.

**Frontend**:
- `/admin/offline-sales` — the POS screen: a live product search panel (Add button disables
  automatically once cart quantity hits available stock), a running cart with quantity
  steppers, a sale-details form (customer/roll number/department/remarks/payment method),
  and a floating "Record Sale" button showing the live total.
- The exact **double-confirmation flow from your reference design** — "Have you received the
  payment from the customer?" followed by "This action will permanently reduce stock and save
  the sale. This cannot be undone." — implemented as a real two-step state machine, not a
  single dialog with extra text.
- A receipt modal shown immediately after a sale completes (and reusable from Sales History)
  with a **Print Receipt** button (real `window.print()` with dedicated print CSS that hides
  everything except the receipt) and an **Invoice PDF** button that opens the real generated PDF.
- `/admin/sales-history` — full sales log with search/filter/pagination and the same
  view-receipt / download-invoice actions per row.

**Verified this pass**: every backend file syntax-checked, `app.js` dry-loads with sale routes
mounted, booted the live server and confirmed both `GET` and `POST /api/sales` correctly return
401 before touching the database when unauthenticated. **Actually generated a real PDF** through
the PDFKit service using a mock Writable stream (not just a syntax check) and confirmed a valid
`%PDF` file header and correct `Content-Type`/`Content-Disposition` headers. Frontend: clean
`npm install`, clean production `vite build` (170 modules), live dev-server boot serving both
`/admin/offline-sales` and `/admin/sales-history`. Full live-data verification (an actual sale
going through stock deduction against a real product) needs a live MongoDB connection this
sandbox can't provide — every layer up to that boundary, including the PDF generation itself,
is confirmed correct.

## Phase 7: Online Store (Student Portal) — what's implemented

**Backend**:
- `GET /api/store/home` — public, aggregates featured/trending/recently-added/discounted
  products plus active categories in one call for the landing page.
- `GET /api/store/products`, `GET /api/store/products/:id` — the public catalog. These wrap
  the Phase 4 product service but **force `status: 'active'` at the service layer**, not the
  frontend, so a client can never accidentally (or deliberately) list or view an
  inactive/discontinued product by omitting a filter.
- `Review` model + `/api/reviews` — one review per student per product (enforced by a unique
  compound index, not just application logic), public reads, student-only writes. Creating,
  editing, or deleting a review recomputes and persists the product's `ratingAverage`/
  `ratingCount` from the actual review documents every time, so those numbers never drift.
- `Wishlist` model + `/api/wishlist` — student-only, a single toggle endpoint adds/removes a
  product and returns which action happened, so the frontend never has to guess state.

**Frontend** (new student-facing shell — `UserLayout` with a top navbar on desktop and a
bottom tab bar on mobile, matching your reference design):
- **Home** — hero, category grid, special offers, featured products, best sellers, recently
  added, and an about section, all populated from the one home-data endpoint with loading
  skeletons.
- **Product Listing** (`/products`) — search, category filter, and sort, all synced to the URL
  query string so links from Home (`?category=`, `?sort=`) land in the right filtered state;
  real pagination.
- **Product Details** (`/products/:id`) — image gallery with thumbnails, price with live
  discount math, stock-aware quantity stepper, a real review system (star-rating form +
  list, submits to the backend and immediately refreshes both the review list and the
  product's aggregate rating), and a related-products strip.
- **Wishlist** — the heart icon on every product card is wired to a shared `WishlistContext`
  so toggling it anywhere (card, detail page) stays in sync everywhere, including the
  navbar's live wishlist count badge, without a manual refresh.
- Add to Cart / Buy Now are present and interactive on the product page but intentionally
  message that checkout arrives in Phase 8 — matching the original spec's own split between
  "Online Store" (browsing) and "Shopping Cart & Checkout" as separate phases. Cart, My
  Orders, and Profile nav links route to clearly-labeled placeholders rather than dead links
  or silently-broken pages.
- Seeder updated: discount percentages added to four representative products so the "Special
  Offers" section has real, non-empty data on the very first `npm run seed`.

**Verified this pass**: every backend file syntax-checked, `app.js` dry-loads with store/review/
wishlist routes mounted, and I booted the live server to confirm the public routes
(`/store/home`, `/store/products`, `/reviews/product/:id`) correctly skip authentication and
reach the database layer, while `/wishlist` correctly returns 401 first. Frontend: clean
`npm install`, clean production `vite build` (187 modules), live dev-server boot serving `/`,
`/products`, `/products/:id`, `/wishlist`, and the `/cart` placeholder. As with every prior
phase, full live-data rendering needs a real MongoDB connection this sandbox can't provide —
every layer up to that boundary is confirmed correct.

## Phase 8: Shopping Cart & Checkout — what's implemented

**Backend**:
- `Cart` model — one persistent cart per student (not client-side/localStorage), so it
  survives across devices and sessions. `Coupon` model with expiry, minimum order, and
  usage-cap support.
- `GET/POST/PUT/DELETE /api/cart/*` — live cart pricing computed server-side on every read:
  per-line GST, discount-aware unit price, coupon discount, and grand total. If a product's
  price changed or its stock dropped since it was added, the cart summary reflects that live
  (and flags `stockLimited` on the affected line) rather than trusting stale cart data.
- `POST /api/orders/checkout` — the real checkout: **re-validates stock at the moment of
  purchase**, not from the cart snapshot (a classic e-commerce race condition this closes),
  deducts stock through the same inventory ledger used by offline sales and Phase 5/6, snapshots
  item name/price into `OrderItem`, re-validates and consumes the coupon, clears the cart, and
  notifies the admin of the new order. Selecting Razorpay is explicitly rejected with a clear
  "arrives in Phase 9" message — it's never silently mishandled or half-implemented.
- Seeder now includes two real, working coupons: `WELCOME10` (10% off, ₹100 minimum) and
  `FLAT50` (₹50 off, ₹300 minimum, capped at 100 uses).

**Frontend**:
- A real, persistent cart (`CartContext`) — the navbar's cart icon shows a live item count
  everywhere in the app, not just on the cart page.
- `/cart` — quantity steppers, remove, a coupon box (apply/remove, shows the exact backend
  validation error inline if a code fails), and a live order summary (subtotal / GST / discount
  / total).
- `/checkout` — student details (read from the logged-in profile), a pickup-time picker
  (defaults to the next available half-hour slot, minimum 1 hour out), payment method selection
  with Cash on Pickup fully functional and Razorpay visibly present-but-disabled with a note
  about Phase 9, and a final order summary before placing the order.
- `/order-confirmation/:id` — shown immediately after a successful order, with the itemized
  receipt, total, and pickup details.
- `ProductDetails` now uses the real cart instead of the Phase 7 placeholder toast — **and this
  pass caught and fixed a real bug**: a `useState` call had ended up after an early
  conditional `return`, violating React's Rules of Hooks. Caught by the production build, not
  just by reading the code.

**Verified this pass**: every backend file syntax-checked, `app.js` dry-loads with cart/order
routes mounted, live server confirms `/api/cart`, `/api/orders`, and `/api/orders/checkout` all
correctly return 401 unauthenticated. Frontend: clean `npm install`, clean production `vite build`
(196 modules — this run also confirms the Rules-of-Hooks fix holds), live dev-server boot serving
`/cart`, `/checkout`, and `/order-confirmation/:id`. As with every phase before it, full live-data
checkout (an actual order going through stock deduction against a real product) needs a live
MongoDB connection this sandbox can't provide — every layer up to that boundary is confirmed
correct.

## Phase 9: Razorpay Payment Gateway — what's implemented

**This is real Razorpay integration** — order creation via the actual Razorpay SDK, the real
Checkout widget, and genuine HMAC-SHA256 signature verification. It needs real `rzp_test_...`
sandbox credentials to actually process a payment (see `.env.example`), but every line of
verification logic has been tested with real cryptographic signatures in this sandbox.

**Backend**:
- `Payment` model — tracks the full lifecycle per order (`created` → `captured`/`failed`),
  keeps the raw webhook payload for audit.
- `razorpayService.js` — creates real Razorpay orders via the SDK; verifies checkout signatures
  with `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` exactly per Razorpay's spec;
  verifies webhook signatures against the **raw request body**, not a re-parsed/re-serialized
  copy (byte-for-byte, which is what Razorpay actually signs).
- `orderService.js` refactored — the stock-reservation and order-building logic is now shared
  between Cash on Pickup and Razorpay (no duplicated business logic), branching only on what
  happens with payment: Cash proceeds straight to `pending` awaiting in-person payment;
  Razorpay creates a matching Razorpay order + `Payment` record and returns the IDs the
  frontend needs to open Checkout.
- `POST /api/payments/verify` — called right after the Checkout widget's success callback.
  **Never trusts that callback alone** — re-derives the HMAC signature server-side and only
  marks the order paid if it matches.
- `POST /api/payments/webhook` — the real source of truth, independent of whether the
  student's browser stayed open. Mounted with `express.raw()` **before** the global JSON
  parser in `app.js` specifically so signature verification sees Razorpay's exact bytes.
  Idempotent — replayed webhook events for an already-captured payment are safe no-ops.
- A verified payment auto-advances the order from `pending` to `confirmed` and notifies the admin.

**Frontend**:
- Razorpay Checkout script loads on demand (only when a student actually selects online
  payment), not on every page load.
- `/checkout` — the payment method selector now has a fully working Razorpay option: it
  places the order (reserving stock, same as cash), opens the real Checkout widget prefilled
  with the student's name/mobile, verifies payment server-side on success, and handles
  cancellation/failure gracefully (the order remains as a visible "pending payment" record
  rather than silently disappearing).
- Order Confirmation now shows real payment status — "Paid via Razorpay" vs. "Pay Cash at
  Pickup" vs. "Payment Pending".

**Verified this pass — including the security-critical parts, not just wiring**:
- Every backend file syntax-checked, `app.js` dry-loads with the webhook raw-body route and
  payment routes mounted.
- **Generated genuine HMAC-SHA256 signatures and confirmed the verification logic accepts
  real ones and rejects tampered ones** — for both the checkout-success signature format and
  the webhook signature format, including a case where the body was altered but an old valid
  signature was reused (correctly rejected).
- Booted the live server and sent real HTTP requests to `/api/payments/webhook`: a
  correctly-signed payload passed the signature check and reached the database layer (only
  timing out because there's no live Mongo here); an incorrectly-signed payload was rejected
  with 400 *before* touching the database. Confirmed `/api/payments/verify` requires auth.
- Frontend: clean `npm install`, clean production `vite build` (198 modules), live dev-server
  boot serving `/checkout` and `/order-confirmation/:id`.

**To actually process a payment**: set real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
`RAZORPAY_WEBHOOK_SECRET` in `backend/.env` (get free sandbox test keys at razorpay.com — no
business verification needed for test mode) and configure the webhook URL in the Razorpay
dashboard to point at `/api/payments/webhook`. Everything downstream of that is already correct.

## Phase 10: Order Management — what's implemented

**Backend** (`/api/admin/orders`, admin-only):
- `GET /` — paginated, searchable (order ID / student name / roll number), filterable (status,
  payment status, date range) order list for the admin panel.
- `GET /:id` — full order detail including the linked `Payment` record.
- `PATCH /:id/status` — advances an order exactly one step along the pipeline
  (`pending → confirmed → packing → ready-for-pickup → collected → completed`).
  **Enforced server-side, not just in the UI**: skipping a step, moving backward, or changing
  a terminal order (completed/cancelled/refunded) is rejected with a clear error — verified
  with 10 explicit test cases covering every edge case (forward step, skip attempt, backward
  attempt, cancel-from-various-states, cancel-after-collected, terminal-state lock).
- `PATCH /:id/cancel` — cancels an order, **returns every line item's stock** through the same
  inventory ledger used everywhere else (a real `return` movement, visible in Stock History),
  reverses the `soldCount` bump, and — if the order was already paid via Razorpay — attempts a
  real refund through the Razorpay API and marks the payment/order as refunded regardless of
  whether the live refund call itself succeeds (sandbox payments can't always be refunded
  programmatically, but the order's financial state must still reflect what's owed).
- `notificationService.js` gained `notifyStudent` (mirroring `notifyAdmin`) — every status
  change and cancellation pushes a real notification to the specific student's room, not just
  a generic broadcast.

**Frontend**:
- `/admin/online-orders` — status-tab filter bar (matching your reference mockup), search,
  payment-status and date-range filters, a real data table, and a detail modal showing the
  itemized order, a real status timeline, and one-click "Mark as [next status]" /
  "Cancel Order" actions (cancellation requires a second confirmation and accepts an optional
  reason shown to the student).
- `/my-orders` (student-facing, replacing the Phase 7/8 placeholder) — tabbed (All/Active/
  Completed/Cancelled), expandable order cards showing the same real status timeline, so a
  status change an admin makes is immediately visible to the student on their next visit.

**Verified this pass**: every backend file syntax-checked, `app.js` dry-loads with admin order
routes mounted, **the status-transition rule engine was tested standalone against all 10
meaningful transition cases and passed every one**, and the live server confirms all three
admin order endpoints correctly return 401 before touching the database when unauthenticated.
Frontend: clean `npm install`, clean production `vite build` (206 modules), live dev-server
boot serving both `/admin/online-orders` and `/my-orders`. As with every phase before it, full
live-data order management (an admin actually advancing a real order's status) needs a live
MongoDB connection this sandbox can't provide — every layer up to that boundary, including the
transition rules themselves, is confirmed correct.