const BrandController = require("../controllers/brand.controller");
const AuthController = require("../controllers/auth.controller");
module.exports = (app) => {
  // Get all brands
  app.get(
    "/api/brands",
    AuthController.validate_token(),
    BrandController.getList,
  );

  // Get one brand by ID
  app.get(
    "/api/brands/:id",
    AuthController.validate_token(),
    BrandController.getOne,
  );

  // Create new brand
  app.post(
    "/api/brands",
    AuthController.validate_token(),
    BrandController.uploadMiddleware,
    BrandController.create,
  );

// Update brand
  app.put(
    "/api/brands/:id",
    AuthController.validate_token(),
    BrandController.uploadMiddleware,
    BrandController.update,
  );
  
  // Also support POST for update (for backward compatibility)
  app.post(
    "/api/brands/:id",
    AuthController.validate_token(),
    BrandController.uploadMiddleware,
    BrandController.update,
  );

  // Delete brand
  app.delete(
    "/api/brands/:id",
    AuthController.validate_token(),
    BrandController.destroy,
  );

  // Toggle brand status
  app.patch(
    "/api/brands/:id/status",
    AuthController.validate_token(),
    BrandController.toggleStatus,
  );
};
