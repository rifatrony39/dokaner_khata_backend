# Dokaner Khata - Backend API (Node.js, Express & MongoDB)

A production-ready REST API backend for the "দোকানের খাতা" (Dokaner Khata) mobile application.

## Requirements
- Node.js >= 18.x
- MongoDB (Local instance or MongoDB Atlas URI)

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` and set your MongoDB URI and JWT secrets:
   ```bash
   cp .env.example .env
   ```

3. **Run Server:**
   - Development mode (with file watcher):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## API Documentation

Base URL: `http://localhost:5050/api/v1`

### 1. Authentication (`/api/v1/auth`)
- `POST /signup` - Register a new shop owner & store
  - Body: `{ name, phone, password, storeName?, email? }`
- `POST /login` - Login with phone and password
  - Body: `{ phone, password }`
- `GET /me` - Get logged-in user profile & store info (Requires Bearer Token)
- `POST /forgot-password` - Request 6-digit OTP for password reset
  - Body: `{ phone }`
- `POST /verify-otp` - Verify 6-digit OTP
  - Body: `{ phone, otp }`
- `POST /reset-password` - Reset password
  - Body: `{ phone, otp, newPassword }`

### 2. Store (`/api/v1/store`)
- `GET /` - Get store details & settings (Language, SMS, Font)
- `PUT /` - Update store information & settings
  - Body: `{ storeName?, phone?, greeting?, address?, settings? }`

### 3. Customers (`/api/v1/customers`)
- `GET /` - List customers with filtering & search
  - Query Params: `?search=করিম&filter=highestDue|byName|recent`
- `POST /` - Add a new customer
  - Body: `{ name, phone, totalDue?, avatarColorHex?, address? }`
- `GET /:id` - Get customer profile with entry history
- `PUT /:id` - Update customer info
- `DELETE /:id` - Soft delete customer

### 4. Entries / Transactions (`/api/v1/entries`)
- `GET /` - List recent entries (Optional `?customerId=...`)
- `POST /` - Record new transaction (gave / got)
  - Body: `{ customerId, amount, type: "gave" | "got", note?, date? }`
  - *Automatically updates customer's `totalDue` and `isSettled` balance.*
- `DELETE /:id` - Delete entry and reverse the balance calculation

### 5. Reports (`/api/v1/reports`)
- `GET /dashboard` - Dashboard metrics (`totalDue`, `monthlyGiven`, `monthlyReceived`, `todaysEntriesCount`, `totalCustomersCount`)
- `GET /monthly` - Monthly breakdown & weekly trend ratios (matching Flutter UI)
- `GET /top-dues` - Top 5 debtors with highest outstanding balances

### 6. Offline Sync (`/api/v1/sync`)
- `POST /` - Batch upload offline-created customers and entries from SQLite
  - Body: `{ customers: [...], entries: [...] }`
