const connection = require("./connection");
const { logError } = require("./logError");

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
