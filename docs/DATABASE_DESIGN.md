# Database Design (MongoDB / Mongoose)

Database: `campus_stationery`

## Entity Relationship Overview

```
Admin (1) ───────────────────────────────────────────┐
                                                       │ creates/manages
Category (1) ──< Product (M)                          │
Product (1) ──< Inventory (M ledger entries)           │
Product (1) ──< Sale/OrderItem (M)                     │
Student (1) ──< Order (M) ──< OrderItem (M) ──> Product │
Order (1) ──1─ Payment (1)                              │
Student (1) ──< Cart (1 active)                          │
Student (1) ──< Wishlist (1)                             │
Student (1) ──< Review (M) ──> Product                    │
Admin/Student ──< Notification (M, recipient polymorphic)   │
Admin ──< ActivityLog (M)                                     │
Coupon (standalone, referenced by code at checkout)
Settings (singleton document)
```

## Collections

### `admins`
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| password | String | bcrypt hash |
| avatar | String (URL) | Cloudinary |
| shopName | String | default "Campus Stationery" |
| role | String | enum: `admin`, default `admin` |
| resetPasswordToken | String | hashed, optional |
| resetPasswordExpires | Date | optional |
| lastLoginAt | Date | |
| timestamps | createdAt, updatedAt | |

### `students`
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique |
| password | String | bcrypt hash |
| rollNumber | String | unique, indexed |
| department | String | |
| mobile | String | |
| avatar | String (URL) | |
| addresses | [ { label, line1, hostel, room, isDefault } ] | pickup context, not shipping |
| isVerified | Boolean | default false, OTP flow |
| otp | String | hashed, short-lived |
| otpExpires | Date | |
| resetPasswordToken / resetPasswordExpires | | forgot password |
| timestamps | | |

### `categories`
| Field | Type | Notes |
|---|---|---|
| name | String | required, unique |
| slug | String | unique, indexed |
| description | String | |
| image | String (URL) | Cloudinary |
| isActive | Boolean | default true |
| timestamps | | |

### `products`
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| slug | String | unique |
| description | String | |
| category | ObjectId → Category | required, indexed |
| brand | String | |
| supplier | String | |
| images | [String] | Cloudinary URLs, multiple |
| sku | String | unique, indexed |
| barcode | String | unique, sparse |
| purchasePrice | Number | required |
| sellingPrice | Number | required |
| discountPercent | Number | default 0 |
| gstPercent | Number | default 0 |
| openingStock | Number | required |
| currentStock | Number | required, indexed (for low-stock queries) |
| minStock | Number | default 10 — low stock threshold |
| maxStock | Number | default 500 |
| soldCount | Number | default 0 — for top/least selling |
| ratingAverage | Number | default 0 |
| ratingCount | Number | default 0 |
| status | String | enum: `active`, `inactive` |
| isFeatured | Boolean | default false |
| timestamps | | |

**Virtual:** `availability` → `out-of-stock` / `low-stock` / `in-stock` derived from
`currentStock` vs `minStock` (0 vs ≤ minStock vs above).

### `inventory` (stock movement ledger — audit trail, not just a snapshot)
| Field | Type | Notes |
|---|---|---|
| product | ObjectId → Product | required |
| type | String | enum: `restock`, `sale-offline`, `sale-online`, `adjustment`, `return` |
| quantityChange | Number | signed: +50 restock, -2 sale |
| stockBefore | Number | |
| stockAfter | Number | |
| reference | ObjectId | polymorphic — Sale._id or Order._id when applicable |
| note | String | |
| performedBy | ObjectId → Admin | |
| timestamps | | createdAt used as the event time |

### `sales` (offline POS transactions)
| Field | Type | Notes |
|---|---|---|
| saleId | String | unique, human-readable e.g. `S0001` |
| items | [ { product, name, quantity, unitPrice, gstPercent, subtotal } ] | snapshot at sale time |
| totalAmount | Number | |
| customerName | String | optional |
| rollNumber | String | optional |
| department | String | optional |
| remarks | String | optional |
| paymentMethod | String | enum: `cash`,`upi`,`gpay`,`phonepe`,`paytm` |
| paymentConfirmed | Boolean | true only after double-confirmation |
| soldBy | ObjectId → Admin | |
| timestamps | | date+time of sale |

### `orders` (online store orders)
| Field | Type | Notes |
|---|---|---|
| orderId | String | unique, e.g. `ORD1001` |
| student | ObjectId → Student | required |
| items | ObjectId[] → OrderItem | |
| itemsCount | Number | denormalized for list views |
| totalAmount | Number | |
| gstAmount | Number | |
| discountAmount | Number | |
| couponCode | String | optional |
| paymentMethod | String | enum: `razorpay`,`cash-on-pickup` |
| paymentStatus | String | enum: `pending`,`paid`,`failed`,`refunded` |
| status | String | enum: `pending`,`confirmed`,`packing`,`ready-for-pickup`,`collected`,`completed`,`cancelled`,`refunded` |
| pickupTime | Date | student-chosen slot |
| statusHistory | [ { status, changedAt, changedBy } ] | audit trail for tracking UI |
| timestamps | | |

