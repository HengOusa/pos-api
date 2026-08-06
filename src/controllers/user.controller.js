const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, logError, isEmpty, isEmail, toInt } = require("../util/helper");

// ==============================
// MULTER CONFIG FOR PROFILE IMAGES
// ==============================
const IMAGE_DIR = "public/users";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(IMAGE_DIR)) {
            fs.mkdirSync(IMAGE_DIR, { recursive: true });
        }
        cb(null, IMAGE_DIR);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "user-" + unique + path.extname(file.originalname));
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
    const relativePath = filename.replace(/^users\//, "");
    const fullPath = path.join(IMAGE_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) console.log("Delete error:", err.message);
        });
    }
};

// ==============================
// HELPER TO GET PATH WITH USERS/ PREFIX
// ==============================
const getUserImagePath = (filename) => {
    if (!filename) return null;
    return `users/${filename}`;
};

// ------------------------
// GET: List all users
// ------------------------
exports.getList = async (req, res) => {
    try {
        const [users] = await db.query("SELECT * FROM users");
        res.status(200).json({
            total: users.length,
            users: users,
            status: "success",
            message: "Users retrieved successfully.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------------
// GET: Get a single user by ID
// ------------------------
exports.getOne = async (req, res) => {
    const { id } = req.params;
    try {
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({
            user: user[0],
            status: "success",
            message: "User retrieved successfully.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------------
// POST: Create a new user
// ------------------------
exports.create = async (req, res) => {
    const created_by = req.current_id || req.profile?.user_id || null;
    const { name, email, password, phone_number, role_id, is_active, date_of_birth } = req.body;
    try {
        // Validate required fields
        if (isEmpty(name)) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: "error",
                message: "Name is required",
            });
        }

        if (isEmpty(email)) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: "error",
                message: "Email is required",
            });
        }

        if (!isEmail(email)) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: "error",
                message: "Invalid email format",
            });
        }

        if (isEmpty(password)) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: "error",
                message: "Password is required",
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Get profile image path
        const image = req.file ? getUserImagePath(req.file.filename) : null;

        // Handle role_id
        const roleIdValue = role_id ? toInt(role_id) : null;

        // Handle phone: accept both "phone" and "phone_number" from frontend
        const phoneValue = phone_number || null;

        const [result] = await db.query(
            "INSERT INTO users (name, email, password, phone_number, role_id, is_active, image, date_of_birth, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                name,
                email,
                hashedPassword,
                isEmpty(phoneValue) ? null : phoneValue,
                roleIdValue,
                is_active !== undefined ? is_active : 1,
                image,
                date_of_birth || null,
                created_by,
            ]
        );
        const [newUser] = await db.query("SELECT * FROM users WHERE user_id = ?", [
            result.insertId,
        ]);
        res.status(201).json({
            user: newUser[0],
            status: "success",
            message: "User created successfully.",
        });
    } catch (error) {
        if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message });
    }
};

// ------------------------
// PUT: Update an existing user
// ------------------------
exports.update = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone_number, role_id, is_active, password, date_of_birth } = req.body;
    try {
        // Check if user exists and get current image
        const [existing] = await db.query("SELECT image FROM users WHERE user_id = ?", [
            id,
        ]);

        if (existing.length === 0) {
            if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        // Start with existing image from DB
        let image = existing[0].image;

        // If new file uploaded, delete old file and use new one
        if (req.file) {
            deleteImage(image);
            image = getUserImagePath(req.file.filename);
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

        // Handle phone_number (frontend uses phone_number, backend uses phone)
        if (phone_number !== undefined) {
            updates.push("phone_number = ?");
            values.push(isEmpty(phone_number) ? null : phone_number);
        }

        // Handle date_of_birth
        if (date_of_birth !== undefined) {
            updates.push("date_of_birth = ?");
            values.push(date_of_birth || null);
        }


        if (role_id !== undefined) {
            updates.push("role_id = ?");
            values.push(role_id);
        }

        if (is_active !== undefined) {
            updates.push("is_active = ?");
            values.push(is_active);
        }

        // Always add image to update
        updates.push("image = ?");
        values.push(image);

        if (password !== undefined) {
            if (isEmpty(password)) {
                return res.status(400).json({
                    status: "error",
                    message: "Password cannot be empty",
                });
            }
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

        // Add user_id for WHERE clause
        values.push(id);

        const [result] = await db.query(
            `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const [updatedUser] = await db.query("SELECT * FROM users WHERE user_id = ?", [id]);
        res.status(200).json({
            user: updatedUser[0],
            status: "success",
            message: "User updated successfully.",
        });
    } catch (error) {
        if (req.file) fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message });
    }
};

// ------------------------
// DELETE: Delete a user
// ------------------------
exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        const [existing] = await db.query("SELECT image FROM users WHERE user_id = ?", [
            id,
        ]);

        if (existing.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        // Delete the image if exists
        deleteImage(existing[0].image);

        const [result] = await db.query("DELETE FROM users WHERE user_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({
            status: "success",
            message: "User deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ------------------------
// PATCH: Toggle user status
// ------------------------
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
            "UPDATE users SET is_active = ? WHERE user_id = ?",
            [is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.json({
            status: "success",
            message: `User status updated to ${is_active === 1 ? "Active" : "Inactive"}`,
        });
    } catch (error) {
        logError("users.toggleStatus", error, res);
        res.json({
            message: error.message,
        });
    }
};
