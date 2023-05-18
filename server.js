const express = require("express");
const routes = require("./routes");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();

const PORT = 3001;
const ASSETS_PATH = "/assets";

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const clientSchema = new mongoose.Schema({
      id: { type: String, unique: true },
      nom: String,
      prenom: String,
      mail: String,
      mdp: String,
      telephone: { type: String, default: null },
      panier: { type: String, unique: true, default: uuidv4 },
    });

    const Client = mongoose.model("Client", clientSchema, "client");

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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

    /*app.get("/api/produit", async (req, res) => {
      const collection = db.collection("produit");
      const list = await collection.find({}).toArray();
      res.json(list);
    });*/

    app.get("/api/client", async (req, res) => {
      const collection = Client.collection;
      const list = await collection.find({}).toArray();
      res.json(list);
    });

    app.post("/inscription", async (req, res) => {
      const { id, nom, prenom, mail, mdp, telephone, panier } = req.body;
      const existingClient = await Client.findOne({ mail: mail });
      if (existingClient) {
        return res.status(409).send("Cet e-mail est déjà utilisé");
      }
      if (nom === "" || prenom === "" || mail === "" || mdp === "") {
        return res.status(409).send("Informations manquantes");
      }
      try {
        const empreinteMotDePasse = await bcrypt.hash(mdp, 10);
        const nouveauCompte = new Client({
          id: uuidv4(),
          nom,
          prenom,
          mail,
          mdp: empreinteMotDePasse,
          telephone,
          panier,
        });
        console.log(nouveauCompte);
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
