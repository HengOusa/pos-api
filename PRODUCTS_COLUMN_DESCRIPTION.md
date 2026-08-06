# Products Table Column Description

## Overview
This document describes all columns in the `products` table used in the POS API system. The table stores product information including pricing, stock management, and image references.

## Column Specifications

| # | Column Name | Data Type | Constraints | Description |
|---|-------------|-----------|--------------|--------------|
| 1 | `product_id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each product |
| 2 | `name` | VARCHAR(200) | NOT NULL | Product name/title |
| 3 | `barcode` | VARCHAR(100) | UNIQUE | Product barcode for scanning and identification |
| 4 | `category_id` | INT | FOREIGN KEY → `categories(category_id)` | Reference to product category |
| 5 | `brand_id` | INT | FOREIGN KEY → `brands(brand_id)` | Reference to product brand |
| 6 | `supplier_id` | INT | FOREIGN KEY → `suppliers(supplier_id)` | Reference to product supplier |
| 7 | `image` | VARCHAR(255) | DEFAULT NULL | Product image filename (e.g., "product-172-48.jpg") stored in `public/products/` directory |
| 8 | `cost_price` | DECIMAL(10,2) | - | Cost/supplier price per unit (10 digits total, 2 decimal places) |
| 9 | `selling_price` | DECIMAL(10,2) | - | Retail selling price per unit (10 digits total, 2 decimal places) |
| 10 | `stock` | INT | DEFAULT 0 | Current quantity in inventory |
| 11 | `reorder_level` | INT | DEFAULT 0 | Minimum stock threshold that triggers reorder alert |
| 12 | `is_active` | TINYINT(1) | DEFAULT 1, VALUES (0, 1) | Product status: 1 = active/available, 0 = inactive |
| 13 | `created_by` | VARCHAR(100) | DEFAULT NULL | User ID of creator (references users.user_id) |
| 14 | `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| 15 | `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Auto-updates to current timestamp when record is modified |

## Column Details

### 1. product_id
- **Type**: INT (Auto-increment)
- **Description**: Primary key, unique identifier for each product
- **Example Value**: 1, 2, 3...

### 2. name
- **Type**: VARCHAR(200)
- **Required**: Yes
- **Description**: Product name/title - displayed in UI and reports
- **Validation**: Required field (checked in controller)
- **Example Value**: "iPhone 15 Pro Max", "Samsung Galaxy S24"

### 3. barcode
- **Type**: VARCHAR(100)
- **Unique**: Yes
- **Description**: Product barcode for scanning via barcode reader
- **Example Value**: "1234567890123", "SKU-001"

### 4. category_id
- **Type**: INT
- **Foreign Key**: ✅ → `categories(category_id)`
- **Description**: Links product to a category (e.g., Electronics, Phones, Accessories)
- **Related Table**: categories

### 5. brand_id
- **Type**: INT
- **Foreign Key**: ✅ → `brands(brand_id)`
- **Description**: Links product to a brand (e.g., Apple, Samsung)
- **Related Table**: brands

### 6. supplier_id
- **Type**: INT
- **Foreign Key**: ✅ → `suppliers(supplier_id)`
- **Description**: Links product to a supplier/vendor
- **Related Table**: suppliers

### 7. image
- **Type**: VARCHAR(255)
- **Default**: NULL
- **Description**: Product image filename stored in `public/products/` directory
- **Storage Pattern**: `{filename}` - e.g., "product-172934829-4829184.jpg"
- **File Upload**: Handled by Multer middleware with field name "image"
- **Allowed Formats**: jpg, jpeg, png, gif, webp
- **Max Size**: 5MB
- **Example Value**: "product-172934829-4829184.jpg"

### 8. cost_price
- **Type**: DECIMAL(10,2)
- **Description**: Cost/supplier price per unit - used for profit calculation
- **Calculation**: profit = selling_price - cost_price
- **Example Value**: 499.99 (represents $499.99)

### 9. selling_price
- **Type**: DECIMAL(10,2)
- **Description**: Retail selling price per unit - displayed to customers
- **Example Value**: 599.99 (represents $599.99)

### 10. stock
- **Type**: INT
- **Default**: 0
- **Description**: Current quantity in inventory
- **Updates**: Modified via inventory_transactions, purchases, and sales
- **Example Value**: 50 (units in stock)

### 11. reorder_level
- **Type**: INT
- **Default**: 0
- **Description**: Minimum stock threshold that triggers reorder alert
- **Logic**: If stock <= reorder_level → show warning/alert
- **Example Value**: 10 (reorder when stock falls below 10)

### 12. is_active
- **Type**: TINYINT(1)
- **Default**: 1
- **Values**: 0 (inactive), 1 (active)
- **Description**: Product availability status - inactive products don't show in listings
- **Toggle**: Managed via `toggleStatus` endpoint (PATCH /api/products/:id/status)

### 13. created_by
- **Type**: VARCHAR(100)
- **Default**: NULL
- **Description**: User ID of the person who created the product
- **Source**: Extracted from JWT token (req.current_id)
- **Related Table**: users(user_id)

### 14. created_at
- **Type**: TIMESTAMP
- **Default**: CURRENT_TIMESTAMP
- **Description**: Record creation timestamp
- **Example Value**: "2024-01-15 10:30:00"

### 15. updated_at
- **Type**: TIMESTAMP
- **Default**: CURRENT_TIMESTAMP
- **Auto-Update**: ON UPDATE CURRENT_TIMESTAMP
- **Description**: Automatically updated when record is modified
- **Example Value**: "2024-01-16 14:45:00"

---

## API Endpoints & Column Usage

| Endpoint | Method | Columns Used |
|----------|--------|--------------|
| `/api/products` | GET | name, barcode, category_id, brand_id, supplier_id, cost_price, selling_price, stock, reorder_level, image, is_active |
| `/api/products/:id` | GET | All columns |
| `/api/products` | POST | name (required), barcode, category_id, brand_id, supplier_id, cost_price, selling_price, stock, reorder_level, image |
| `/api/product-edit/:id` | PUT | name, barcode, category_id, brand_id, supplier_id, cost_price, selling_price, stock, reorder_level, image |
| `/api/products/:id` | DELETE | All columns (selects image for deletion) |
| `/api/products/:id/status` | PATCH | is_active |

---

## Request/Response Examples

### POST /api_products (Create)
```json
// Request Body
{
  "name": "iPhone 15 Pro",
  "barcode": "1234567890123",
  "category_id": 1,
  "brand_id": 2,
  "supplier_id": 3,
  "cost_price": 799.99,
  "selling_price": 999.99,
  "stock": 50,
  "reorder_level": 10
}
// + image file (multipart/form-data, field: "image")

