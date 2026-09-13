# System Architecture

## 1. High-Level Architecture

```
                         ┌─────────────────────────┐
                         │        Browser          │
                         │  React SPA (Admin+User)  │
                         └────────────┬─────────────┘
                                      │ HTTPS (Axios)
                                      │ WSS (Socket.IO client)
                         ┌────────────▼─────────────┐
                         │      Express.js API       │
                         │  (REST + Socket.IO server) │
                         ├───────────────────────────┤
                         │ Middlewares:               │
                         │  helmet, cors, morgan,     │
                         │  rate-limit, jwt-auth,     │
                         │  role-guard, validators,   │
                         │  error handler             │
                         ├───────────────────────────┤
                         │ Controllers → Services →   │
                         │ Models (Mongoose)          │
                         └────┬──────────┬───────────┘
                              │          │
                 ┌────────────▼──┐   ┌───▼─────────────┐
                 │   MongoDB      │   │   Cloudinary     │
                 │ (Atlas/local)  │   │ (image storage)   │
                 └────────────────┘   └──────────────────┘
                              │
                 ┌────────────▼──────────────┐
                 │   Razorpay (test mode)     │
                 │   Webhook receiver          │
                 └────────────────────────────┘
```

## 2. Design Pattern: MVC + Service Layer

We use a **4-layer backend pattern** instead of plain MVC to keep controllers thin:

```
Route  →  Middleware (auth/validation)  →  Controller  →  Service  →  Model
```

- **Routes** — declare endpoints only, no logic.
- **Middlewares** — auth (JWT verify), role guard (admin/student), express-validator
  rule sets, multer upload handling, error boundary.
- **Controllers** — parse req/res, call services, shape HTTP response. No business logic.
- **Services** — actual business logic (e.g., `salesService.recordOfflineSale()`,
  `inventoryService.adjustStock()`). Reusable from controllers, cron jobs, or sockets.
- **Models** — Mongoose schemas + instance/static methods + hooks (e.g., auto-decrement
  stock hook, low-stock hook that emits a notification).
- **Utils** — pure helper functions (generateInvoiceId, formatCurrency, pagination helper).
- **Validations** — express-validator chains, separated from routes for reuse/testing.

## 3. Backend Folder Structure

```
backend/
├── server.js                 # entry point, starts HTTP + Socket.IO server
├── app.js                    # express app config (middleware pipeline)
├── package.json
├── .env.example
├── config/
│   ├── db.js                 # mongoose connection
│   ├── cloudinary.js         # cloudinary SDK config
│   ├── razorpay.js           # razorpay instance config
│   └── constants.js          # roles, order statuses, payment methods enums
├── models/
│   ├── Admin.js
│   ├── Student.js
│   ├── Product.js
│   ├── Category.js
│   ├── Inventory.js          # stock ledger / stock movement history
│   ├── Sale.js                # offline POS sales
│   ├── Order.js               # online orders
│   ├── OrderItem.js
│   ├── Payment.js
│   ├── Notification.js
│   ├── Report.js              # cached/generated report snapshots
│   ├── Settings.js
│   ├── Coupon.js
│   ├── Wishlist.js
│   ├── Cart.js
│   ├── Review.js
│   └── ActivityLog.js
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── productController.js
│   ├── categoryController.js
│   ├── inventoryController.js
│   ├── saleController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── studentController.js
│   ├── cartController.js
│   ├── wishlistController.js
│   ├── reviewController.js
│   ├── reportController.js
│   ├── notificationController.js
│   └── settingsController.js
├── services/
│   ├── authService.js
│   ├── productService.js
│   ├── inventoryService.js
│   ├── saleService.js
│   ├── orderService.js
│   ├── paymentService.js
│   ├── razorpayService.js
│   ├── reportService.js       # PDFKit + ExcelJS generation
│   ├── notificationService.js # socket emit wrapper
│   └── cloudinaryService.js
├── routes/
│   ├── index.js                # mounts all sub-routers under /api
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── productRoutes.js
│   ├── categoryRoutes.js
│   ├── inventoryRoutes.js
│   ├── saleRoutes.js
│   ├── orderRoutes.js
│   ├── paymentRoutes.js
│   ├── studentRoutes.js
│   ├── cartRoutes.js
│   ├── wishlistRoutes.js
│   ├── reviewRoutes.js
│   ├── reportRoutes.js
│   ├── notificationRoutes.js
│   └── settingsRoutes.js
├── middlewares/
│   ├── authMiddleware.js       # verifyToken
│   ├── roleMiddleware.js       # requireRole('admin'|'student')
│   ├── errorMiddleware.js      # centralized error handler
│   ├── rateLimitMiddleware.js
│   ├── uploadMiddleware.js     # multer config (memory storage → cloudinary)
│   └── sanitizeMiddleware.js   # mongo-sanitize wrapper
├── validations/
│   ├── authValidation.js
│   ├── productValidation.js
│   ├── orderValidation.js
│   └── saleValidation.js
├── utils/
│   ├── generateToken.js
│   ├── generateId.js           # SALE-xxxx, ORD-xxxx, SKU generation
│   ├── apiResponse.js           # standard {success,data,message} wrapper
│   ├── asyncHandler.js
│   └── pagination.js
├── sockets/
│   └── socketHandler.js         # io.on('connection') + room logic (admin room / student room)
├── scripts/
│   └── seed.js                  # sample realistic data seeder
└── uploads/                      # local tmp before cloudinary push (gitignored)
```

