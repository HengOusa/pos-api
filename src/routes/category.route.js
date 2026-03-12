const CategoryController = require("../controllers/category.controller");
const AuthController = require("../controllers/auth.controller");
module.exports = (app) => {
  app.get(
    "/api/categories",
    AuthController.validate_token(),
    CategoryController.getList,
  );
  app.post(
    "/api/categories",
    AuthController.validate_token(),
    CategoryController.create,
  );
  app.put("/api/categories/:id", CategoryController.update);
  app.get("/api/categories/:id", CategoryController.show);
  app.delete("/api/categories/:id", CategoryController.destroy);
  // Toggle status route
  app.patch("/api/categories/:id/status", CategoryController.toggleStatus);
};
