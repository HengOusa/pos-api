const { db } = require("../util/helper");

/*
--------------------------------
1. GET ALL BRANDS
--------------------------------
*/
exports.getList = async (req, res) => {
  try {
    const [brands] = await db.query(
      "SELECT * FROM brands WHERE is_active = 1 ORDER BY brand_id DESC"
    );

    res.status(200).json({
      total: brands.length,
      brands: brands,
      status: "success",
      message: "Brands retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
2. GET BRAND BY ID
--------------------------------
*/
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [brand] = await db.query(
      "SELECT * FROM brands WHERE brand_id = ?",
      [id]
    );

    if (brand.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Brand not found",
      });
    }

    res.status(200).json({
      status: "success",
      brand: brand[0],
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
3. CREATE BRAND
--------------------------------
*/
exports.create = async (req, res) => {
  try {
    const { name, brand_logo } = req.body;

    const [result] = await db.query(
      `INSERT INTO brands (name, brand_logo, is_active, created_at)
       VALUES (?, ?, 1, NOW())`,
      [name, brand_logo]
    );

    res.status(201).json({
      status: "success",
      message: "Brand created successfully",
      brand_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
4. UPDATE BRAND
--------------------------------
*/
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand_logo } = req.body;

    const [result] = await db.query(
      `UPDATE brands
       SET name = ?, brand_logo = ?
       WHERE brand_id = ?`,
      [name, brand_logo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Brand not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Brand updated successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
5. DELETE BRAND (SOFT DELETE)
--------------------------------
*/
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE brands
       SET is_active = 0
       WHERE brand_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Brand not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};