const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT 
        customer_id, name, email, phone, gender, 
        address, loyalty_points, created_at 
      FROM customers 
      ORDER BY customer_id
    `);

    res.status(200).json({
      total: customers.length,
      customers: customers,
      status: "success",
      message: "Customers retrieved successfully.",
    });
  } catch (error) {
    logError("customers.getList", error, res);
    res.status(500).json({ message: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM customers WHERE customer_id = ?",
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
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      address,
      loyalty_points = 0,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Name and email are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO customers 
        (name, email, phone, gender, address, loyalty_points, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, email, phone || null, gender || null, address || null, loyalty_points]
    );

    const [newCustomer] = await db.query(
      "SELECT * FROM customers WHERE customer_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      customer: newCustomer[0],
    });
  } catch (error) {
    logError("customers.create", error, res);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      gender,
      address,
      loyalty_points,
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields provided to update",
      });
    }

    const [existing] = await db.query(
      "SELECT 1 FROM customers WHERE customer_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    // Build dynamic SET clause
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (email !== undefined) { fields.push("email = ?"); values.push(email); }
    if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }
    if (gender !== undefined) { fields.push("gender = ?"); values.push(gender); }
    if (address !== undefined) { fields.push("address = ?"); values.push(address); }
    if (loyalty_points !== undefined) { fields.push("loyalty_points = ?"); values.push(loyalty_points); }

    values.push(id); // for WHERE

    const sql = `UPDATE customers SET ${fields.join(", ")} WHERE customer_id = ?`;

    await db.query(sql, values);

    const [updated] = await db.query(
      "SELECT * FROM customers WHERE customer_id = ?",
      [id]
    );

    res.status(200).json({
      status: "success",
      message: "Customer updated successfully",
      customer: updated[0],
    });
  } catch (error) {
    logError("customers.update", error, res);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      "SELECT 1 FROM customers WHERE customer_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Customer not found",
      });
    }

    await db.query("DELETE FROM customers WHERE customer_id = ?", [id]);

    res.status(200).json({
      status: "success",
      message: "Customer deleted successfully",
    });
  } catch (error) {
    logError("customers.remove", error, res);
    res.status(500).json({ message: error.message });
  }
};