### `orderItems`
| Field | Type | Notes |
|---|---|---|
| order | ObjectId → Order | required |
| product | ObjectId → Product | required |
| name | String | snapshot |
| image | String | snapshot |
| quantity | Number | |
| unitPrice | Number | snapshot (price at time of order) |
| subtotal | Number | |

### `payments`
| Field | Type | Notes |
|---|---|---|
| order | ObjectId → Order | required, unique (1:1) |
| razorpayOrderId | String | |
| razorpayPaymentId | String | |
| razorpaySignature | String | |
| amount | Number | |
| method | String | enum incl. `upi`,`card`,`netbanking`,`wallet`,`cash` |
| status | String | enum: `created`,`captured`,`failed`,`refunded` |
| rawWebhookPayload | Mixed | stored for audit/debug |
| timestamps | | |

### `notifications`
| Field | Type | Notes |
|---|---|---|
| recipientType | String | enum: `admin`,`student` |
| recipient | ObjectId | polymorphic ref |
| type | String | enum: `order`,`payment`,`stock`,`system` |
| title | String | |
| message | String | |
| isRead | Boolean | default false |
| link | String | optional deep-link (e.g. `/admin/orders/ORD1001`) |
| timestamps | | |

### `reports` (generated report snapshots, for history/re-download)
| Field | Type | Notes |
|---|---|---|
| type | String | enum: `daily`,`weekly`,`monthly`,`yearly`,`custom` |
| category | String | enum: `sales`,`inventory`,`payment`,`customer`,`product` |
| rangeFrom / rangeTo | Date | |
| fileUrl | String | Cloudinary URL of generated PDF/Excel |
| format | String | enum: `pdf`,`excel` |
| generatedBy | ObjectId → Admin | |
| timestamps | | |

### `settings` (singleton)
| Field | Type | Notes |
|---|---|---|
| shopName | String | |
| shopLogo | String (URL) | |
| collegeLogo | String (URL) | |
| currency | String | default `INR` |
| defaultGstPercent | Number | |
| theme | String | `light`/`dark`, server-side default |
| lowStockThreshold | Number | global fallback |
| notificationPreferences | { email: Bool, push: Bool } | |
| timestamps | | |

### `coupons`
| Field | Type | Notes |
|---|---|---|
| code | String | unique, uppercase |
| discountType | String | enum: `flat`,`percent` |
| discountValue | Number | |
| minOrderAmount | Number | |
| maxUses | Number | |
| usedCount | Number | default 0 |
| expiresAt | Date | |
| isActive | Boolean | |

### `wishlist`
| Field | Type | Notes |
|---|---|---|
| student | ObjectId → Student | unique per student |
| products | [ObjectId → Product] | |

### `cart`
| Field | Type | Notes |
|---|---|---|
| student | ObjectId → Student | unique (one active cart) |
| items | [ { product, quantity } ] | |
| updatedAt | Date | |

### `reviews`
| Field | Type | Notes |
|---|---|---|
| product | ObjectId → Product | required, indexed |
| student | ObjectId → Student | required |
| rating | Number | 1–5 |
| comment | String | |
| timestamps | | |

### `activityLogs`
| Field | Type | Notes |
|---|---|---|
| actor | ObjectId | Admin or Student |
| actorType | String | `admin`/`student` |
| action | String | e.g. `PRODUCT_CREATED`, `SALE_RECORDED`, `ORDER_STATUS_CHANGED` |
| targetType | String | e.g. `Product`, `Order` |
| targetId | ObjectId | |
| meta | Mixed | free-form diff/details |
| timestamps | | |

## Indexing Strategy

- `products`: compound index `{ category: 1, status: 1 }`, single index `currentStock`
  (low-stock dashboard query), text index on `name` + `brand` for search.
- `orders`: index `{ student: 1, status: 1 }`, `{ createdAt: -1 }` for recent-orders lists.
- `sales`: index `{ createdAt: -1 }`.
- `notifications`: compound `{ recipientType: 1, recipient: 1, isRead: 1 }`.
- `students.rollNumber`, `students.email`, `admins.email`: unique indexes.

## Key Design Decisions

1. **Ledger over snapshot for inventory** — `inventory` collection is an append-only
   audit log; `product.currentStock` is a cached/denormalized number kept in sync via
   `inventoryService`. This gives us both fast reads (dashboard) and full history
   (stock history report) without recomputation.
2. **Order/OrderItem split** — mirrors a real invoicing system and keeps `Order`
   documents small for list views; item detail is fetched only on the order detail page.
3. **Snapshotting price/name in Sale/OrderItem** — protects historical invoices from
   changing if a product's price or name is edited later.
4. **Separate Admin/Student collections** rather than one polymorphic `users`
   collection — their fields diverge enough (rollNumber/department vs shopName) that
   a shared schema would need constant conditional logic; a discriminator was
   considered but rejected for simplicity of two very different auth flows.
