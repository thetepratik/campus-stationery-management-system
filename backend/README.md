# Campus Stationery Backend API

Node.js + Express.js backend for the Campus Stationery Inventory & Sales Management System.

---

## Deployment Architecture

- **Frontend**: Vercel (`https://campus-stationery-management-system.vercel.app`)
- **Backend API**: Render Web Service (`https://<YOUR-RENDER-BACKEND>.onrender.com`)
- **Database**: MongoDB Atlas Cluster

---

## Render Deployment Settings

Configure the Web Service in the Render Dashboard with the following settings:

| Setting | Value |
| --- | --- |
| **Service Type** | Web Service |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Starter) |

> **Important**: Render dynamically assigns the `PORT` environment variable and requires the server to bind to host `0.0.0.0`. The server is configured to automatically use `process.env.PORT || 5000` and listen on `0.0.0.0`.

---

## Environment Variables for Render

In the Render dashboard under **Environment Variables**, add the following:

| Variable | Description / Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (or leave default set by Render) |
| `CLIENT_URL` | `https://campus-stationery-management-system.vercel.app` (do not add trailing slash) |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A secure random string for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_COOKIE_NAME` | `cs_token` |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Your Razorpay Webhook Secret |
| `SMTP_HOST` | `smtp.gmail.com` (or preferred SMTP server) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP application password |
| `RATE_LIMIT_WINDOW_MIN` | `15` |
| `RATE_LIMIT_MAX` | `100` |

---

## Frontend Integration

Once your Render backend service is deployed, configure your Vercel project's environment variables:

```env
VITE_API_URL=https://<YOUR-RENDER-BACKEND>.onrender.com/api
VITE_SOCKET_URL=https://<YOUR-RENDER-BACKEND>.onrender.com
```

Redeploy the frontend on Vercel to connect to the production backend.

---

## Health Check & Verification

You can verify the backend status at any time:

### Local Development:
- **API Health Check**: `http://localhost:5000/api/health`
- **Root URL**: `http://localhost:5000/`

### Production:
- **API Health Check**: `https://<YOUR-RENDER-BACKEND>.onrender.com/api/health`
- **Root URL**: `https://<YOUR-RENDER-BACKEND>.onrender.com/`

Expected Health Check Response:
```json
{
  "success": true,
  "message": "Campus Stationery API is running",
  "timestamp": "2026-09-13T09:30:00.000Z"
}
```

---

## Local Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Or production-mode local test:
   ```bash
   npm start
   ```