## 4. Frontend Folder Structure

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── routes/
│   │   ├── AdminRoutes.jsx
│   │   ├── UserRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx        # admin + student session
│   │   ├── ThemeContext.jsx       # dark/light
│   │   ├── CartContext.jsx
│   │   └── SocketContext.jsx
│   ├── services/                  # axios API modules, 1 file per resource
│   │   ├── api.js                  # axios instance + interceptors
│   │   ├── authApi.js
│   │   ├── productApi.js
│   │   ├── categoryApi.js
│   │   ├── saleApi.js
│   │   ├── orderApi.js
│   │   ├── inventoryApi.js
│   │   ├── paymentApi.js
│   │   ├── reportApi.js
│   │   └── notificationApi.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   ├── usePagination.js
│   │   └── useSocket.js
│   ├── components/
│   │   ├── common/                 # Button, Modal, Table, Skeleton, EmptyState, Badge, ConfirmDialog...
│   │   ├── admin/
│   │   │   ├── layout/              # Sidebar, Topbar, AdminLayout
│   │   │   └── dashboard/           # StatCard, SalesChart, RevenueChart, TopProducts...
│   │   └── user/
│   │       └── layout/              # Navbar, Footer, UserLayout
│   ├── pages/
│   │   ├── auth/                    # AdminLogin, StudentLogin, Register, ForgotPassword
│   │   ├── admin/                   # Dashboard, Products, Categories, Inventory, OfflineSales,
│   │   │                            # OnlineOrders, SalesHistory, Reports, Customers, Notifications, Settings
│   │   └── user/                    # Home, ProductListing, ProductDetails, Cart, Checkout,
│   │                                # PaymentGateway, MyOrders, Profile, Wishlist
│   ├── styles/
│   │   ├── variables.css            # design tokens (Phase 1 deliverable, see below)
│   │   ├── global.css
│   │   ├── admin.css
│   │   └── user.css
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── validators.js
│   └── assets/
```

## 5. Authentication & Authorization Strategy (implemented in Phase 2)

- Two separate identity collections: `Admin` and `Student` (different fields,
  different login pages, same JWT mechanism).
- JWT stored in **httpOnly secure cookie** (not localStorage) to reduce XSS risk;
  a lightweight `role` + `name` mirror kept in memory/Context for UI.
- `authMiddleware.verifyToken` decodes the cookie; `roleMiddleware.requireRole('admin')`
  or `requireRole('student')` guards routes.
- Passwords hashed with bcrypt (12 salt rounds).
- Forgot password → time-limited reset token (crypto random, hashed in DB, emailed link).

## 6. Real-Time Notification Strategy (implemented in Phase 12)

- Socket.IO server with two rooms: `admin-room` and `student-<id>`.
- Events: `order:new`, `payment:success`, `stock:low`, `stock:out`, `stock:restocked`,
  `order:statusChanged`, `product:new`.
- `notificationService.js` is the single place that both writes a `Notification` doc
  **and** emits the socket event — so REST and sockets never drift out of sync.

## 7. Payment Flow (implemented in Phase 9)

1. Student checks out → backend creates an `Order` (status `pending`) and a
   Razorpay order via `razorpayService.createOrder()`.
2. Frontend opens Razorpay Checkout with the returned `order_id`.
3. On success, Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
4. Backend verifies the signature (HMAC SHA256 with key secret) — **never trust the
   client-side success callback alone**.
5. Razorpay webhook (`payment.captured`) is also handled server-side as the source of
   truth, so payment status updates even if the user closes the tab.
6. Offline payments (Cash/UPI/GPay/PhonePe/Paytm) skip Razorpay entirely and are
   recorded directly by the admin via the double-confirmation Offline Sale flow.

## 8. Error Handling Convention

All API responses follow one shape:

```json
{ "success": true, "message": "Product created", "data": { ... } }
{ "success": false, "message": "Product not found", "errors": [] }
```

`asyncHandler.js` wraps every controller to funnel thrown errors into
`errorMiddleware.js`, which maps known error types (ValidationError, CastError,
duplicate key 11000, JWT errors) to correct HTTP status codes.

## 9. Security Checklist (Phase 1 baseline, enforced from Phase 2 onward)

- [x] Helmet (secure headers)
- [x] CORS locked to frontend origin
- [x] express-mongo-sanitize (NoSQL injection protection)
- [x] express-rate-limit on auth + payment routes
- [x] bcrypt password hashing
- [x] JWT in httpOnly secure cookie
- [x] express-validator on every mutating route
- [x] Helmet CSP tuned for Cloudinary + Razorpay script origins

## 10. Deployment Target (Phase 14)

- Backend → Render/Railway (Node service) + MongoDB Atlas.
- Frontend → Vercel/Netlify (static Vite build), API base URL via `VITE_API_URL` env.
- Images → Cloudinary (already remote, no server disk dependency).
