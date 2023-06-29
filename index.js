const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
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
  Message,
} = require("./models");
const { ObjectId, deserialize } = require("mongodb");
const e = require("express");
const cloudinary = require("cloudinary").v2;

// Configuration Cloudinary pour le stockage de photos
cloudinary.config({
  cloud_name: "dkhkhqbvl",
  api_key: "259432631373519",
  api_secret: process.env.SECRET_CLOUDINARY,
});

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "airneis.junia@gmail.com",
    pass: process.env.PASSWORD_MAIL,
  },
});

const secretKey = process.env.SECRET_KEY;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PORT = 3001;
const ASSETS_PATH = "/assets";
const saltRounds = 10;
const idFavoris = "645ca83cd9b701ecef37f60c";

function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "Europe/Paris",
  };
  return date.toLocaleString("en-GB", options);
}

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
      res.locals.req = req;
      next();
    });

    app.use(
      session({
        saveUninitialized: true,
        cookie: { maxAge: 86400000 },
        store: new MemoryStore({
          checkPeriod: 86400000,
        }),
        resave: false,
        secret: secretKey,
      })
    );

    const requireAdmin = (req, res, next) => {
      if (!req.session.isAdmin) {
        return res.redirect("/");
      }
      next();
    };

    // Middleware pour vérifier l'état de connexion de l'utilisateur
    app.use((req, res, next) => {
      res.locals.isLoggedIn = req.session.userId ? true : false;
      next();
    });

    function generateResetToken() {
      const token = require("crypto").randomBytes(20).toString("hex");
      return token;
    }

    async function sendResetEmail(email, idClient) {
      // Construire le contenu de l'e-mail
      const mailOptions = {
        from: "airneis.junia@gmail.com",
        to: email,
        subject: "AIRNEIS - Password reset",
        text:
          "Click the link to reset your password: https://airneis-junia.vercel.app/reset-password/" +
          idClient,
      };

      // Envoyer l'e-mail
      await transporter.sendMail(mailOptions);
    }

    // Fonction pour générer le token d'authentification (par exemple, JWT)
    function generateAuthToken(client) {
      // Clé secrète pour signer le token
      const token = jwt.sign({ id: client._id }, secretKey, {
        expiresIn: "24h",
      }); // Exemple avec une expiration d'une journée
      return token;
    }

    // Middleware d'authentification
    function authenticate(req, res, next) {
      const token = req.headers.authorization; // Récupérer le token depuis les en-têtes de la requête
      const tokenToVerify = token.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ message: "Token d'authentification manquant" });
      }

      try {
        // Clé secrète utilisée lors de la génération du token
        const decodedToken = jwt.verify(tokenToVerify, secretKey); // Vérifier la validité du token

        next(); // Passer au prochain middleware ou à la route suivante
      } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Token d'authentification invalide" });
      }
    }

    /// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ///
    /// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ///
    /// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ////// Client ///

    app.get("/", async (req, res) => {
      try {
        const favoris = await Favoris.findById(idFavoris);
        const categorie1 = await Categorie.findById(favoris.categorie1);
        const categorie2 = await Categorie.findById(favoris.categorie2);
        const categorie3 = await Categorie.findById(favoris.categorie3);
        const article1 = await Produit.findById(favoris.produit1);
        const article2 = await Produit.findById(favoris.produit2);
        const article3 = await Produit.findById(favoris.produit3);
        const photo1 = favoris.photo1;
        const photo2 = favoris.photo2;
        const photo3 = favoris.photo3;
        const photo4 = favoris.photo4;
        res.render("pages/index", {
          title: "Accueil",
          favoris: {
            categorie1,
            categorie2,
            categorie3,
            article1,
            article2,
            article3,
            photo1,
            photo2,
            photo3,
            photo4,
          },
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur est survenue lors de la récupération des favoris.");
      }
    });

    app.get("/cart", async (req, res) => {
      if (!req.session.userId) {
        // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
        return res.redirect("/connexion");
      }
      const clientId = req.session.userId;
      let error;
      if (req.session.error) {
        error = req.session.error;
      } else {
        error = "";
      }
      req.session.error = null;
      try {
        const paniers = await Panier.find({ client: clientId }).populate(
          "article"
        );
        let prixTotal = 0;
        paniers.forEach((panier) => {
          prixTotal += panier.article.prix * panier.quantite;
        });
        let prixTTC = prixTotal * 1.2;
        TVA = prixTTC - prixTotal;
        TVA = TVA.toFixed(2);
        prixTotal = prixTotal.toFixed(2);
        res.render("pages/cart", {
          paniers,
          prixTotal,
          TVA,
          title: "Panier",
          error,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de la récupération du panier.");
      }
    });

    app.get("/cart-confirmation", async (req, res) => {
      if (!req.session.userId) {
        // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
        return res.redirect("/connexion");
      }
      const clientId = req.session.userId;

      try {
        // Récupérer les informations du client
        const client = await Client.findById(clientId);

        if (!client) {
          return res.status(404).json({ message: "Client non trouvé" });
        }

        // Récupérer les paniers du client
        const paniers = await Panier.find({ client: clientId }).populate(
          "article"
        );

        // Calculer le prix total des articles dans le panier
        let prixTotal = 0;
        paniers.forEach((panier) => {
          const prixArticle = panier.article.prix;
          const quantite = panier.quantite;
          prixTotal += prixArticle * quantite;
        });

        // Calculer le prix de la TVA
        const tauxTVA = 0.2; // Taux de TVA de 20%
        let prixTVA = prixTotal * tauxTVA;
        prixTVA = prixTVA.toFixed(2);
        prixTotal = prixTotal.toFixed(2);

        // Récupérer les paiements du client
        const paiements = await Paiement.find({ client: clientId });

        // Récupérer les adresses du client
        const adresses = await Adresse.find({ client: clientId });

        // Rassembler toutes les informations dans un objet
        const cartInfo = {
          client,
          paniers,
          prixTotal,
          prixTVA,
          paiements,
          adresses,
        };

        // Renvoyer les informations du client en tant que réponse
        res.render("pages/cart_confirmation", {
          title: "Cart Confirmation",
          cartInfo: cartInfo,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message:
            "Une erreur s'est produite lors de la récupération des informations du client",
        });
      }
    });

    app.post("/cart-confirmation", async (req, res) => {
      try {
        if (!req.session.userId) {
          // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
          return res.redirect("/connexion");
        }

        const {
          nomAdresse,
          rue,
          complement,
          ville,
          codepostal,
          pays,
          region,
          regaddress,
          nomCard,
          fullname,
          cardnumber,
          expiration,
          cvv,
          regcard,
          prixTVA,
          prixTotal,
          nom,
          prenom,
          tel,
          nomAdresseFactu,
          rueFactu,
          complementFactu,
          villeFactu,
          regionFactu,
          codepostalFactu,
          paysFactu,
          regaddressFactu,
        } = req.body;

        const produitsCommande = [];
        const panier = await Panier.find({ client: req.session.userId })
          .populate("article")
          .exec();

        if (regaddressFactu) {
          const adresseLivraisonFact = new Adresse({
            client: req.session.userId,
            nom: nomAdresseFactu,
            rue: rueFactu,
            complement: complementFactu,
            ville: villeFactu,
            cp: codepostalFactu,
            pays: paysFactu,
            region: regionFactu,
          });

          const adresseLivraisonEnregistree = await adresseLivraisonFact.save();
        }

        if (regaddress) {
          const adresseLivraison = new Adresse({
            client: req.session.userId,
            nom: nomAdresse,
            rue,
            complement,
            ville,
            cp: codepostal,
            pays,
            region,
          });

          const adresseLivraisonEnregistree = await adresseLivraison.save();
        }

        if (regcard) {
          const paiement = new Paiement({
            client: req.session.userId,
            libelle_carte: nomCard,
            nom_carte: fullname,
            num_carte: bcrypt.hashSync(cardnumber, saltRounds),
            date_expiration: expiration,
            cvv: bcrypt.hashSync(cvv, saltRounds),
          });

          const paiementEnregistre = await paiement.save();
        }

        panier.forEach((panierItem) => {
          produitsCommande.push({
            produit: panierItem.article._id,
            quantite: panierItem.quantite,
          });
        });

        produitsCommande.forEach(async (produitCommande) => {
          const { produit, quantite } = produitCommande;
          const produitDB = await Produit.findById(produit);
          if (produitDB.stock >= quantite) {
            produitDB.stock -= quantite;
            await produitDB.save();
          } else {
            res.status(500).send(`${produitDB.nom} n'a pas assez de stock`);
          }
        });

        const nouvelleCommande = new Commande({
          nom,
          prenom,
          telephone: tel,
          date: formatDate(new Date()),
          prixHT: (prixTotal - prixTVA).toFixed(2),
          prixTTC: prixTotal,
          statut: "On hold",
          produits: produitsCommande,
          adresseFacturation: {
            rue: rueFactu,
            ville: villeFactu,
            cp: codepostalFactu,
            pays: paysFactu,
            region: regionFactu,
            complement: complementFactu,
          },
          adresseLivraison: {
            rue,
            ville,
            cp: codepostal,
            pays,
            region,
            complement,
          },
          client: req.session.userId,
        });

        const commandeEnregistree = await nouvelleCommande.save();

        await Panier.deleteMany({ client: req.session.userId });

        res.redirect("/confirmation-paiement");
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur est survenue lors du traitement de la commande.");
      }
    });

    app.get("/historique_commande", async (req, res) => {
      try {
        if (!req.session.userId) {
          // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
          return res.redirect("/connexion");
        }

        const commandes = await Commande.find({ client: req.session.userId })
          .populate("produits.produit")
          .exec();
        commandes.reverse();

        res.render("pages/historique_commande", {
          title: "Orders Record",
          commandes: commandes,
        });
      } catch (error) {}
    });

    app.get("/commande-detail/:commandeId", async (req, res) => {
      try {
        const commandeId = req.params.commandeId;
        if (!req.session.userId) {
          // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
          return res.redirect("/connexion");
        }

        const commande = await Commande.findById(commandeId)
          .populate("produits.produit")
          .exec();

        res.render("pages/commande_details", {
          title: "Detail Order",
          commande: commande,
        });
      } catch (error) {}
    });

    app.get("/add-produit-panier/:articleId", async (req, res) => {
      if (!req.session.userId) {
        // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
        return res.redirect("/connexion");
      }

      const articleId = req.params.articleId;
      const clientId = req.session.userId;
      const article = await Produit.findById(articleId);

      try {
        // Vérifier si le client et l'article existent
        if (!clientId || !articleId || article.stock <= 0) {
          return res
            .status(404)
            .send("Client ou article introuvable ou produit hors stock");
        }

        // Vérifier si le panier existe déjà pour cet article et ce client
        let panier = await Panier.findOne({
          client: clientId,
          article: articleId,
        });

        if (panier) {
          // Le panier existe déjà, incrémenter la quantité
          if (panier.quantite + 1 > article.stock) {
            req.session.error = "Insufisant stock";
            return res.redirect("/cart");
          }
          panier.quantite += 1;
        } else {
          // Le panier n'existe pas, créer un nouveau panier
          panier = new Panier({
            client: clientId,
            article: articleId,
            quantite: 1,
          });
        }

        // Enregistrer le panier mis à jour
        await panier.save();

        res.redirect("/cart");
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de l'ajout au panier.");
      }
    });

    app.get("/remove-produit-panier/:articleId", async (req, res) => {
      const articleId = req.params.articleId;
      const client = req.session.userId;

      try {
        // Vérifier si le client et l'article existent
        if (!client || !articleId) {
          return res.status(404).send("Client ou article introuvable");
        }

        // Supprimer le panier correspondant à l'article et au client
        await Panier.findOneAndDelete({ client: client, article: articleId });

        return res.redirect("/cart");
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de la suppression du panier");
      }
    });

    app.get("/getAdresse/:idAdresse", async (req, res) => {
      const idAdresse = req.params.idAdresse;

      try {
        const adresse = await Adresse.findById(idAdresse);
        res.json(adresse);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la recuperation de l'adresse" });
      }
    });

    app.get("/getPaiement/:idPaiement", async (req, res) => {
      const idPaiement = req.params.idPaiement;

      try {
        const paiement = await Paiement.findById(idPaiement);
        res.json(paiement);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de la recuperation du moyen de paiement",
        });
      }
    });

    app.get("/ajuste-quantite-panier/:panierId/:quantite", async (req, res) => {
      const { panierId, quantite } = req.params;

      try {
        // Convertir la quantité en nombre entier
        const nouvelleQuantite = parseInt(quantite);

        // Vérifier si la conversion a réussi
        if (isNaN(nouvelleQuantite)) {
          return res.status(400).json({ message: "Quantité invalide" });
        }

        // Trouver le panier dans la base de données en fonction de son ID
        const panier = await Panier.findById(panierId);
        const article = await Produit.findById(panier.article);

        if (!article) {
          return res.status(404).json({ message: "Produit introuvable" });
        }

        if (nouvelleQuantite > article.stock) {
          req.session.error = "Insufisant stock";
          return res.redirect("/cart");
        }

        if (!panier) {
          return res.status(404).json({ message: "Panier non trouvé" });
        }

        // Mettre à jour la quantité du panier
        panier.quantite = nouvelleQuantite;
        await panier.save();

        return res.redirect("/cart");
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          message:
            "Une erreur s'est produite lors de l'ajustement de la quantité du panier",
        });
      }
    });

    app.get("/espace-utilisateur", async (req, res) => {
      try {
        clientId = req.session.userId;

        if (clientId != null) {
          const client = await Client.findById(clientId);
          const adresses = await Adresse.find({ client: clientId });
          const cards = await Paiement.find({ client: clientId });

          res.render("pages/espace_utilisateur", {
            title: "Espace Utilisateur",
            client,
            adresses,
            cards,
          });
        } else {
          return res.redirect("/connexion");
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la recuperation des donnees" });
      }
    });

    app.post("/espace-utilisateur", async (req, res) => {
      if (req.session.userId) {
        try {
          const { nom, prenom, mdp, tel } = req.body;
          const clientId = req.session.userId;
          if (mdp !== "" && !passwordRegex.test(mdp)) {
            return res
              .status(400)
              .send(
                "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 caractère spécial parmi @, $, !, %, *, ?, &."
              );
          }
          const adresses = await Adresse.find({ client: clientId });
          const cards = await Paiement.find({ client: clientId });
          const client = await Client.find({ clientId });

          // Effectuer les opérations nécessaires pour appliquer les modifications des informations du client
          const updatedFields = {
            nom: nom,
            prenom: prenom,
            telephone: tel,
          };

          // Vérifier si le mot de passe est renseigné
          if (mdp !== "") {
            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(mdp, saltRounds);
            updatedFields.mdp = hashedPassword;
          }

          const updatedClient = await Client.findByIdAndUpdate(
            clientId,
            updatedFields
          );

          res.redirect("/espace-utilisateur");
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message:
              "Une erreur est survenue lors de la mise à jour des informations du client",
          });
        }
      } else {
        res.redirect("/connexion");
      }
    });

    app.get("/espace-utilisateur/modifier-adresse/:id", async (req, res) => {
      try {
        const adresseId = req.params.id;

        // Récupérer l'adresse à partir de l'ID
        const adresse = await Adresse.findOne({ _id: adresseId });

        if (!adresse) {
          return res.status(404).json({ message: "Adresse non trouvée" });
        }

        res.render("pages/modifier-adresse", { adresse: adresse });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message:
            "Une erreur est survenue lors de la récupération de l'adresse",
        });
      }
    });

    app.post("/espace-utilisateur/modifier-adresse", async (req, res) => {
      try {
        const { nomAdresse, rue, complement, ville, codepostal, pays, region } =
          req.body;

        // Vérifiez si l'adresse existe déjà
        const existingAddress = await Adresse.findOne({ _id: req.body.id });
        if (existingAddress) {
          // Mettez à jour les propriétés de l'adresse existante
          existingAddress.nom = nomAdresse;
          existingAddress.rue = rue;
          existingAddress.complement = complement;
          existingAddress.ville = ville;
          existingAddress.cp = codepostal;
          existingAddress.pays = pays;
          existingAddress.region = region;
          await existingAddress.save();
        } else {
          res.status(500).send("Adresse introuvable");
        }

        res.redirect("/espace-utilisateur");
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send(
            "Une erreur est survenue lors de la modification de l'adresse."
          );
      }
    });

    app.get("/espace-utilisateur/delete-adresse", async (req, res) => {
      const adresseId = req.query.id;
      await Adresse.findByIdAndRemove(adresseId);
      res.redirect("/espace-utilisateur");
    });

    app.get("/espace-utilisateur/delete-card", async (req, res) => {
      const cardId = req.query.id;
      await Paiement.findByIdAndRemove(cardId);
      res.redirect("/espace-utilisateur");
    });

    app.get("/confirmation-paiement", function (req, res) {
      res.render("pages/confirmation_paiement", { title: "Confirm Paiement" });
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
        return res.render("pages/connexion", {
          title: "Connexion",
          error: "Inexisting account",
        });
      }
      const motDePasseCorrect = await bcrypt.compare(mdp, existingClient.mdp);
      if (!motDePasseCorrect) {
        return res.render("pages/connexion", {
          title: "Connexion",
          error: "Incorrect password",
        });
      }
      if (existingClient.admin) {
        req.session.userId = existingClient.id;
        req.session.cookie.expires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
        req.session.isAdmin = true;
        res.redirect("/backoffice");
      } else {
        req.session.cookie.expires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
        req.session.userId = existingClient.id;
        req.session.isAdmin = false;
        res.redirect("/");
      }
    });

    app.get("/inscription", function (req, res) {
      res.render("pages/inscription", { title: "Inscription" });
    });

    app.get("/reset-password/:idClient", async (req, res) => {
      const idClient = req.params.idClient;
      res.render("pages/reset_password", { title: "Reset password", idClient });
    });

    app.post("/reset-password-form", async (req, res) => {
      const idClient = req.body.idClient;
      const newPassword = req.body.mdp;

      try {
        // Rechercher le client par son ID
        const client = await Client.findById(idClient);

        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Mettre à jour le mot de passe du client
        client.mdp = await bcrypt.hash(newPassword, saltRounds);
        await client.save();

        return res.redirect("/connexion");
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/category", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/category", {
          title: "Catégories",
          categories: categories,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
    });

    app.get("/products", async (req, res) => {
      try {
        // Récupérer tous les produits
        const produits = await Produit.find();
        const materials = await Produit.distinct("materiaux");

        // Rendre la page des produits avec les données récupérées
        res.render("pages/product_list", { produits, materials });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send(
            "Une erreur s'est produite lors de la récupération des produits."
          );
      }
    });

    app.get("/product/filter", async (req, res) => {
      try {
        let { nameText, materialSelect, stockSelect, priceMin, priceMax } =
          req.query;
        const filters = {
          nameText,
          materialSelect,
          stockSelect,
          priceMin,
          priceMax,
        };
        const filter = {};

        // Filtre par nom
        if (nameText !== "") {
          filter.nom = { $regex: nameText, $options: "i" };
        }

        // Filtre par matériau
        if (materialSelect !== "") {
          filter.materiaux = materialSelect;
        }

        // Filtre par stock
        if (stockSelect !== "") {
          if (stockSelect === "true") {
            filter.stock = { $gt: 0 }; // Produits en stock (stock supérieur à 0)
          } else {
            filter.stock = 0; // Produits hors stock (stock égal à 0)
          }
        }

        // Filtre par tranche de prix
        // Filtre par tranche de prix
        if (priceMin !== "") {
          const min = parseFloat(priceMin);
          filter.prix = { $gte: min };
        }

        if (priceMax !== "") {
          const max = parseFloat(priceMax);
          filter.prix = { ...filter.prix, $lte: max };
        }

        // Exécutez votre requête avec les filtres
        const produits = await Produit.find(filter);
        const materials = await Produit.distinct("materiaux");
        res.render("pages/product_list", {
          produits,
          materials,
          filters,
        });
      } catch (error) {
        console.log(error);
        res.status(500).send("Erreur lors de la récupération des produits");
      }
    });

    app.get("/product_list", async (req, res) => {
      try {
        const categorie_id = req.query.id;
        const categorie = await Categorie.findById(categorie_id);
        if (!categorie) {
          return res.status(404).send("Catégorie non trouvée");
        }
        const materials = await Produit.distinct("materiaux");
        const produits = await Produit.find({ categorie: categorie_id });
        res.render("pages/product_list", {
          title: "Product List",
          produits: produits,
          categorie: categorie.nom,
          materials: materials,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des produits.");
      }
    });

    app.delete("/categories/:id", (req, res) => {
      const categoryId = req.params.id;
      Product.deleteMany({ category: categoryId }, (err) => {
        if (err) {
          res
            .status(500)
            .send(
              "Une erreur s'est produite lors de la suppression des produits"
            );
        } else {
          Category.findByIdAndRemove(categoryId, (err, category) => {
            if (err) {
              res
                .status(500)
                .send(
                  "Une erreur s'est produite lors de la suppression de la catégorie"
                );
            } else {
              res.send(
                "La catégorie et tous ses produits ont été supprimés avec succès"
              );
            }
          });
        }
      });
    });

    app.delete("/produits/:id", (req, res) => {
      const productId = req.params.id;
      Product.findByIdAndRemove(productId, (err, product) => {
        if (err) {
          res
            .status(500)
            .send(
              "Une erreur s'est produite lors de la suppression du produit"
            );
        } else {
          res.send("Le produit a été supprimé avec succès");
        }
      });
      res.send("Le produit a été supprimé avec succès");
    });

    app.get("/product_detail", async (req, res) => {
      try {
        const produit_id = req.query.id;
        const produit = await Produit.findById(produit_id);
        if (!produit) {
          return res.status(404).send("Produit non trouvé");
        }

        // Récupérer la catégorie du produit principal
        const categorie = produit.categorie;

        // Récupérer 3 autres produits de la même catégorie
        const autresProduits = await Produit.find({
          categorie,
          _id: { $ne: produit_id },
        })
          .limit(3)
          .lean();

        res.render("pages/product_detail", {
          title: "Product Detail",
          produit: produit,
          autresProduits: autresProduits,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération du produit.");
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
      if (!passwordRegex.test(mdp)) {
        return res
          .status(400)
          .send(
            "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 caractère spécial parmi @, $, !, %, *, ?, &."
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
          telephone: "",
          admin: false,
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
        res.redirect("/");
      });
    });

    app.post("/send-mail-contact", async (req, res) => {
      const { email, sujet, message } = req.body;

      try {
        // Créer une instance du modèle Message avec les informations fournies
        const nouveauMessage = new Message({
          email,
          sujet,
          contenu: message,
        });

        // Enregistrer le nouveau message en base de données
        await nouveauMessage.save();

        res.redirect("/");
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de la création du message.");
      }
    });

    /// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ///
    /// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ///
    /// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ////// APIs ///

    app.get("/api/paniers/:client", authenticate, async (req, res) => {
      const clientId = req.params.client;

      try {
        // Vérifier si le client existe
        const client = await Client.findById(clientId);

        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Rechercher tous les paniers du client
        const paniers = await Panier.find({ client: client._id });

        return res.status(200).json({ paniers });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post(
      "/api/add-produit-panier/:client",
      authenticate,
      async (req, res) => {
        const clientId = req.params.client;
        const { article, quantite } = req.body;

        try {
          // Vérifier que la quantité et le produit sont renseignés
          if (!quantite || !article) {
            return res
              .status(400)
              .json({ message: "Quantity and product are required" });
          }

          // Rechercher le client par son ID
          const client = await Client.findById(clientId);

          if (!client) {
            return res.status(404).json({ message: "Client not found" });
          }

          // Vérifier si un panier existe pour ce client et cet article
          const existingPanier = await Panier.findOne({
            client: client._id,
            article: article,
          });

          if (existingPanier) {
            // Mettre à jour la quantité dans le panier existant
            existingPanier.quantite += quantite;

            // Vérifier si la quantité est devenue 0, auquel cas on supprime le panier
            if (existingPanier.quantite === 0) {
              await existingPanier.remove();
              return res
                .status(200)
                .json({ message: "Product removed from cart" });
            }

            await existingPanier.save();
            return res
              .status(200)
              .json({ message: "Product quantity updated in cart" });
          }

          // Rechercher le produit par son ID
          const produit = await Produit.findById(article);

          if (!produit) {
            return res.status(404).json({ message: "Product not found" });
          }

          // Vérifier si le produit est en stock
          if (produit.stock < quantite) {
            return res.status(400).json({ message: "Insufficient stock" });
          }

          // Créer le nouvel objet panier
          const panier = new Panier({
            client: client._id,
            article: produit._id,
            quantite: quantite,
          });

          // Enregistrer le panier
          await panier.save();

          return res.status(200).json({ message: "Product added to cart" });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: "Internal server error" });
        }
      }
    );

    app.get("/api/orders/:idClient", authenticate, async (req, res) => {
      const idClient = req.params.idClient;

      try {
        const commandes = await Commande.find({ client: idClient });
        commandes.reverse();
        res.json(commandes);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de la récupération des commandes du client",
        });
      }
    });

    app.get(
      "/api/orders/details/:idCommande",
      authenticate,
      async (req, res) => {
        const idCommande = req.params.idCommande;

        try {
          const detailsCommande = await Commande.findById(idCommande)
            .populate("produits.produit")
            .exec();

          if (!detailsCommande) {
            return res.status(404).json({
              message: "Commande introuvable",
            });
          }

          res.json(detailsCommande);
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message:
              "Erreur lors de la récupération des détails de la commande",
          });
        }
      }
    );

    app.get("/api/adresses/:idAdresse", authenticate, async (req, res) => {
      const idAdresse = req.params.idAdresse;

      try {
        const adresse = await Adresse.findById(idAdresse);
        res.json(adresse);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la recuperation de l'adresse" });
      }
    });

    app.get("/api/paiements/:idPaiement", authenticate, async (req, res) => {
      const idPaiement = req.params.idPaiement;

      try {
        const paiement = await Paiement.findById(idPaiement);
        res.json(paiement);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de la recuperation du moyen de paiement",
        });
      }
    });

    app.delete("/api/paiements/:idPaiement", authenticate, async (req, res) => {
      const idPaiement = req.params.idPaiement;

      try {
        await Paiement.findByIdAndDelete(idPaiement);
        res.json({ message: "Carte supprimée avec succès" });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de la recuperation du moyen de paiement",
        });
      }
    });

    app.delete("/api/adresses/:idAdresse", authenticate, async (req, res) => {
      const idAdresse = req.params.idAdresse;

      try {
        await Adresse.findByIdAndDelete(idAdresse);
        res.json({ message: "Adresse supprimée avec succès" });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de la recuperation du moyen de paiement",
        });
      }
    });

    app.put("/api/adresses/:idAdresse", authenticate, async (req, res) => {
      const idAdresse = req.params.idAdresse;
      const { nom, rue, ville, cp, pays, region, complement } = req.body;

      try {
        const adresse = await Adresse.findById(idAdresse);
        if (!adresse) {
          return res
            .status(404)
            .json({ message: "L'adresse n'a pas été trouvée" });
        }

        adresse.nom = nom || adresse.nom;
        adresse.rue = rue || adresse.rue;
        adresse.ville = ville || adresse.ville;
        adresse.cp = cp || adresse.cp;
        adresse.pays = pays || adresse.pays;
        adresse.region = region || adresse.region;
        adresse.complement = complement || adresse.complement;

        await adresse.save();

        res.status(200).json(adresse);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
      }
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

        res
          .status(200)
          .json({ message: "Connexion réussie", token, _id: client._id });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la connexion" });
      }
    });

    app.post("/api/reset-password", async (req, res) => {
      try {
        // Récupérer l'e-mail renseigné dans le formulaire
        const mail = req.body.email;
        const client = await Client.findOne({ mail });
        const idClient = client._id; // Récupérer l'ID du client

        await sendResetEmail(mail, idClient);

        // Répondre avec une confirmation
        res.status(200).send("Password reset request received.");
      } catch (error) {
        console.error("Error sending password reset email:", error);
        res.status(500).send("Failed to send password reset email.");
      }
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

        //res.json({ client, adresses, paiements });
        res.json(client);
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .send("Erreur lors de la récupération des informations du client");
      }
    });

    app.post("/api/client/:clientId", authenticate, async (req, res) => {
      try {
        const clientId = req.params.clientId;
        const client = await Client.findById(clientId);
        if (!client) {
          return res
            .status(404)
            .json({ success: false, error: "Client non trouvé" });
        }

        // Mettez à jour les informations du client avec les données fournies dans la requête
        client.nom = req.body.nom;
        client.prenom = req.body.prenom;
        client.telephone = req.body.telephone;

        await client.save();

        res.json({ success: true, client });
      } catch (error) {
        console.log(error);
        res.status(500).json({
          success: false,
          error: "Erreur lors de la modification des informations du client",
        });
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
          const paniers = await Panier.find({ client: clientId }).populate("article");

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

    app.post("/api/contact", authenticate, async (req, res) => {
      const { email, sujet, contenu } = req.body;

      try {
        const nouveauMessage = new Message({
          email,
          sujet,
          contenu,
        });

        const messageEnregistre = await nouveauMessage.save();

        res.json({
          message: "Message envoyé avec succès",
          messageEnregistre,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "Erreur lors de l'enregistrement du message",
        });
      }
    });

    app.get("/api/favoris", async (req, res) => {
      try {
        const favoris = await Favoris.findById(idFavoris);
        res.json(favoris);
      } catch (error) {
        res.status(500).send("Erreur lors de la récupération des favoris.");
      }
    });

    app.get("/api/categorie/:idCategorie", async (req, res) => {
      const idCategorie = req.params.idCategorie;
      try {
        const categorie = await Categorie.findById(idCategorie);
        res.json(categorie);
      } catch (error) {
        res.status(500).send("Erreur lors de la récupération de la catégorie.");
      }
    });

    /// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ///
    /// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ///
    /// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ////// Backoffice ///

    app.get("/backoffice/favoris", requireAdmin, async (req, res) => {
      try {
        const favoris = await Favoris.findById(idFavoris)
          .populate("categorie1", "nom")
          .populate("categorie2", "nom")
          .populate("categorie3", "nom")
          .populate("produit1", "nom")
          .populate("produit2", "nom")
          .populate("produit3", "nom")
          .exec();
        res.render("pages/backoffice_view_favorie", {
          title: "Backoffice - ViewFavoris",
          favoris: favoris,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des favoris.");
      }
    });

    app.get("/backoffice/favoris/modify", requireAdmin, async (req, res) => {
      try {
        const produits = await Produit.find({});
        const categories = await Categorie.find({});
        const favoris = await Favoris.findById(idFavoris)
          .populate("categorie1", "nom")
          .populate("categorie2", "nom")
          .populate("categorie3", "nom")
          .populate("produit1", "nom")
          .populate("produit2", "nom")
          .populate("produit3", "nom")
          .exec();
        res.render("pages/backoffice_modif_favorie", {
          title: "Backoffice - ModifyFavoris",
          favoris: favoris,
          categories: categories,
          produits: produits,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des favoris.");
      }
    });

    app.post("/backoffice/favoris/modify", requireAdmin, async (req, res) => {
      try {
        const favoris = await Favoris.findById(idFavoris);

        // Vérifier si les favoris existent dans la base de données
        if (!favoris) {
          return res.status(404).json({ message: "Aucun favoris trouvé" });
        }

        // Mettre à jour les champs des favoris
        favoris.categorie1 = req.body.categorie1;
        favoris.categorie2 = req.body.categorie2;
        favoris.categorie3 = req.body.categorie3;
        favoris.produit1 = req.body.produit1;
        favoris.produit2 = req.body.produit2;
        favoris.produit3 = req.body.produit3;

        // Mettre à jour les champs des photos
        favoris.photo1 = req.body.photo1;
        favoris.photo2 = req.body.photo2;
        favoris.photo3 = req.body.photo3;
        favoris.photo4 = req.body.photo4;

        // Enregistrer les modifications dans la base de données
        await favoris.save();

        res.redirect("/backoffice/favoris");
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la mise à jour des favoris" });
      }
    });

    app.get("/backoffice/messages", requireAdmin, async (req, res) => {
      try {
        // Récupérer tous les messages de la base de données, triés par date de création décroissante
        const messages = await Message.find().sort({ createdAt: -1 });

        res.render("pages/backoffice_messages", {
          title: "Messages",
          messages: messages,
        });
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .send(
            "Une erreur s'est produite lors de la récupération des messages."
          );
      }
    });

    app.get("/backoffice", requireAdmin, async (req, res) => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOfToday.getDate() - 7);

        const totalSalesByDay = await Commande.aggregate([
          {
            $match: {
              date: { $gte: startOf7DaysAgo, $lt: startOfToday },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalSales: { $sum: "$prixTTC" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

        const salesByCategoryByDay = await Commande.aggregate([
          {
            $match: {
              date: { $gte: startOf7DaysAgo, $lt: startOfToday },
            },
          },
          {
            $unwind: "$produits",
          },
          {
            $lookup: {
              from: "produit",
              localField: "produits",
              foreignField: "_id",
              as: "produitInfo",
            },
          },
          {
            $unwind: "$produitInfo",
          },
          {
            $group: {
              _id: {
                day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                category: "$produitInfo.categorie",
              },
              totalSales: { $sum: "$produitInfo.prix" },
            },
          },
          {
            $group: {
              _id: "$_id.day",
              salesByCategory: {
                $push: {
                  category: "$_id.category",
                  totalSales: "$totalSales",
                },
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

        const furnitureByCategoryByDay = await Commande.aggregate([
          {
            $match: {
              date: { $gte: startOf7DaysAgo, $lt: startOfToday },
            },
          },
          {
            $unwind: "$produits",
          },
          {
            $lookup: {
              from: "produit",
              localField: "produits",
              foreignField: "_id",
              as: "produitInfo",
            },
          },
          {
            $unwind: "$produitInfo",
          },
          {
            $group: {
              _id: {
                day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                category: "$produitInfo.categorie",
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.day",
              furnitureByCategory: {
                $push: {
                  category: "$_id.category",
                  count: "$count",
                },
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

        const data = {
          totalSalesByDay,
          salesByCategoryByDay,
          furnitureByCategoryByDay,
        };

        res.render("pages/backoffice", { data });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message:
            "Une erreur s'est produite lors de la récupération des données",
        });
      }
    });

    app.post("/backoffice/orders/:idCommande/statut", async (req, res) => {
      try {
        const idCommande = req.params.idCommande;
        const newStatut = req.body.statut;

        // Exemple de mise à jour de statut avec Mongoose
        const commande = await Commande.findByIdAndUpdate(
          idCommande,
          { statut: newStatut },
          { new: true }
        );
        res.redirect("/backoffice/orders");
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
        res
          .status(500)
          .json({ error: "Erreur lors de la mise à jour du statut" });
      }
    });

    app.get("/backoffice/returnRequests", requireAdmin, async (req, res) => {
      try {
        // Récupérer toutes les commandes depuis la base de données
        const commandes = await Commande.find({ statut: "Return requested" })
          .populate("produits.produit")
          .exec();
        commandes.reverse();
        // Passer les données des commandes à la vue "backoffice_orders"
        res.render("pages/backoffice_orders", { commandes });
      } catch (error) {
        console.log(error);
        res.status(500).send("Erreur lors de la récupération des commandes");
      }
    });

    app.post("/backoffice/produit/add", requireAdmin, async (req, res) => {
      try {
        const {
          _id,
          nom,
          prix,
          stock,
          description,
          materiaux,
          categorie,
          photo1,
          photo2,
          photo3,
          photo4,
        } = req.body;

        // Vérifier si l'ID du produit est fourni pour déterminer s'il s'agit d'une création ou d'une modification
        if (_id) {
          // Modification du produit
          const produitExistant = await Produit.findById(_id);

          if (!produitExistant) {
            return res.status(404).json({ error: "Produit non trouvé." });
          }

          // Mise à jour des informations du produit
          produitExistant.nom = nom;
          produitExistant.prix = prix;
          produitExistant.stock = stock;
          produitExistant.description = description;
          produitExistant.materiaux = materiaux;
          produitExistant.categorie = categorie;
          produitExistant.image1 = photo1 || "";
          produitExistant.image2 = photo2 || "";
          produitExistant.image3 = photo3 || "";
          produitExistant.image4 = photo4 || "";

          await produitExistant.save();

          // Le produit a été mis à jour avec succès en base de données
          return res.redirect("/backoffice/produit");
        } else {
          // Création du produit
          const categorieExistante = await Categorie.findById(categorie);

          if (!categorieExistante) {
            return res
              .status(400)
              .json({ error: "La catégorie est invalide." });
          }

          // Enregistrer le produit en base de données avec les liens vers les images
          const produit = new Produit({
            nom,
            prix,
            stock,
            description,
            mateiraux: materiaux ? materiaux : "",
            categorie: categorie,
            image1: photo1 || "",
            image2: photo2 || "",
            image3: photo3 || "",
            image4: photo4 || "",
          });

          await produit.save();

          // Le produit a été enregistré avec succès en base de données
          return res.redirect("/backoffice/produit");
        }
      } catch (error) {
        // Une erreur s'est produite lors de la création ou de la mise à jour du produit
        console.error(
          "Erreur lors de la création ou de la mise à jour du produit :",
          error
        );
        return res.status(500).json({
          error:
            "Une erreur s'est produite lors de la création ou de la mise à jour du produit.",
        });
      }
    });

    app.get("/backoffice/orders", requireAdmin, async (req, res) => {
      try {
        // Récupérer toutes les commandes depuis la base de données
        const commandes = await Commande.find()
          .populate("produits.produit")
          .populate("client")
          .exec();
        commandes.reverse();
        // Passer les données des commandes à la vue "backoffice_orders"
        res.render("pages/backoffice_orders", { commandes });
      } catch (error) {
        console.log(error);
        res.status(500).send("Erreur lors de la récupération des commandes");
      }
    });

    app.get("/backoffice/categorie", requireAdmin, async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/backoffice_view_category", {
          title: "Backoffice - CategoriesList",
          categories: categories,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des categories.");
      }
    });

    app.get("/backoffice/categorie/add", requireAdmin, async (req, res) => {
      try {
        const categoryId = req.query.id;

        // Vérifier si l'ID de la catégorie est fourni pour déterminer s'il s'agit d'une modification
        if (categoryId) {
          // Récupérer la catégorie existante depuis la base de données
          const categorieExistante = await Categorie.findById(categoryId);
          if (!categorieExistante) {
            return res.status(404).json({ error: "Catégorie non trouvée." });
          }

          // Afficher la page de modification de la catégorie avec les détails de la catégorie existante
          return res.render("pages/backoffice_add_category", {
            title: "Backoffice - CategoryAdd",
            isCategory: true,
            categorie: categorieExistante,
          });
        } else {
          // Afficher la page de création de la catégorie
          return res.render("pages/backoffice_add_category", {
            title: "Backoffice - CategoryAdd",
            isCategory: false,
          });
        }
      } catch (error) {
        // Une erreur s'est produite lors de la récupération de la catégorie existante
        console.error(
          "Erreur lors de la récupération de la catégorie existante :",
          error
        );
        return res.status(500).json({
          error:
            "Une erreur s'est produite lors de la récupération de la catégorie existante.",
        });
      }
    });

    app.post("/backoffice/categorie/add", requireAdmin, async (req, res) => {
      try {
        const { _id, nom, description, image } = req.body;

        // Vérifier si l'ID de la catégorie est fourni pour déterminer s'il s'agit d'une création ou d'une modification
        if (_id) {
          // Modification de la catégorie
          const categorieExistante = await Categorie.findById(_id);

          if (!categorieExistante) {
            return res.status(404).json({ error: "Catégorie non trouvée." });
          }

          // Mise à jour des informations de la catégorie
          categorieExistante.nom = nom;
          categorieExistante.image = image;
          categorieExistante.description = description;

          await categorieExistante.save();

          // La catégorie a été mise à jour avec succès en base de données
          return res.redirect("/backoffice/categorie");
        } else {
          // Création de la catégorie
          const categorie = new Categorie({
            nom,
            description,
            image,
          });

          await categorie.save();

          // La catégorie a été créée avec succès en base de données
          return res.redirect("/backoffice/categorie");
        }
      } catch (error) {
        // Une erreur s'est produite lors de la création ou de la mise à jour de la catégorie
        console.error(
          "Erreur lors de la création ou de la mise à jour de la catégorie :",
          error
        );
        return res.status(500).json({
          error:
            "Une erreur s'est produite lors de la création ou de la mise à jour de la catégorie.",
        });
      }
    });

    app.get("/backoffice/produit", requireAdmin, async (req, res) => {
      try {
        const produits = await Produit.find({})
          .populate("categorie", "nom") // Récupère le champ "nom" de la collection "categorie"
          .exec();

        res.render("pages/backoffice_view_product", {
          title: "BackOffice-Product",
          produits: produits,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des produits.");
      }
    });

    app.get("/backoffice/produit/add", requireAdmin, async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/backoffice_add_product", {
          title: "Backoffice-AddProduct",
          categories: categories,
          isProduit: false,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des categories.");
      }
    });

    app.get("/backoffice/produit/modify", requireAdmin, async (req, res) => {
      try {
        const produit_id = req.query.id;
        const produit = await Produit.findById(produit_id);
        if (!produit) {
          return res.status(404).send("Produit non trouvée");
        }
        const categories = await Categorie.find({});
        res.render("pages/backoffice_add_product", {
          title: "Backoffice-ModifyProduct",
          categories: categories,
          produit: produit,
          isProduit: true,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des categories.");
      }
    });

    app.get("/categorie/delete/:id", requireAdmin, async (req, res) => {
      try {
        const categorieId = req.params.id;

        // Vérifier si la catégorie existe
        const categorie = await Categorie.findById(categorieId);
        if (!categorie) {
          return res.status(404).json({ error: "Catégorie non trouvée." });
        }

        // Supprimer la catégorie de la base de données
        await Categorie.findByIdAndRemove(categorieId);

        // Rediriger vers la page de gestion des catégories
        return res.redirect("/backoffice/categorie");
      } catch (error) {
        // Une erreur s'est produite lors de la suppression de la catégorie
        console.error("Erreur lors de la suppression de la catégorie :", error);
        return res.status(500).json({
          error:
            "Une erreur s'est produite lors de la suppression de la catégorie.",
        });
      }
    });

    app.get("/order/changeStatut/:idCommande/:statut", async (req, res) => {
      try {
        const idCommande = req.params.idCommande;
        const statut = req.params.statut;
        if (statut === "askCancel") {
          newStatut = "Canceled";
        }
        if (statut === "askReturn") {
          newStatut = "Return requested";
        }
        const commande = await Commande.findByIdAndUpdate(
          idCommande,
          { statut: newStatut },
          { new: true }
        );
        res.redirect("/historique_commande");
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
        res
          .status(500)
          .json({ error: "Erreur lors de la mise à jour du statut" });
      }
    });

    app.get("/produit/delete/:id", requireAdmin, async (req, res) => {
      try {
        const produitId = req.params.id;

        // Supprimez le produit en utilisant l'ID fourni
        await Produit.findByIdAndRemove(produitId);

        // Redirigez vers la page de la liste des produits après la suppression réussie
        return res.redirect("/backoffice/produit");
      } catch (error) {
        console.error(error);
        // Gérez les erreurs et renvoyez une réponse appropriée en cas d'échec de suppression
        return res
          .status(500)
          .send("Une erreur s'est produite lors de la suppression du produit.");
      }
    });

    app.listen(PORT, () => {
      console.log(`Je tourne ici : http://localhost:${PORT}`);
    });
  });
