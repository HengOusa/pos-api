const { db } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [points] = await db.query(
      "SELECT * FROM customer_loyalty_transactions",
    );
    res.status(200).json({
      total: points.length,
      points: points,
      status: "success",
      message: "Loyalty points retrieved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
