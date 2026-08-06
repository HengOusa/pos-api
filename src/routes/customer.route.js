const { validate_token } = require("../controllers/auth.controller");
const CustomerController = require("../controllers/customer.controller");

module.exports = (app) => {
  // Get all customers
  app.get("/api/customers", validate_token(), CustomerController.getList);

  // Get one customer by ID
  app.get("/api/customers/:id", CustomerController.getOne);

  // Create new customer (with profile image upload)
  app.post(
    "/api/customers",
    validate_token(),
    CustomerController.uploadMiddleware,
    CustomerController.create,
  );

  // Update customer (with profile image upload)
  app.put(
    "/api/customers/:id",
    validate_token(),
    CustomerController.uploadMiddleware,
    CustomerController.update,
  );

  // Delete customer
  app.delete("/api/customers/:id", validate_token(), CustomerController.remove);

  // Toggle customer status
  app.patch("/api/customers/:id/status", validate_token(), CustomerController.toggleStatus);
};
