const { db } = require("../util/helper");

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
  const {
    name,
    email,
    phone,
    address,
    role_id,
    hire_date,
    salary,
    status,
    created_by,
  } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO employees (name, email, phone, address, role_id, hire_date, salary, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        phone,
        address,
        role_id,
        hire_date,
        salary,
        status,
        created_by,
      ],
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
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// PUT: Update an existing employee
// ------------------------
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, role_id, hire_date, salary, status } =
    req.body;
  try {
    const [result] = await db.query(
      "UPDATE employees SET name = ?, email = ?, phone = ?, address = ?, role_id = ?, hire_date = ?, salary = ?, status = ? WHERE employee_id = ?",
      [name, email, phone, address, role_id, hire_date, salary, status, id],
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
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// DELETE: Delete an employee
// ------------------------
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
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