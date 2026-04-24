const { db } = require("../util/helper");

// =============================
// GET ALL SUPPLIERS
// =============================
exports.getList = async (req, res) => {
  try {
    const [suppliers] = await db.query(
      "SELECT * FROM suppliers ORDER BY supplier_id DESC",
    );

    res.status(200).json({
      total: suppliers.length,
      suppliers: suppliers,
      status: "success",
      message: "Suppliers retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// =============================
// GET SUPPLIER BY ID
// =============================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [supplier] = await db.query(
      "SELECT * FROM suppliers WHERE supplier_id = ?",
      [id],
    );

    if (supplier.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      supplier: supplier[0],
      status: "success",
      message: "Supplier retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// =============================
// CREATE SUPPLIER
// =============================
exports.create = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Supplier name is required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES (?, ?, ?, ?)`,
      [name, phone, email, address],
    );

    res.status(201).json({
      supplier_id: result.insertId,
      status: "success",
      message: "Supplier created successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// =============================
// UPDATE SUPPLIER
// =============================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const [result] = await db.query(
      `UPDATE suppliers
       SET name = ?, phone = ?, email = ?, address = ?
       WHERE supplier_id = ?`,
      [name, phone, email, address, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Supplier updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// =============================
// DELETE SUPPLIER
// =============================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM suppliers WHERE supplier_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