// Response
{
  "status": "success",
  "message": "Product created",
  "product_id": 1,
  "image": "product-172934829-4829184.jpg"
}
```

### PUT /api/product-edit/:id (Update)
```json
// Request Body
{
  "name": "iPhone 15 Pro Max",
  "selling_price": 1099.99,
  "stock": 45
}
// + image file (optional)

// Response
{
  "status": "success",
  "message": "Product updated",
  "image": "product-172934829-4829184.jpg"
}
```

### PATCH /api/products/:id/status (Toggle Status)
```json
// Request Body
{
  "is_active": 0
}

// Response
{
  "status": "success",
  "message": "Status updated"
}
```

---

## Image Handling

### Upload Configuration
- **Middleware**: Multer (diskStorage)
- **Field Name**: `image`
- **Destination**: `public/products/`
- **Filename Pattern**: `product-{timestamp}-{random}.{ext}`
- **Allowed Types**: jpg, jpeg, png, gif, webp
- **Max File Size**: 5MB (5 * 1024 * 1024 bytes)

### Delete Logic
- Function: `deleteImage(filename)`
- Builds full path internally: `path.join(IMAGE_DIR, filename)`
- Only filename stored in DB, full path built on demand
- Old image deleted when new image uploaded
- Old image deleted when product is deleted

---

## Related Tables

| Table Name | Relationship | Foreign Key |
|------------|--------------|-------------|
| categories | Many-to-One | category_id |
| brands | Many-to-One | brand_id |
| suppliers | Many-to-One | supplier_id |
| users | Many-to-One | created_by |
| product_images | One-to-One (?) | product_image_id (note: appears unused in controller) |
| inventory_transactions | One-to-Many | product_id |
| purchase_items | One-to-Many | product_id |
| sale_items | One-to-Many | product_id |
| product_variants | One-to-Many | product_id |

---

## Notes

1. **Inconsistency**: The SQL schema shows `product_image_id` as FK to product_images table, but the controller uses a simple `image` VARCHAR column storing the filename directly. This appears to be a legacy design that was simplified.

2. **created_by**: Despite being VARCHAR(100), it should reference users(user_id) as INT for proper foreign key relationship.

3. **stock management**: Stock is tracked separately in inventory_transactions table for audit trail.

4. **price precision**: Using DECIMAL(10,2) allows prices up to 99,999,999.99 with 2 decimal places precision.

---

*Document generated for POS API System - Product Controller*
