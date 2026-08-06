const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, logError, isEmpty, isEmail, toInt, upload } = require("../util/helper");

// ==============================
// MULTER CONFIG FOR PROFILE IMAGES
// ==============================
const IMAGE_DIR = "public/customers";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "customer-" + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) cb(null, true);
  else cb(new Error("Only image files allowed"));
};

const profileUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// IMPORTANT: field name must match frontend
exports.uploadMiddleware = profileUpload.single("profile");

// ==============================
// 🧹 DELETE IMAGE HELPER
// ==============================
const deleteImage = (filename) => {
  if (!filename) return;
  const relativePath = filename.replace(/^customers\//, "");
  const fullPath = path.join(IMAGE_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.log("Delete error:", err.message);
    });
  }
};

// ==============================
// HELPER TO GET PATH WITH CUSTOMERS/ PREFIX
// ==============================
const getCustomerImagePath = (filename) => {
  if (!filename) return null;
  return `customers/${filename}`;
};


/*
--------------------------------
1. GET CUSTOMER LIST
--------------------------------
*/
exports.getList = async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM customers");

    res.status(200).json({
      total: customers.length,
      customers: customers,
      status: "success",
      message: "Customers retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
2. GET CUSTOMER BY ID
--------------------------------
*/
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT 
        customer_id, name, email, phone, gender, 
        address, profile, loyalty_points, is_active, created_at
      FROM customers 
      WHERE customer_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Customer retrieved successfully",
      customer: rows[0],
    });
  } catch (error) {
    logError("customers.getOne", error, res);
  }
};

/*
--------------------------------
3. CREATE CUSTOMER
--------------------------------
*/
exports.create = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      address,
      password,
      loyalty_points = 0,
    } = req.body;

    // Validate required fields
    if (isEmpty(name)) {
      // Cleanup upload if validation fails
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    }

    if (isEmpty(email)) {
      // Cleanup upload if validation fails
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    // Validate email format
    if (!isEmail(email)) {
      // Cleanup upload if validation fails
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Validate password (required for customer registration)
    if (isEmpty(password)) {
      // Cleanup upload if validation fails
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: "error",
        message: "Password is required",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get profile image path - use multer file if uploaded, otherwise null
    const profile = req.file ? getCustomerImagePath(req.file.filename) : null;

    const [result] = await db.query(
      `INSERT INTO customers 
        (name, email, phone, gender, address, profile, password, loyalty_points, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        name,
        email,
        isEmpty(phone) ? null : phone,
        isEmpty(gender) ? null : gender,
        isEmpty(address) ? null : address,
        profile,
        hashedPassword,
        toInt(loyalty_points) || 0,
      ]
    );

    // Fetch the created customer
    const [newCustomer] = await db.query(
      `SELECT 
        customer_id, name, email, phone, gender, 
        address, profile, loyalty_points, is_active, created_at
      FROM customers 
      WHERE customer_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      customer: newCustomer[0],
    });
  } catch (error) {
    // Cleanup upload on error
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    logError("customers.create", error, res);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }
  }
};

/*
--------------------------------
4. UPDATE CUSTOMER
--------------------------------
*/
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      gender,
      address,
      password,
      loyalty_points,
      is_active
    } = req.body;

    // Check if customer exists and get current profile
    const [existing] = await db.query(
      "SELECT profile FROM customers WHERE customer_id = ?",
      [id]
    );

    if (existing.length === 0) {
      // Cleanup new upload if customer doesn't exist
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    // Start with existing profile from DB
    let profile = existing[0].profile;

    // If new file uploaded, delete old file and use new one
    if (req.file) {
      deleteImage(profile);
      profile = getCustomerImagePath(req.file.filename);
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      if (isEmpty(name)) {
        return res.status(400).json({
          status: "error",
          message: "Name cannot be empty",
        });
      }
      updates.push("name = ?");
      values.push(name);
    }

    if (email !== undefined) {
      if (isEmpty(email)) {
        return res.status(400).json({
          status: "error",
          message: "Email cannot be empty",
        });
      }
      if (!isEmail(email)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid email format",
        });
      }
      updates.push("email = ?");
      values.push(email);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(isEmpty(phone) ? null : phone);
    }

    if (gender !== undefined) {
      updates.push("gender = ?");
      values.push(isEmpty(gender) ? null : gender);
    }

    if (address !== undefined) {
      updates.push("address = ?");
      values.push(isEmpty(address) ? null : address);
    }

    // Always add profile to update if we processed it
    updates.push("profile = ?");
    values.push(profile);

    if (password !== undefined) {
      if (isEmpty(password)) {
        return res.status(400).json({
          status: "error",
          message: "Password cannot be empty",
        });
      }
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (loyalty_points !== undefined) {
      updates.push("loyalty_points = ?");
      values.push(toInt(loyalty_points) || 0);
    }

    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(toInt(is_active) || 0);
    }

    // Check if there are fields to update
    if (updates.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    // Add customer_id for WHERE clause
    values.push(id);

    // Execute update query
    const [result] = await db.query(
      `UPDATE customers SET ${updates.join(", ")} WHERE customer_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    // Fetch updated customer
    const [updatedCustomer] = await db.query(
      `SELECT 
        customer_id, name, email, phone, gender, 
        address, profile, loyalty_points, is_active, created_at
      FROM customers 
      WHERE customer_id = ?`,
      [id]
    );

    res.status(200).json({
      status: "success",
      message: "Customer updated successfully",
      customer: updatedCustomer[0],
    });
  } catch (error) {
    // Cleanup new upload on error
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    logError("customers.update", error, res);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }
  }
};

/*
--------------------------------
5. DELETE CUSTOMER (HARD DELETE)
--------------------------------
*/
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists and get profile for image deletion
    const [existing] = await db.query(
      "SELECT profile FROM customers WHERE customer_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    // Delete the profile image if exists
    deleteImage(existing[0].profile);

    await db.query("DELETE FROM customers WHERE customer_id = ?", [id]);

    res.status(200).json({
      status: "success",
      message: "Customer deleted successfully",
    });
  } catch (error) {
    logError("customers.remove", error, res);
  }
};

/*
--------------------------------
6. TOGGLE CUSTOMER STATUS
--------------------------------
*/
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [existing] = await db.query(
      "SELECT is_active FROM customers WHERE customer_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    // Toggle is_active status (1 -> 0, 0 -> 1)
    const currentStatus = existing[0].is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;

    // Update the status
    await db.query(
      "UPDATE customers SET is_active = ? WHERE customer_id = ?",
      [newStatus, id]
    );

    // Fetch updated customer
    const [updatedCustomer] = await db.query(
      `SELECT 
        customer_id, name, email, phone, gender, 
        address, profile, loyalty_points, is_active, created_at
      FROM customers 
      WHERE customer_id = ?`,
      [id]
    );

    res.status(200).json({
      status: "success",
      message: `Customer ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
      customer: updatedCustomer[0],
    });
  } catch (error) {
    logError("customers.toggleStatus", error, res);
  }
};
