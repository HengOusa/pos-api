const employeeController = require("../controllers/employee.controller");

module.exports = (app) => {
  app.get("/api/employees", employeeController.getList);
  app.get("/api/employees/:id", employeeController.getOne);
  app.post("/api/employees", employeeController.create);
  app.put("/api/employees/:id", employeeController.update);
  app.delete("/api/employees/:id", employeeController.delete);
  app.patch("/api/employees/:id/status", employeeController.toggleStatus);
};
