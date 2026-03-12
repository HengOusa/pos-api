const BrandController = require("../controllers/brand.controller");

module.exports = (app) => {
  app.get("/api/brands", BrandController.getList);
};
