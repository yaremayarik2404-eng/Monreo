const express = require("express");
const port = 3000;
const app = express();
const path = require("path");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Multi-page clean routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/rental", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "rental.html"));
});

app.get("/styling", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "styling.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.listen(port, () => {
  console.log("Сервер Monroe Closet Studio запущений на http://localhost:" + port);
});
