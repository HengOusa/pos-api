const SupplierController = require("../controllers/supplier.contoller");
module.exports = (app) => {
  app.get("/api/suppliers", SupplierController.getList);
  app.get("/api/suppliers/:id", SupplierController.getOne);
  app.post("api/suppliers", SupplierController.create);
  app.put("/api/suppliers/:id", SupplierController.update);
  app.delete("/api/suppliers/:id", SupplierController.remove);
};
