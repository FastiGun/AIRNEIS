const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { string } = require("yup");
require("dotenv").config();
const {
  Client,
  Panier,
  Produit,
  Categorie,
  Adresse,
  Paiement,
  Commande,
  Favoris,
} = require("./models");

const PORT = 3001;
const ASSETS_PATH = "/assets";

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
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

    app.get("/", async (req, res) => {
      try {
        const favoris = await Favoris.findOne({});
        const categorie1 = await Categorie.findById(favoris.categorie1);
        const categorie2 = await Categorie.findById(favoris.categorie2);
        const categorie3 = await Categorie.findById(favoris.categorie3);
        const article1 = await Produit.findById(favoris.article1);
        const article2 = await Produit.findById(favoris.article2);
        const article3 = await Produit.findById(favoris.article3);

        res.render("pages/index", {
          title: "Accueil",
          favoris: {
            categorie1,
            categorie2,
            categorie3,
            article1,
            article2,
            article3,
          },
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur est survenue lors de la récupération des favoris.");
      }
    });

    app.get("/search", function (req, res) {
      res.render("pages/search", { title: "Recherche" });
    });

    app.get("/cart", async (req, res) => {
      if (!req.session.userId) {
        // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
        return res.redirect("/connexion");
      }
      const clientId = req.session.userId;

      try {
        const paniers = await Panier.find({ id_client: clientId }).populate(
          "produits"
        );

        res.render("pages/cart", { paniers, title: "Panier" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de la récupération du panier.");
      }
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

    app.get("/api/produits", async (req, res) => {
      try {
        const produits = await Produit.find({});
        res.json(produits);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error:
            "Une erreur s'est produite lors de la récupération des produits.",
        });
      }
    });

    app.get("/api/client", async (req, res) => {
      const collection = Client.collection;
      const list = await collection.find({}).toArray();
      res.json(list);
    });

    app.get("/api/categories", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.json(categories);
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
    });

    app.get("/categories", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/categories", { title: "Catégories", categories });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
    });

    app.post("/inscription", async (req, res) => {
      const { id, nom, prenom, mail, mdp, telephone } = req.body;
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
        });
        await nouveauCompte.save();
        req.session.userId = nouveauCompte.id;
        res.redirect("/");
      } catch (erreur) {
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
