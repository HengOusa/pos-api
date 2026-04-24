const ConfigController = require("../controllers/config.controller");
module.exports = (app) => {
  app.get("/api/config", ConfigController.getConfig);
};
