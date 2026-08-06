const express = require("express");
const app = express();
const cors = require("cors");
const { db } = require("./src/util/helper");
const path = require("path");
const PORT = 3000;
require("dotenv").config();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: false }));
// Serve static files
app.use(
  "/products",
  express.static(process.env.IMAGE_PATH + "/products")
);

// Serve static files for brands
app.use(
  "/brands",
  express.static(process.env.IMAGE_PATH + "/brands")
);

// Serve static files for customers
app.use(
  "/customers",
  express.static(process.env.IMAGE_PATH + "/customers")
);
// Serve static files for employees
app.use(
  "/employees",
  express.static(process.env.IMAGE_PATH + "/employees")
);

// Serve static files for users
app.use("/users", express.static(process.env.IMAGE_PATH + "/users"));

app.get("/api/home", (req, res) => {
  const data = [
    {
      title: "Customer",
      obj: {
        total: 100,
        due: 100,
      },
    },
    {
      title: "Expense",
      obj: {
        total: 100,
        due: 100,
      },
    },
    {
      title: "Sale",
      obj: {
        total: 100,
        due: 100,
      },
    },
    {
      title: "Employee",
      obj: {
        total: 100,
        due: 100,
      },
    },
  ];
  res.json({
    list: data,
  });
});
console.log("IMAGE_PATH =", process.env.IMAGE_PATH);
require("./src/routes/category.route")(app);
require("./src/routes/auth.route")(app);
require("./src/routes/brand.route")(app);
require("./src/routes/role.route")(app);
require("./src/routes/customer.route")(app);
require("./src/routes/product.route")(app);
require("./src/routes/supplier.route")(app);
require("./src/routes/product_variant.route")(app);
require("./src/routes/loyalty_point.route")(app);
require("./src/routes/config.route")(app);
require("./src/routes/employee.route")(app);
require("./src/routes/user.route")(app);
app.listen(PORT, () => {
  console.log(`Server start running at http://localhost:${PORT}`);
});
