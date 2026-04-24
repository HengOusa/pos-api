const { db } = require("../util/helper");

exports.getConfig = async (req, res) => {
  try {
    const [categories] = await db.query("SELECT * FROM categories");
    const [roles] = await db.query("SELECT * FROM roles");
    const [suppliers] = await db.query("SELECT * FROM suppliers");
    const [brands] = await db.query("SELECT * FROM brands");
    const [users] = await db.query("SELECT * FROM users");
    const [customers] = await db.query("SELECT * FROM customers");
    const [products] = await db.query("SELECT * FROM products");

    res.status(200).json({
      categories: categories,
      roles: roles,
      suppliers: suppliers,
      brands: brands,
      users: users,
      customers: customers,
      products: products,
      status: "success",
      message: "Config retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
