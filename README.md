# Khetiojar - Agricultural Tools Sales Tracker

Khetiojar is a premium, modern, responsive, and responsive web application designed for small agricultural tools shops to record and track their daily sales records. Built with a clean, professional, and visually stunning vanilla UI, it supports custom dark/light theme switching, live calculation tools, and sleek date-range history query logs.

## Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with Custom Properties and transitions), Vanilla JavaScript (ES6+ Modules, Fetch API, Async/Await).
- **Backend**: Node.js, Express.js (optimized for Vercel serverless functions).
- **Database**: MongoDB Atlas using Mongoose ODM schemas.
- **Deployment**: Zero-configuration ready for Vercel deployments.

---

## Folder Structure

```
khetiojar/
├── api/
│   ├── index.js                  # Express App serverless handler
│   ├── config/
│   │   └── db.js                 # Cached MongoDB Atlas connection pooling
│   ├── models/
│   │   ├── User.js               # Admin authentication schema
│   │   └── Sale.js               # Daily sales records schema
│   ├── routes/
│   │   ├── auth.js               # Login routes
│   │   └── sales.js              # Sales actions protected routes
│   ├── controllers/
│   │   ├── authController.js     # Auth request handler logic
│   │   └── salesController.js    # Statistics calculations & CRUD logic
│   └── middleware/
│       └── auth.js               # JWT security validation
├── public/
│   ├── css/
│   │   └── style.css             # Main styling, theme variables, glassmorphism, responsive sidebar
│   ├── js/
│   │   ├── auth.js               # Shared authentication check, logout, common headers
│   │   ├── toast.js              # Programmatic alert notifications helper
│   │   ├── dashboard.js          # Main dashboard statistics dashboard renderer
│   │   ├── add-sales.js          # Interactive dynamic forms and live total calculations
│   │   └── history.js            # Card grid query displays, delete modal controllers
│   ├── index.html                # Admin Login page
│   ├── dashboard.html            # Main metrics panel
│   ├── add-sales.html            # Daily transaction editor form
│   └── history.html              # List logs with search queries
├── vercel.json                   # Route rewrites mapping api/ index targets
├── package.json                  # Dependencies configuration
└── .env                          # Local Environment configuration keys
```

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org) (v16 or higher recommended)
- A running MongoDB instance (Local or Atlas)

### Setup & Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Configure environment keys:
   Open the `.env` file in the project root and fill in your details:
   - Modify `MONGODB_URI` with your connection string.
   - Adjust `ADMIN_USERNAME` and `ADMIN_PASSWORD` (default: `admin` / `admin123`).

3. Spin up the application locally:
   ```bash
   npm run dev
   ```

4. Launch browser preview:
   Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

---

## Vercel Production Deployment

The project is optimized for direct, one-click Vercel deployments:

1. **Deploy via CLI**:
   Ensure you have the Vercel CLI installed, then execute:
   ```bash
   vercel
   ```

2. **Environment Variables**:
   Configure these Environment Variables inside your Vercel Project Dashboard under **Settings -> Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `JWT_SECRET`: A secure key used for signing tokens.
   - `ADMIN_USERNAME`: Username for store admin.
   - `ADMIN_PASSWORD`: Password for store admin.

---

## Future Extensibility Guide

The project architecture has been designed from the ground up to support additions without major code modifications:

### 1. Customer & Product Management
- **Mongoose Models**: Create `api/models/Customer.js` and `api/models/Product.js`.
- **Relationship**: Reference product entries inside `Sale.js` schemas rather than string arrays:
  ```javascript
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  ```
- **API routes**: Add endpoints under `api/routes/customers.js` and implement controllers. Use `auth.js` middleware for security.

### 2. Bill Printing & PDF/Excel Export
- **PDF Generation**: Add `pdfmake` or `pdfkit` to the backend. Create a controller `api/controllers/exportController.js` that compiles database entries into PDFs and returns it as a download stream (`res.setHeader('Content-Type', 'application/pdf')`).
- **Excel Export**: Add `xlsx` or `exceljs` library on the backend to package reports.
- **Frontend Action**: Add an "Export PDF" button on cards in `history.html`. Inside `history.js`, redirect users to `/api/sales/export/pdf?id=...` which triggers the download.

### 3. Stock Management
- **Schema Expansion**: In your `Product` schema, include a `stockQuantity` (number).
- **Trigger Deductions**: Inside the `saveSale` controller (`api/controllers/salesController.js`), write transaction queries to decrement the inventory by the sold amounts when sales records are successfully saved.

### 4. Advanced Analytics
- **Aggregation Pipelines**: Use MongoDB aggregation queries inside the `salesController` to group daily records by item categories, project sales forecasts, or display charts using simple frontend libraries like `Chart.js` in `dashboard.js`.
