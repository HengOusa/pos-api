const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [roles] = await db.query("SELECT * FROM roles");

    res.status(200).json({
      total: roles.length,
      roles: roles,
      status: "success",
      message: "Roles retrieved successfully.",
    });
  } catch (error) {
    logError("role.getList", error, res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT role_id, name, description, created_at FROM roles WHERE role_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Role retrieved successfully",
      role: rows[0],
    });
  } catch (error) {
    logError("role.getOne", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Basic validation
    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    // Optional: check if role name already exists
    const [existing] = await db.query("SELECT 1 FROM roles WHERE name = ?", [
      name,
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Role name already exists",
      });
    }

    const [result] = await db.query(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      [name.trim(), description || null],
    );

    const [newRole] = await db.query(
      "SELECT role_id, name, description, created_at FROM roles WHERE role_id = ?",
      [result.insertId],
    );

    res.status(201).json({
      status: "success",
      message: "Role created successfully",
      role: newRole[0],
    });
  } catch (error) {
    logError("role.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    // Check if role exists
    const [existing] = await db.query("SELECT 1 FROM roles WHERE role_id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // Optional: check duplicate name (excluding current role)
    const [duplicate] = await db.query(
      "SELECT 1 FROM roles WHERE name = ? AND role_id != ?",
      [name.trim(), id],
    );
    if (duplicate.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Role name already in use",
      });
    }

    await db.query(
      "UPDATE roles SET name = ?, description = ?, updated_at = NOW() WHERE role_id = ?",
      [name.trim(), description || null, id],
    );

    const [updated] = await db.query(
      "SELECT role_id, name, description, created_at FROM roles WHERE role_id = ?",
      [id],
    );

    res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      role: updated[0],
    });
  } catch (error) {
    logError("role.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [roleCheck] = await db.query(
      "SELECT 1 FROM roles WHERE role_id = ?",
      [id],
    );
    if (roleCheck.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // Optional: prevent deletion if role is in use
    const [userCheck] = await db.query(
      "SELECT 1 FROM users WHERE role_id = ? LIMIT 1",
      [id],
    );
    if (userCheck.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete role that is assigned to users",
      });
    }

    await db.query("DELETE FROM roles WHERE role_id = ?", [id]);

    res.status(200).json({
      status: "success",
      message: "Role deleted successfully",
    });
  } catch (error) {
    logError("role.remove", error, res);
  }
};
