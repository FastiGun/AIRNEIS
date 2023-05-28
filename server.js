const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const session = require("express-session");
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

    app.use(
      session({
        secret: "votre_secret",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      })
    );

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
      if (req.session.userId) {
        return res.redirect("/");
      }
      res.render("pages/connexion", { title: "Connexion" });
    });

    app.post("/connexion", async (req, res) => {
      const { mail, mdp } = req.body;
      const existingClient = await Client.findOne({ mail: mail });
      if (!existingClient) {
        return res.status(401).send("Compte inexistant");
      }
      const motDePasseCorrect = await bcrypt.compare(mdp, existingClient.mdp);
      if (!motDePasseCorrect) {
        return res.status(401).send("Mot de passe incorrect");
      }
      req.session.userId = existingClient.id;
      res.redirect("/");
    });

    app.get("/inscription", function (req, res) {
      res.render("pages/inscription", { title: "Inscription" });
    });

    app.get("/category", function (req, res) {
      res.render("pages/category", { title: "Category List" });
    });

    app.get("/product_list", function (req, res) {
      res.render("pages/product_list", { title: "Product List" });
    });

    app.get("/product_detail", function (req, res) {
      res.render("pages/product_detail", { title: "Product Detail" });
    });

    app.get("/delivery_address", function (req, res) {
      res.render("pages/delivery_address", { title: "Delivery Address" });
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
        req.session.userId = nouveauCompte.id;
        res.redirect("/");
      } catch (erreur) {
        console.error(erreur);
        res.status(500).send("Erreur lors de la création du compte");
      }
    });

    app.get("/deconnexion", function (req, res) {
      req.session.destroy(function (err) {
        if (err) {
          console.error(err);
          return res.status(500).send("Erreur lors de la déconnexion");
        }
        res.redirect("/connexion");
      });
    });

    app.listen(PORT, () => {
      console.log(`Je tourne ici : http://localhost:${PORT}`);
    });
  });
