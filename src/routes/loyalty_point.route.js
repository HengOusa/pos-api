const { validate_token } = require("../controllers/auth.controller");
const LoyaltyPointController = require("../controllers/loyalty_point.controller");
module.exports = (app) => {
  app.get(
    "/api/loyalty-points",
    validate_token(),
    LoyaltyPointController.getList,
  );
};
