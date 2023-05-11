const express = require("express");
const { connexion } = require("./db");
const routes = require("./routes");

const PORT = 3001;

connexion.then(async (db) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  routes(app,db);

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

  app.get("/connexion", function (req, res) {
    res.render("pages/connexion", { title: "Connexion" });
  });

  app.get("/inscription", function (req, res) {
    res.render("pages/inscription", { title: "Inscription" });
  });

  app.get("/api/produit", async (req, res) => {
    const collection = db.collection("produit");
    const list = await collection.find({}).toArray();
    res.json(list);
  });

  app.listen(PORT, () => {
    console.log(`Je tourne ici : http://localhost:${PORT}`);
  });
});
