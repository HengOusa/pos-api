const { validate_token } = require("../controllers/auth.controller");
const CustomerController = require("../controllers/customer.controller");

module.exports = (app) => {
  app.get("/api/customers", validate_token(), CustomerController.getList);
  app.post("/api/customers", validate_token(), CustomerController.create);
  app.get("/api/customers/:id", CustomerController.getOne);
  app.put("/api/customers/:id", CustomerController.update);
  app.delete("/api/customers", CustomerController.remove);
};
