const { db, logError } = require("../util/helper");

// Get all categories
exports.getList = async (req, res) => {
  try {
    
    const [categories] = await db.query("SELECT * FROM categories");
    res.status(200).json({
      status: "success",
      message: "Categories retrieved successfully.",
      i_know_u: req.current_id,
      total: categories.length,
      categories: categories,
    });
  } catch (error) {
    logError("category.getList", error, res);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get a single category by ID
exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await db.query(
      "SELECT * FROM categories WHERE category_id = ?",
      [id],
    );

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Category not found" });
    }

    res.json({
      status: "success",
      category: categories[0],
    });
  } catch (error) {
    logError("category.show", error, res);
  }
};

// Create a new category
exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      is_active,
      created_by = req.profile.name,
    } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ status: "error", message: "Name is required" });
    }

    const [result] = await db.query(
      "INSERT INTO categories (name, description, is_active, created_by ) VALUES (?, ?, ?, ?)",
      [name, description || null, is_active ?? 1, created_by],
    );

    res.json({
      status: "success",
      message: "Category created successfully",
      category_id: result.insertId,
    });
  } catch (error) {
    logError("category.create", error, res);
  }
};

// Update a category by ID
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const [result] = await db.query(
      "UPDATE categories SET name = ?, description = ?, is_active = ? WHERE category_id = ?",
      [name, description || null, is_active ?? 1, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Category not found" });
    }

    res.json({
      status: "success",
      message: "Category updated successfully",
    });
  } catch (error) {
    logError("category.update", error, res);
  }
};

// Delete a category by ID
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM categories WHERE category_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Category not found" });
    }

    res.json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    logError("category.destroy", error, res);
  }
};
// Toggle category status
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
      "UPDATE categories SET is_active = ? WHERE category_id = ?",
      [is_active, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Category not found" });
    }

    res.json({
      status: "success",
      message: `Category status updated to ${is_active === 1 ? "Active" : "Inactive"}`,
    });
  } catch (error) {
    logError("category.toggleStatus", error, res);
    res.json({
      message: error.message,
    });
  }
};
