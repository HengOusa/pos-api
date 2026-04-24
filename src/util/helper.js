const connection = require("./connection");
const fs = require("fs/promises");
const { logError } = require("./logError");
const multer = require("multer");
require("dotenv").config();

exports.db = connection;

exports.logError = logError;

exports.toInt = (data) => {
  return parseInt(data);
};

exports.isArray = (data) => {
  return Array.isArray(data);
};

exports.isEmpty = (data) => {
  return data === null || data === undefined || data === "";
};

exports.isEmail = (data) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(data);
};

const path = require("path");

const ALLOWED_MIME_TYPES = ["image/png", "image/jpg", "image/jpeg"];
const MAX_FILE_SIZE = 1024 * 1024 * 3; // 3MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.IMAGE_PATH);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only PNG, JPG, and JPEG files are allowed"), false);
  }
  cb(null, true);
};

exports.upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

exports.removeFile = async (filename) => {
  try {
    await fs.unlink(process.env.IMAGE_PATH + filename);
    return "File delete successfull";
  } catch (error) {
    console.log("Error deleting file:", error);
  }
};
