// auth.controller.js

const { logError, db } = require("../util/helper");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../util/config");

// =======================
// Generate Access Token
// =======================
const getAccessToken = (paramData) => {
  const access_token = jwt.sign({ data: paramData }, config.config.SECRET_KEY, {
    expiresIn: "1h",
  });
  return access_token;
};

// =======================
// Register User
// =======================
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone_number,
      date_of_birth,
      image,
      is_active,
      role_id,
      created_by,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, email and password are required",
      });
    }

    // hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = `
      INSERT INTO users (
        name,
        email,
        password,
        phone_number,
        date_of_birth,
        image,
        is_active,
        role_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      email,
      hashedPassword,
      phone_number,
      date_of_birth,
      image,
      is_active,
      role_id,
      created_by,
    ]);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    logError("auth.register", error, res);
  }
};

// =======================
// Login User
// =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let sql = `
      SELECT
        u.*, 
        r.name as role_name
        FROM users u
        INNER JOIN roles r On u.role_id = r.role_id
        WHERE email = ?
    `;
    const [rows] = await db.query(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // remove password
    delete user.password;

    const payload = {
      profile: user,
      permission: ["view_all", "create", "edit", "delete"],
    };

    res.json({
      status: "success",
      message: "Login successful",
      access_token: getAccessToken(payload),
      profile: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role_name: user.role_name,
      },
      permission: payload.permission,
    });
  } catch (error) {
    logError("auth.login", error, res);
  }
};

// =======================
// User Profile
// =======================
exports.profile = async (req, res) => {
  try {
    res.json({
      status: "success",
      user_id: req.current_id,
      profile: req.profile,
      permission: req.permission,
    });
  } catch (error) {
    logError("auth.profile", error, res);
  }
};

// =======================
// Get Users List
// =======================
exports.getList = async (req, res) => {
  try {
    let sql = `SELECT 
                    u.*, 
                    r.name as role_name
                FROM users u
                INNER JOIN roles r 
                    ON u.role_id = r.role_id;`;

    const [users] = await db.query(sql);

    res.status(200).json({
      status: "success",
      total: users.length,
      users: users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    logError("auth.getList", error, res);
  }
};

// =======================
// Validate Token Middleware
// =======================
exports.validate_token = () => {
  return (req, res, next) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized - No token",
        });
      }

      const token = authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized - Invalid token",
        });
      }

      jwt.verify(token, config.config.SECRET_KEY, (error, decoded) => {
        if (error) {
          return res.status(401).json({
            status: "error",
            message: "Unauthorized",
            error: error.message,
          });
        }

        req.current_id = decoded.data.profile.user_id;
        req.profile = decoded.data.profile;
        req.permission = decoded.data.permission;

        next();
      });
    } catch (error) {
      logError("auth.validate_token", error, res);
    }
  };
};
