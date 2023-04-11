const express = require("express");
const app = express();

app.set("view engine", "pug");
app.use("/assets", express.static("public"));

app.get("/", function (req, res) {
  res.render("pages/index", { title: "Accueil" });
});

app.get("/search", function (req, res) {
  res.render("pages/search", { title: "Recherche" });
});

app.get("/cart", function (req, res) {
  res.render("pages/cart", { title: "Panier" });
});

app.get("/contact", function (req, res) {
  res.render("pages/contact", { title: "Contact" });
});

app.listen(8080, function () {
  console.log("Je tourne ici : http://localhost:8080");
});
