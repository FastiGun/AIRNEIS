const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { string } = require("yup");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
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
const { ObjectId } = require("mongodb");
const e = require("express");

const secretKey = process.env.SECRET_KEY;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordEmail = process.env.PASSWORD_MAIL;
const PORT = 3001;
const ASSETS_PATH = "/assets";
const saltRounds = 10;
const idFavoris = "645ca83cd9b701ecef37f60c";

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
        const favoris = await Favoris.findById(idFavoris);
        const categorie1 = await Categorie.findById(favoris.categorie1);
        const categorie2 = await Categorie.findById(favoris.categorie2);
        const categorie3 = await Categorie.findById(favoris.categorie3);
        const article1 = await Produit.findById(favoris.produit1);
        const article2 = await Produit.findById(favoris.produit2);
        const article3 = await Produit.findById(favoris.produit3);
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

    app.post("/api/connexion", async (req, res) => {
      try {
        const { mail, motDePasse } = req.body;

        // Vérification si l'utilisateur existe
        const client = await Client.findOne({ mail });
        if (!client) {
          return res
            .status(404)
            .json({ message: "Aucun compte trouvé avec cette adresse e-mail" });
        }

        // Vérification du mot de passe
        const motDePasseCorrect = await bcrypt.compare(motDePasse, client.mdp);
        if (!motDePasseCorrect) {
          return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        // Génération du token d'authentification
        const token = generateAuthToken(client);

        res.status(200).json({ message: "Connexion réussie", token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la connexion" });
      }
    });

    app.get("/inscription", function (req, res) {
      res.render("pages/inscription", { title: "Inscription" });
    });

    app.post("/api/inscription", async (req, res) => {
      try {
        const { nom, prenom, mail, motDePasse, telephone } = req.body;

        // Vérification si l'utilisateur existe déjà
        const clientExistant = await Client.findOne({ mail });
        if (clientExistant) {
          return res.status(409).json({
            message: "Un compte avec cette adresse e-mail existe déjà",
          });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(motDePasse, saltRounds);

        // Création d'un nouveau client
        const nouveauCompte = new Client({
          id: uuidv4(),
          nom,
          prenom,
          mail,
          mdp: hashedPassword,
          telephone,
        });

        // Enregistrement du client dans la base de données
        await nouveauCompte.save();

        res.status(201).json({ message: "Inscription réussie" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la création du compte" });
      }
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

    app.get("/api/produits/:produitId", async (req, res) => {
      try {
        const produitId = req.params.produitId;
        const produit = await Produit.findById(produitId);
        if (!produit) {
          return res.status(404).send("Produit non trouvé");
        }
        res.json(produit);
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération du produit");
      }
    });

    app.get("/api/client", async (req, res) => {
      const collection = Client.collection;
      const list = await collection.find({}).toArray();
      res.json(list);
    });

    app.get("/api/client/:clientId", authenticate, async (req, res) => {
      try {
        const clientId = req.params.clientId;
        const client = await Client.findById(clientId);
        if (!client) {
          return res.status(404).send("Client non trouvé");
        }

        const adresses = await Adresse.find({ client: clientId });
        const paiements = await Paiement.find({ client: clientId });

        res.json({ client, adresses, paiements });
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .send("Erreur lors de la récupération des informations du client");
      }
    });

    app.get(
      "/api/client/:clientId/adresses",
      authenticate,
      async (req, res) => {
        try {
          const clientId = req.params.clientId;
          const client = await Client.findById(clientId);
          if (!client) {
            return res.status(404).send("Client non trouvé");
          }

          const adresses = await Adresse.find({ client: clientId });
          res.json(adresses);
        } catch (error) {
          console.log(error);
          res
            .status(500)
            .send("Erreur lors de la récupération des adresses du client");
        }
      }
    );

    app.get(
      "/api/client/:clientId/paiements",
      authenticate,
      async (req, res) => {
        try {
          const clientId = req.params.clientId;
          const client = await Client.findById(clientId);
          if (!client) {
            return res.status(404).send("Client non trouvé");
          }

          const paiements = await Paiement.find({ client: clientId });
          res.json(paiements);
        } catch (error) {
          console.log(error);
          res
            .status(500)
            .send(
              "Erreur lors de la récupération des moyens de paiement du client"
            );
        }
      }
    );

    app.get(
      "/api/clients/:clientId/paniers",
      authenticate,
      async (req, res) => {
        try {
          const clientId = req.params.clientId;

          // Vérifier si le client existe
          const client = await Client.findById(clientId);
          if (!client) {
            return res.status(404).json({ message: "Client non trouvé" });
          }

          // Récupérer les paniers du client
          const paniers = await Panier.find({ client: clientId });

          res.json(paniers);
        } catch (error) {
          console.log(error);
          res
            .status(500)
            .json({ message: "Erreur lors de la récupération des paniers" });
        }
      }
    );

    app.get("/api/categories", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.json(categories);
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
    });

    app.get("/api/categories/:categorie/produits", async (req, res) => {
      try {
        const categorieId = req.params.categorie;
        const categorie = await Categorie.findById(categorieId);
        if (!categorie) {
          return res.status(404).send("Catégorie non trouvée");
        }

        const produits = await Produit.find({ categorie: categorieId });
        res.json(produits);
      } catch (error) {
        console.log(error);
        res.status(500).send("Erreur lors de la récupération des produits");
      }
    });

    app.get("/category", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/category", { title: "Catégories", categories });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
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

    app.post("/inscription", async (req, res) => {
      const { id, nom, prenom, mail, mdp, telephone } = req.body;
      const existingClient = await Client.findOne({ mail: mail });
      if (existingClient) {
        return res.status(409).send("Cet e-mail est déjà utilisé");
      }
      if (nom === "" || prenom === "" || mail === "" || mdp === "") {
        return res.status(409).send("Informations manquantes");
      }
      if (!passwordRegex.test(mdp)) {
        return res
          .status(400)
          .send(
            "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 caractère spécial."
          );
      }
      try {
        const empreinteMotDePasse = await bcrypt.hash(mdp, saltRounds);
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
        console.log(erreur);
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

    app.post("/send-mail-contact", async (req, res) => {
      const { email, sujet, message } = req.body;

      // Configuration du transporteur d'e-mails (Gmail)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "benjamin760080@gmail.com",
          pass: passwordEmail,
        },
      });

      // Options pour l'e-mail
      const mailOptions = {
        from: email,
        to: "benjamin760080@gmail.com", // Adresse e-mail du support
        subject: sujet,
        text: `Message: ${message}`,
      };

      // Envoi de l'e-mail
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res
            .status(500)
            .send("Une erreur s'est produite lors de l'envoi de l'e-mail.");
        } else {
          res.redirect("/");
        }
      });
    });

    // Fonction pour générer le token d'authentification (par exemple, JWT)
    function generateAuthToken(client) {
      const secretKey = "votre_clé_secrète"; // Clé secrète pour signer le token
      const token = jwt.sign({ id: client._id }, secretKey, {
        expiresIn: "24h",
      }); // Exemple avec une expiration d'une journée
      return token;
    }

    // Middleware d'authentification
    function authenticate(req, res, next) {
      const token = req.headers.authorization; // Récupérer le token depuis les en-têtes de la requête

      if (!token) {
        return res
          .status(401)
          .json({ message: "Token d'authentification manquant" });
      }

      try {
        const secretKey = "votre_clé_secrète"; // Clé secrète utilisée lors de la génération du token
        const decodedToken = jwt.verify(token, secretKey); // Vérifier la validité du token

        req.userId = decodedToken.id; // Ajouter l'identifiant de l'utilisateur extrait du token à l'objet req

        next(); // Passer au prochain middleware ou à la route suivante
      } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Token d'authentification invalide" });
      }
    }

    app.listen(PORT, () => {
      console.log(`Je tourne ici : http://localhost:${PORT}`);
    });
  });
