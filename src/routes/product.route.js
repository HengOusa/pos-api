const { validate_token } = require("../controllers/auth.controller");
const ProductController = require("../controllers/product.controller");
const { upload } = require("../util/helper");
module.exports = (app) => {
  app.get("/api/products", validate_token(), ProductController.getList);
  app.get("/api/products/:id", ProductController.getOne);
  app.post(
    "/api/products",
    validate_token(),
    ProductController.uploadMiddleware,
    ProductController.create,
  );
  app.patch("/api/products/:id/status", ProductController.toggleStatus);
};
