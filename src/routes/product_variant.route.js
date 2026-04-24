const { validate_token } = require("../controllers/auth.controller");
const VariantController = require("../controllers/product._variant.controller");
module.exports = (app) => {
  app.get("/api/product-variants", validate_token(), VariantController.getList);
  app.get("/api/product-variants/:id", VariantController.getOne);
  app.post("/api/product-variants", VariantController.create);
  app.put("/api/product-variants/:id", VariantController.update);
};
