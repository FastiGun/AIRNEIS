const express = require("express");
const app = express();

app.set("view engine", "pug");
app.use("/assets", express.static("public"));

app.get("/", function (req, res) {
  res.render("pages/index", { title: "Accueil" });
});
app.listen(8080, function () {
  console.log("Je tourne ici : http://localhost:8080");
});
