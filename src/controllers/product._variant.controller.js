const { db } = require("../util/helper");

// ===============================
// GET ALL VARIANTS
// ===============================
exports.getList = async (req, res) => {
  try {
    const [variants] = await db.query("SELECT * FROM product_variants");

    res.status(200).json({
      total: variants.length,
      variants: variants,
      status: "success",
      message: "Variants retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",  
      message: error.message,
    });
  }
};

// ===============================
// GET VARIANT BY ID
// ===============================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [variants] = await db.query(
      "SELECT * FROM product_variants WHERE variant_id = ?",
      [id],
    );

    if (variants.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Variant not found",
      });
    }

    res.status(200).json({
      variant: variants[0],
      status: "success",
      message: "Variant retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ===============================
// CREATE VARIANT
// ===============================
exports.create = async (req, res) => {
  try {
    const { product_id, name, additional_price, stock } = req.body;

    const [result] = await db.query(
      `INSERT INTO product_variants
      (product_id, name, additional_price, stock)
      VALUES (?, ?, ?, ?)`,
      [product_id, name, additional_price, stock],
    );

    res.status(201).json({
      status: "success",
      message: "Variant created successfully.",
      variant_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ===============================
// UPDATE VARIANT
// ===============================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, name, additional_price, stock } = req.body;

    const [result] = await db.query(
      `UPDATE product_variants
       SET product_id = ?, name = ?, additional_price = ?, stock = ?
       WHERE variant_id = ?`,
      [product_id, name, additional_price, stock, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Variant not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Variant updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ===============================
// DELETE VARIANT
// ===============================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM product_variants WHERE variant_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Variant not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Variant deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
