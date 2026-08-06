const { db, logError } = require("../util/helper");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Image directory for brands
const BRANDS_IMAGE_DIR = "public/brands";

// Multer storage configuration for brands
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(BRANDS_IMAGE_DIR)) {
      fs.mkdirSync(BRANDS_IMAGE_DIR, { recursive: true });
    }
    cb(null, BRANDS_IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "brand_logo-" + unique + path.extname(file.originalname));
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

// Upload middleware for brand logo
exports.uploadMiddleware = upload.single("brand_logo");

// Delete image helper
const deleteImage = (filename) => {
  if (!filename) return;
  // Handle both full path (brands/filename) and just filename
  const relativePath = filename.replace(/^brands\//, '');
  const fullPath = path.join(BRANDS_IMAGE_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Helper to get path with brands/ prefix for database storage
const getBrandLogoPath = (filename) => {
  if (!filename) return null;
  return `brands/${filename}`;
};

/*
--------------------------------
1. GET ALL BRANDS
--------------------------------
*/
exports.getList = async (req, res) => {
  try {
    const [brands] = await db.query("SELECT * FROM brands");

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

    const [brand] = await db.query("SELECT * FROM brands WHERE brand_id = ?", [
      id,
    ]);

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
    const { name } = req.body;
    // Get user ID from authenticated user (set by auth middleware)
    const created_by = req.current_id || req.profile?.user_id || null;

    // Get image filename from uploaded file and save with brands/ prefix
    const brand_logo = req.file ? getBrandLogoPath(req.file.filename) : null;

    const [result] = await db.query(
      `INSERT INTO brands (name, brand_logo, is_active, created_by, created_at)
       VALUES (?, ?, 1, ?, NOW())`,
      [name, brand_logo, created_by],
    );

    res.status(201).json({
      status: "success",
      message: "Brand created successfully",
      brand_id: result.insertId,
      brand_logo,
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file && req.file.filename) {
      deleteImage(req.file.filename);
    }
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
    const { name } = req.body;
    // Get user ID from authenticated user (set by auth middleware)
    const updated_by = req.current_id || req.profile?.user_id || null;

    // Get existing brand to check for old image
    const [existing] = await db.query(
      "SELECT brand_logo FROM brands WHERE brand_id = ?",
      [id],
    );

    if (existing.length === 0) {
      // Cleanup uploaded file if brand doesn't exist
      if (req.file && req.file.filename) {
        deleteImage(req.file.filename);
      }
      return res.status(404).json({
        status: "error",
        message: "Brand not found",
});
    }

    // Start with existing image
    let brand_logo = existing[0].brand_logo;

    // If new file uploaded, delete old and use new
    if (req.file) {
      // Delete old image from disk
      deleteImage(brand_logo);
      // Save new filename with brands/ prefix to DB
      brand_logo = getBrandLogoPath(req.file.filename);
    }

    // Build dynamic query to update only provided fields
    // This allows partial updates (e.g., only brand_logo without name)
    let updateFields = [];
    let params = [];

    // Only add name to update if it's provided and not empty
    if (name !== undefined && name !== null && name.trim() !== "") {
      updateFields.push("name = ?");
      params.push(name);
    }

    // Only add brand_logo to update if it's provided
    if (brand_logo !== undefined && brand_logo !== null) {
      updateFields.push("brand_logo = ?");
      params.push(brand_logo);
    }

    // Always update timestamp
    updateFields.push("updated_at = NOW()");

    // Don't update if no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    // Add brand_id to params for WHERE clause
    params.push(id);

    const [result] = await db.query(
      `UPDATE brands SET ${updateFields.join(", ")} WHERE brand_id = ?`,
      params,
    );

    res.status(200).json({
      status: "success",
      message: "Brand updated successfully",
      brand_logo,
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file && req.file.filename) {
      deleteImage(req.file.filename);
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};

/*
--------------------------------
5. DELETE BRAND (HARD DELETE)
--------------------------------
*/
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing brand to delete image
    const [existing] = await db.query(
      "SELECT brand_logo FROM brands WHERE brand_id = ?",
      [id],
    );

    const [result] = await db.query(
      `DELETE FROM brands
       WHERE brand_id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Brand not found",
      });
    }

    // Delete image file if exists
    if (existing.length > 0 && existing[0].brand_logo) {
      deleteImage(existing[0].brand_logo);
    }

    res.status(200).json({
      status: "success",
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
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
      "UPDATE brands SET is_active = ? WHERE brand_id = ?",
      [is_active, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Brands not found" });
    }

    res.json({
      status: "success",
      message: `Brands status updated to ${is_active === 1 ? "Active" : "Inactive"}`,
    });
  } catch (error) {
    logError("brands.toggleStatus", error, res);
    res.json({
      message: error.message,
    });
  }
};
