# Inventorie - Project Documentation

## 1. Project Overview
**Inventorie** is a Next.js 14 based e-commerce and inventory management application. It connects local vendors with customers through a dual-interface system:
1.  **Vendor Dashboard**: For managing inventory, viewing insights, and processing orders.
2.  **Customer App**: For discovering nearby stores, placing orders, and tracking them in real-time.

---

## 2. Technology Stack

### Frontend
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Maps**: Leaflet / React-Leaflet (OpenStreetMap)

### Backend & Services
*   **Database**: Firebase Firestore (NoSQL)
*   **Authentication**: Firebase Auth (Session Cookie based)
*   **Storage**: Cloudinary (Product Images)
*   **AI**: Google Gemini 2.0 Flash (Inventory Categorization & Insights)
*   **Server Runtime**: Node.js (via Next.js Server Actions)

---

## 3. Environment Configuration

The project requires the following environment variables in `.env.local`:

### Firebase Client SDK (Public)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Firebase Admin SDK (Private)
Required for Server Actions and Session Management.
```env
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Cloudinary (Image Storage)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Google Gemini AI
```env
GOOGLE_API_KEY=...
```

### Application Secrets
```env
ADMIN_EMAIL=... (Email of the Super Admin)
```

---

## 4. Database Schema (Firestore)

### Collection: `users`
Stores profile information for all user roles.

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Document ID (matches Auth UID) |
| `email` | string | User's email address |
| `role` | string | `customer`, `vendor`, or `admin` |
| `status` | string | `pending` or `approved` |
| `phone` | string | Contact number |
| `created_at` | number | Timestamp |
| `favorites` | array | List of Vendor UIDs (Customers only) |
| `location` | map | `{ lat: number, lng: number }` (Customers only) |
| `business_details` | map | `{ name, address, phone }` (Vendors only) |

### Collection: `inventory`
Stores products managed by vendors.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Normalized Item ID (e.g., `maggi_noodles`) |
| `vendor_id` | string | UID of the vendor who owns this item |
| `name` | string | Product Name |
| `category` | string | AI-predicted category (e.g., "Snacks") |
| `emoji` | string | AI-predicted emoji (e.g., "🍜") |
| `quantity` | number | Current stock level |
| `sellingPrice` | number | Price for customers |
| `average_price` | number | Cost price (for profit calc) |
| `image` | string | URL (Cloudinary) |
| `description` | string | Product description |
| `last_updated` | number | Timestamp |

### Collection: `orders`
Stores transaction history.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Auto-generated Document ID |
| `customerId` | string | UID of the buyer |
| `vendorId` | string | UID of the seller |
| `status` | string | `pending`, `accepted`, `preparing`, `ready`, `completed`, `cancelled` |
| `totalAmount` | number | Final order value |
| `deliveryMethod` | string | `pickup` or `delivery` |
| `deliveryAddress` | string | Address string (if delivery) |
| `items` | array | List of items in the order |
| `createdAt` | number | Timestamp |
| `updatedAt` | number | Timestamp |

**Note on Order Items**:
The `items` array in an order stores a snapshot of the item details (name, price, quantity) at the time of purchase. However, the `image` field is dynamically fetched from the `inventory` collection when viewing the order history to ensure the latest high-quality image is always shown.

---

## 5. Server Actions API

### Authentication (`@/actions/onboarding.ts`)
*   **`completeOnboarding(formData)`**: Creates the user profile in Firestore after initial signup. Handles role assignment and auto-approval logic.

### Customer (`@/actions/customer.ts`)
*   **`getNearbyVendors(userLocation)`**: Fetches approved vendors and sorts them by distance from the user.
*   **`getVendorInventoryForCustomer(vendorId)`**: Returns available items for a specific store.
*   **`toggleFavorite(vendorId)`**: Adds/Removes a vendor from the user's favorites list.
*   **`updateCustomerProfile(data)`**: Updates the user's location or other profile details.

### Order Management (`@/actions/order.ts`)
*   **`createOrder(orderData)`**: Creates a new order document.
*   **`getVendorOrders()`**: Fetches all orders received by the current vendor.
*   **`getCustomerOrders()`**: Fetches purchase history for the current user. **Includes robust logic to fallback to inventory images if order images are missing.**
*   **`updateOrderStatus(orderId, status)`**: Updates the status of an order (e.g., to "Ready").

### Inventory Manager (`@/actions/inventory_manager.ts`)
*   **`addInventoryItem(data)`**: Adds a new item. Uses **Gemini AI** to predict the category and emoji if not provided.
*   **`uploadProductImage(formData)`**: Uploads an image file to Cloudinary and returns the secure URL.
*   **`updateInventoryItem(itemId, data)`**: Updates details of an existing product.
*   **`deleteInventoryItem(itemId)`**: Removes a product from the inventory.

---

## 6. Key Workflows

### 1. User Onboarding
1.  User signs up via Clerk/Firebase Auth.
2.  Redirected to `/onboarding`.
3.  Selects role (`customer` or `vendor`).
4.  If `vendor`: Profile is created with status `pending`. Must be approved by Admin.
5.  If `customer`: Profile is created with status `approved`. Redirected to Dashboard.

### 2. Placing an Order
1.  Customer browses `StoreView`.
2.  Adds items to Cart.
3.  Proceeds to `CheckoutView`.
4.  Selects Delivery/Pickup.
5.  `createOrder` action is called.
6.  Customer is redirected to `OrderTracking` view.

### 3. Order Fulfillment
1.  Vendor sees new order in Dashboard (Real-time).
2.  Vendor clicks "Accept".
3.  Status updates to `accepted` -> Customer sees "Accepted".
4.  Vendor clicks "Mark Ready".
5.  Status updates to `ready` -> Customer sees "Ready for Pickup/Delivery".

### 4. Image Handling Strategy
To ensure a visually rich experience:
*   **Upload**: Vendors upload images to Cloudinary.
*   **Storage**: URL is saved in `inventory` collection.
*   **Retrieval**: When fetching order history, the system looks up the *current* image from the `inventory` collection using the Item ID (or Name fallback). This ensures that even old orders display valid, high-quality images.
