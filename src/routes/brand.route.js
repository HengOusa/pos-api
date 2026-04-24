const BrandController = require("../controllers/brand.controller");
const AuthController = require("../controllers/auth.controller");
module.exports = (app) => {
  app.get(
    "/api/brands",
    AuthController.validate_token(),
    BrandController.getList,
  );
  app.patch("/api/brands/:id/status", BrandController.toggleStatus);
};
