const express = require("express");
const { connexion } = require("./db");
const routes = require("./routes");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const PORT = 3001;
const ASSETS_PATH = "/assets";

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const clientSchema = new mongoose.Schema({
  id: Number,
  nom: String,
  prenom: String,
  mail: String,
  mdp: String,
  telephone: String,
  panier: Number,
});

const Client = mongoose.model("Client", clientSchema);

connexion.then(async (db) => {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  routes(app, db);

  app.set("view engine", "pug");
  app.set("views", __dirname + "/views");
  app.use(ASSETS_PATH, express.static("assets"));

  app.use((req, res, next) => {
    res.locals.assetsPath = ASSETS_PATH;
    next();
  });

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

  app.get("/api/client", async (req, res) => {
    const collection = db.collection("client");
    const list = await collection.find({}).toArray();
    res.json(list);
  });

  app.post("/inscription", async (req, res) => {
    const { id, nom, prenom, mail, mdp, telephone, panier } = req.body;
    try {
      const nouveauCompte = new Compte({
        id,
        nom,
        prenom,
        mail,
        mdp,
        telephone,
        panier,
      });
      await nouveauCompte.save();
      res.redirect("/");
    } catch (erreur) {
      console.error(erreur);
      res.status(500).send("Erreur lors de la création du compte");
    }
  });

  app.listen(PORT, () => {
    console.log(`Je tourne ici : http://localhost:${PORT}`);
  });
});
