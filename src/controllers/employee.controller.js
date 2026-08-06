const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, logError, isEmpty, isEmail, toInt } = require("../util/helper");

// ==============================
// MULTER CONFIG FOR PROFILE IMAGES
// ==============================
const IMAGE_DIR = "public/employees";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "employee-" + unique + path.extname(file.originalname));
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
exports.uploadMiddleware = profileUpload.single("image");

// ==============================
//  DELETE IMAGE HELPER
// ==============================
const deleteImage = (filename) => {
  if (!filename) return;
  const relativePath = filename.replace(/^employees\//, "");
  const fullPath = path.join(IMAGE_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.log("Delete error:", err.message);
    });
  }
};

// ==============================
// HELPER TO GET PATH WITH EMPLOYEES/ PREFIX
// ==============================
const getEmployeeImagePath = (filename) => {
  if (!filename) return null;
  return `employees/${filename}`;
};

// ------------------------
// GET: List all employees
// ------------------------
exports.getList = async (req, res) => {
  try {
    const [employees] = await db.query("SELECT * FROM employees");
    res.status(200).json({
      total: employees.length,
      employees: employees,
      status: "success",
      message: "Employees retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// GET: Get a single employee by ID
// ------------------------
exports.getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const [employee] = await db.query(
      "SELECT * FROM employees WHERE employee_id = ?",
      [id],
    );
    if (employee.length === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.status(200).json({
      employee: employee[0],
      status: "success",
      message: "Employee retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// POST: Create a new employee
// ------------------------
exports.create = async (req, res) => {
  // Get user ID from authenticated user (set by auth middleware)
  const created_by = req.current_id || req.profile?.user_id || null;
  const {
    name,
    email,
    password,
    phone,
    address,
    role_id,
    hire_date,
    salary,
    is_active,
  } = req.body;
  try {
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

    // Validate password (required for employee registration)
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
    const image = req.file ? getEmployeeImagePath(req.file.filename) : null;

    // Handle role_id - convert to number or null
    const roleIdValue = role_id ? toInt(role_id) : null;

    const [result] = await db.query(
      "INSERT INTO employees (name, email, password, phone, address, role_id, hire_date, salary, is_active, image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        hashedPassword,
        isEmpty(phone) ? null : phone,
        isEmpty(address) ? null : address,
        roleIdValue,
        hire_date || null,
        salary || null,
        is_active,
        image,
        created_by,
      ]
    );
    const [newEmployee] = await db.query(
      "SELECT * FROM employees WHERE employee_id = ?",
      [result.insertId],
    );
    res.status(201).json({
      employee: newEmployee[0],
      status: "success",
      message: "Employee created successfully.",
    });
  } catch (error) {
    // Cleanup upload on error
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// PUT: Update an existing employee
// ------------------------
exports.update = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    email,
    phone,
    address,
    role_id,
    hire_date,
    salary,
    is_active,
    password,
  } = req.body;
  try {
    // Check if employee exists and get current image
    const [existing] = await db.query(
      "SELECT image FROM employees WHERE employee_id = ?",
      [id]
    );

    if (existing.length === 0) {
      // Cleanup new upload if employee doesn't exist
      if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    // Start with existing image from DB
    let image = existing[0].image;

    // If new file uploaded, delete old file and use new one
    if (req.file) {
      deleteImage(image);
      image = getEmployeeImagePath(req.file.filename);
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

    if (address !== undefined) {
      updates.push("address = ?");
      values.push(isEmpty(address) ? null : address);
    }

    if (role_id !== undefined) {
      updates.push("role_id = ?");
      values.push(role_id);
    }

    if (hire_date !== undefined) {
      updates.push("hire_date = ?");
      values.push(hire_date);
    }

    if (salary !== undefined) {
      updates.push("salary = ?");
      values.push(salary);
    }

    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    // Always add image to update if we processed it
    updates.push("image = ?");
    values.push(image);

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

    // Check if there are fields to update
    if (updates.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    // Add employee_id for WHERE clause
    values.push(id);

    const [result] = await db.query(
      `UPDATE employees SET ${updates.join(", ")} WHERE employee_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    const [updatedEmployee] = await db.query(
      "SELECT * FROM employees WHERE employee_id = ?",
      [id],
    );
    res.status(200).json({
      employee: updatedEmployee[0],
      status: "success",
      message: "Employee updated successfully.",
    });
  } catch (error) {
    // Cleanup new upload on error
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// DELETE: Delete an employee
// ------------------------
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if employee exists and get image for deletion
    const [existing] = await db.query(
      "SELECT image FROM employees WHERE employee_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    // Delete the image if exists
    deleteImage(existing[0].image);

    const [result] = await db.query(
      "DELETE FROM employees WHERE employee_id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.status(200).json({
      status: "success",
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "number") {
      return res
        .status(400)
        .json({ status: "error", message: "is_active must be 0 or 1" });
    }

    const [result] = await db.query(
      "UPDATE employees SET is_active = ? WHERE employee_id = ?",
      [is_active, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Employees not found" });
    }

    res.json({
      status: "success",
      message: `Employees status updated to ${is_active === 1 ? "Active" : "Inactive"}`,
    });
  } catch (error) {
    logError("employees.toggleStatus", error, res);
    res.json({
      message: error.message,
    });
  }
};
