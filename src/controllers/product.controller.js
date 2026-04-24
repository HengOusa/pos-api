const { db } = require("../util/helper");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==============================
// 📁 MULTER CONFIG
// ==============================
const IMAGE_DIR = "public/products";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) cb(null, true);
  else cb(new Error("Only image files allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

//  IMPORTANT: field name must match frontend
exports.uploadMiddleware = upload.single("image");

// ==============================
// 🧹 DELETE IMAGE HELPER
// receives only the filename, builds the full path internally
// ==============================
const deleteImage = (filename) => {
  if (!filename) return;
  const fullPath = path.join(IMAGE_DIR, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.log("Delete error:", err.message);
    });
  }
};

// ==============================
// GET ALL PRODUCTS
// ==============================
exports.getList = async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products");

    res.json({
      status: "success",
      total: products.length,
      products: products,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ==============================
// 📥 GET ONE PRODUCT
// ==============================
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM products WHERE product_id = ?",
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({ status: "success", data: rows[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ==============================
// ➕ CREATE PRODUCT
// DB stores: filename only  → e.g. "product-172-48.jpg"
// Disk stores: full path    → "public/products/product-172-48.jpg"
// ==============================
exports.create = async (req, res) => {
  try {
    const {
      name,
      barcode,
      category_id,
      brand_id,
      supplier_id,
      cost_price,
      selling_price,
      stock,
      reorder_level,
    } = req.body;

    // ✅ get from validated token — no longer needed in req.body
    const created_by = req.current_id;

    if (!name) {
      if (req.file)
        fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ status: "error", message: "Name is required" });
    }

    const image = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO products 
      (name, barcode, category_id, brand_id, supplier_id,
      cost_price, selling_price, stock, reorder_level,
      image, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        barcode,
        category_id,
        brand_id,
        supplier_id,
        cost_price,
        selling_price,
        stock,
        reorder_level,
        image,
        created_by,
      ],
    );

    res.status(201).json({
      status: "success",
      message: "Product created",
      product_id: result.insertId,
      image,
    });
  } catch (err) {
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ==============================
// ✏️ UPDATE PRODUCT
// DB stores: filename only  → e.g. "product-172-48.jpg"
// Disk stores: full path    → "public/products/product-172-48.jpg"
// ==============================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      barcode,
      category_id,
      brand_id,
      supplier_id,
      cost_price,
      selling_price,
      stock,
      reorder_level,
    } = req.body;

    const [existing] = await db.query(
      "SELECT image FROM products WHERE product_id = ?",
      [id],
    );

    if (!existing.length) {
      // cleanup new upload if product doesn't exist
      if (req.file)
        fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);

      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // start with the existing filename from DB
    let image = existing[0].image;

    if (req.file) {
      // ✅ delete old file from disk using filename → full path
      deleteImage(image);
      // ✅ save new filename only into DB
      image = req.file.filename;
    }

    await db.query(
      `UPDATE products SET
      name=?, barcode=?, category_id=?, brand_id=?,
      supplier_id=?, cost_price=?, selling_price=?,
      stock=?, reorder_level=?, image=?, updated_at=NOW()
      WHERE product_id=?`,
      [
        name,
        barcode,
        category_id,
        brand_id,
        supplier_id,
        cost_price,
        selling_price,
        stock,
        reorder_level,
        image,
        id,
      ],
    );

    res.json({
      status: "success",
      message: "Product updated",
      image, // returns filename only
    });
  } catch (err) {
    // cleanup new upload on error
    if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// ==============================
// ❌ DELETE PRODUCT
// ==============================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT image FROM products WHERE product_id = ?",
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    await db.query("DELETE FROM products WHERE product_id = ?", [id]);

    // ✅ pass filename only — deleteImage builds the full path
    deleteImage(rows[0].image);

    res.json({
      status: "success",
      message: "Product deleted",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// ==============================
// 🔄 TOGGLE STATUS
// ==============================
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (![0, 1].includes(is_active)) {
      return res.status(400).json({
        status: "error",
        message: "is_active must be 0 or 1",
      });
    }

    const [result] = await db.query(
      "UPDATE products SET is_active=? WHERE product_id=?",
      [is_active, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      message: "Status updated",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
