const express = require("express");
const app = express();
const cors = require("cors");
const { db } = require("./src/util/helper");
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: false }));

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
require("./src/routes/category.route")(app);
require("./src/routes/auth.route")(app);
require("./src/routes/brand.route")(app);
app.listen(PORT, () => {
  console.log(`Server start running at http://localhost:${PORT}`);
});
