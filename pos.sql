-- ============================================
-- COMPLETE POS SYSTEM DATABASE
-- ============================================

-- 1. ROLES & PERMISSIONS
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    group_name VARCHAR(150),
    route_key VARCHAR(150),
    is_menu TINYINT DEFAULT 0
);

CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- 2. USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth VARCHAR(150),
    `image` VARCHAR(255) DEFAULT NULL,
    is_active TINYINT DEFAULT 1,
    role_id INT DEFAULT NULL,
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 3. CUSTOMERS & LOYALTY
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    gender ENUM('Male','Female','Other'),
    address TEXT,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_loyalty_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    points INT,
    type ENUM('add','redeem'),
    reference VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

SELECT customer_id, SUM(
    CASE WHEN type='add' THEN points ELSE -points END
) AS current_points
FROM customer_loyalty_transactions
GROUP BY customer_id;

-- 4. SUPPLIERS
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE suppliers
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
-- 5. CATEGORIES, BRANDS, PRODUCTS
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE DEFAULT '-',
    description TEXT,
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand_logo VARCHAR(255) DEFAULT NULL, 
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    barcode VARCHAR(100) UNIQUE,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    supplier_id INT NOT NULL,
    product_image_id INT
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    stock INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

ALTER TABLE products
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER reorder_level;
-- ALTER TABLE products
-- ADD COLUMN product_image_id INT,
-- ADD CONSTRAINT fk_product_image_id
--     FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id)
--     ON DELETE SET NULL
--     ON UPDATE CASCADE;

CREATE TABLE product_images(
    product_image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image VARCHAR(255) NOT NULL,

    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE product_variants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    name VARCHAR(100),
    additional_price DECIMAL(10,2),
    stock INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 6. INVENTORY TRANSACTIONS
CREATE TABLE inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    type ENUM('purchase','sale','adjustment','return'),
    quantity INT,
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE stock_adjustments (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    quantity INT,
    reason TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 7. PURCHASES
CREATE TABLE purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    user_id INT,
    total_amount DECIMAL(10,2),
    purchase_date DATETIME,
    status ENUM('pending','completed','cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    approved_by INT,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TABLE purchase_items (
    -- purchase_item_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    product_id INT,
    quantity INT,
    cost_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 8. SALES
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE,
    customer_id INT,
    user_id INT,
    total_amount DECIMAL(10,2),
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    grand_total DECIMAL(10,2),
    payment_status ENUM('paid','pending','partial'),
    sale_date DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE sale_items (
    -- sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    product_id INT,
    variant_id INT,
    quantity INT,
    price DECIMAL(10,2),
    total DECIMAL(10,2),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- 9. PAYMENTS & REFUNDS
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    amount DECIMAL(10,2),
    payment_method ENUM('cash','card','bakong_qr'),
    payment_date DATETIME,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
);

CREATE TABLE refunds (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT,
    amount DECIMAL(10,2),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
);

-- 10. RETURNS
CREATE TABLE returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    total_refund DECIMAL(10,2),
    return_date DATETIME,
    user_id INT,
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE return_items (
    return_item_id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT,
    product_id INT,
    quantity INT,
    refund_amount DECIMAL(10,2),
    FOREIGN KEY (return_id) REFERENCES returns(return_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 11. PROMOTIONS & DISCOUNTS
CREATE TABLE promotions (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    type ENUM('percentage','fixed_amount','buy_x_get_y'),
    value DECIMAL(10,2),
    start_date DATETIME,
    end_date DATETIME,
    status TINYINT DEFAULT 1,
    created_by 
);

CREATE TABLE promotion_products (
    promotion_product_id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_id INT,
    product_id INT,
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 12. EMPLOYEES & PAYROLL
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    role_id INT NOT NULL,
    hire_date DATE,
    salary DECIMAL(10,2),
    status ENUM('active','inactive'),
    created_by INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE payroll (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    month YEAR,
    gross_salary DECIMAL(10,2),
    deductions DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- 13. EXPENSES & ACCOUNTING
CREATE TABLE expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150),
    amount DECIMAL(10,2),
    expense_date DATETIME,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE cash_registers (
    register_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    open_time DATETIME,
    close_time DATETIME,
    opening_balance DECIMAL(10,2),
    closing_balance DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE accounting_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('sale','purchase','expense','refund','adjustment'),
    reference_id INT,
    amount DECIMAL(10,2),
    transaction_date DATETIME
);

-- 14. ADDITIONAL SUPPORT TABLES (Branches, Shifts, Gift Cards, Notifications)
CREATE TABLE store_locations (
    store_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20)
);

CREATE TABLE shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE gift_cards (
    gift_card_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    amount DECIMAL(10,2),
    balance DECIMAL(10,2),
    status ENUM('active','redeemed','expired'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    status ENUM('unread','read') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    url VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    customer_id INT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE expense_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE taxes (
    tax_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    percentage DECIMAL(5,2)
);