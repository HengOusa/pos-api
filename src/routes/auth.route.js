const AuthController = require("../controllers/auth.controller");
module.exports = (app) => {
  app.post("/api/auth/register", AuthController.register);
  // app.get("/api/auth/profile/:id", AuthController.profile);
  app.post("/api/auth/login", AuthController.login);
  app.get("/api/auth/users", AuthController.getList);
  app.post(
    "/api/auth/profile",
    AuthController.validate_token(),
    AuthController.profile,
  );
};
