const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.get("/", (req, res) => {
  const list = [
    {
      id: 1,
      name: "hebg",
    },
    {
      id: 2,
      name: "ousa",
    },
  ];
  res.json({
    list,
  });
});

app.listen(PORT, () => {
  console.log(`Server start running at http://localhost:${PORT}`);
});
