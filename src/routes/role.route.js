const RoleController = require("../controllers/role.controller");
module.exports = (app) => {
  app.get("/api/roles", RoleController.getList);
  app.post("/api/roles", RoleController.create);
  app.get("/api/roles/:id", RoleController.getOne);
  app.post("/api/roles/:id", RoleController.update);
  app.delete("/api/roles/:id", RoleController.remove);
};
