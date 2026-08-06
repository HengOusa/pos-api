const { validate_token } = require("../controllers/auth.controller");
const employeeController = require("../controllers/employee.controller");

module.exports = (app) => {
  // Get all employees
  app.get("/api/employees", validate_token(), employeeController.getList);

  // Get one employee by ID
  app.get("/api/employees/:id", employeeController.getOne);

  // Create new employee (with image upload)
  app.post(
    "/api/employees",
    validate_token(),
    employeeController.uploadMiddleware,
    employeeController.create,
  );

  // Update employee (with image upload)
  app.put(
    "/api/employees/:id",
    validate_token(),
    employeeController.uploadMiddleware,
    employeeController.update,
  );

  // Delete employee
  app.delete("/api/employees/:id", validate_token(), employeeController.delete);

  // Toggle employee status
  app.patch("/api/employees/:id/status", validate_token(), employeeController.toggleStatus);
};
