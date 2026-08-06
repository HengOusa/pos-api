const { validate_token } = require("../controllers/auth.controller");
const ProductController = require("../controllers/product.controller");
const { upload } = require("../util/helper");
module.exports = (app) => {
  // Get all products
  app.get("/api/products", validate_token(), ProductController.getList);
  
  // Get one product by ID
  app.get("/api/products/:id", validate_token(), ProductController.getOne);
  
  // Create new product
  app.post(
    "/api/products",
    validate_token(),
    ProductController.uploadMiddleware,
    ProductController.create,
  );
  
  // Update product
  app.put(
    "/api/product-edit/:id",
    validate_token(),
    ProductController.uploadMiddleware,
    ProductController.update,
  );
  
  // Delete product
  app.delete(
    "/api/products/:id",
    validate_token(),
    ProductController.remove,
  );
  
  // Toggle product status
  app.patch("/api/products/:id/status", validate_token(), ProductController.toggleStatus);
};
