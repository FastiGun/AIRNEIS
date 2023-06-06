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
  Message,
} = require("./models");
const { ObjectId } = require("mongodb");
const e = require("express");
const cloudinary = require("cloudinary").v2;

// Configuration Cloudinary pour le stockage de photos
cloudinary.config({
  cloud_name: "dkhkhqbvl",
  api_key: "259432631373519",
  api_secret: process.env.SECRET_CLOUDINARY,
});

const secretKey = process.env.SECRET_KEY;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
        secret: process.env.SECRET_KEY,
        resave: true,
        saveUninitialized: true,
        maxAge: null,
      })
    );

    // Middleware pour vérifier l'état de connexion de l'utilisateur
    app.use((req, res, next) => {
      res.locals.isLoggedIn = req.session.userId ? true : false;
      next();
    });

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
        res.render("pages/cart", { paniers, prixTotal, TVA, title: "Panier" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("Une erreur s'est produite lors de la récupération du panier.");
      }
    });

    app.get("/add-produit-panier/:articleId", async (req, res) => {
      if (!req.session.userId) {
        // L'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
        return res.redirect("/connexion");
      }

      const articleId = req.params.articleId;
      const clientId = req.session.userId;

      try {
        // Vérifier si le client et l'article existent
        if (!clientId || !articleId) {
          return res.status(404).send("Client ou article introuvable");
        }

        // Vérifier si le panier existe déjà pour cet article et ce client
        let panier = await Panier.findOne({
          client: clientId,
          article: articleId,
        });

        if (panier) {
          // Le panier existe déjà, incrémenter la quantité
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
      if (existingClient.admin) {
        req.session.userId = existingClient.id;
        res.redirect("/backoffice");
      } else {
        req.session.userId = existingClient.id;
        res.redirect("/");
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
          .json({ message: "Connexion réussie", token, clientId: client._id });
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
        res.render("pages/category", {
          title: "Catégories",
          categories: categories,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des catégories.");
      }
    });

    app.get("/product_list", async (req, res) => {
      try {
        const categorie_id = req.query.id;
        const categorie = await Categorie.findById(categorie_id);
        if (!categorie) {
          return res.status(404).send("Catégorie non trouvée");
        }
        const produits = await Produit.find({ categorie: categorie_id });
        res.render("pages/product_list", {
          title: "Product List",
          produits: produits,
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

    app.get("/delivery_address", function (req, res) {
      res.render("pages/delivery_address", { title: "Delivery Address" });
    });

    app.get("/backoffice/produit", async (req, res) => {
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

    app.get("/backoffice/produit/add", async (req, res) => {
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

    app.get("/backoffice/produit/modify", async (req, res) => {
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

    app.get("/backoffice/categorie", async (req, res) => {
      try {
        const categories = await Categorie.find({});
        res.render("pages/backoffice_view_category", { title: "Backoffice - CategoriesList", categories : categories })
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des categories.");
      }
    });

    app.get("/backoffice/categorie/add", async (req, res) => {
      res.render("pages/backoffice_add_category", { title: "Backoffice - CategoryAdd", isCategory: false })
    });

    app.get("/backoffice/categorie/modify", async (req, res) => {
      try{
        const categorieId = req.query.id;
        const categorie = await Categorie.findById(categorieId);
        if(!categorie){
          return res.status(404).send("Categorie non trouvée");
        }
        res.render("pages/backoffice_add_category", { title: "Backoffice - CategoryModif'", isCategory: true, categorie: categorie })
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération de la categorie.");
      }
    });

    app.post("/backoffice/categorie/add", (req, res) => {
      // Récupérer les informations de la catégorie depuis req.body
      const { nom, image } = req.body;

      // Vérifier que l'image est présente (obligatoire)
      if (!image) {
        return res.status(400).json({ error: "L'image est obligatoire." });
      }

      // Télécharger l'image sur Cloudinary
      const uploadOptions = {
        folder: "images", // Le dossier dans lequel stocker les images sur Cloudinary
        transformation: [{ width: 500, height: 500, crop: "limit" }], // Options de transformation d'image
      };

      cloudinary.uploader
        .upload(image, uploadOptions)
        .then((result) => {
          // L'image a été téléchargée avec succès
          // Vous pouvez récupérer l'URL sécurisée de l'image à partir de result.secure_url

          // Enregistrer la catégorie en base de données avec l'URL de l'image
          const categorie = new Categorie({
            nom,
            image: result.secure_url,
          });

          categorie
            .save()
            .then(() => {
              // La catégorie a été enregistrée avec succès en base de données
              res.status(201).json({ message: "Catégorie créée avec succès." });
            })
            .catch((error) => {
              // Une erreur s'est produite lors de l'enregistrement de la catégorie en base de données
              console.error(
                "Erreur lors de l'enregistrement de la catégorie en base de données :",
                error
              );
              res.status(500).json({
                error:
                  "Une erreur s'est produite lors de la création de la catégorie.",
              });
            });
        })
        .catch((error) => {
          // Une erreur s'est produite lors du téléchargement de l'image
          // Gérer l'erreur et répondre avec la réponse appropriée
          console.error("Erreur lors du téléchargement de l'image :", error);
          res.status(500).json({
            error:
              "Une erreur s'est produite lors de la création de la catégorie.",
          });
        });
    });

    app.post("/backoffice/produit/add", async (req, res) => {
      try {
        const {
          _id,
          nom,
          prix,
          stock,
          description,
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

    app.get("/produit/delete/:id", async (req, res) => {
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

    app.get("/backoffice/favoris", async (req,res) => {
      try {
        const favoris = await Favoris.findById(idFavoris)
            .populate("categorie1", "nom")
            .populate("categorie2", "nom")
            .populate("categorie3", "nom")
            .populate("produit1", "nom")
            .populate("produit2", "nom")
            .populate("produit3", "nom")
            .exec();
        res.render("pages/backoffice_view_favorie", { title: "Backoffice - ViewFavoris", favoris: favoris});
      } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des favoris.");
      }
    });

    app.post("/backoffice/favoris/modify", async (req, res) => {
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

        // Télécharger les photos sur Cloudinary
        const photo1 = await cloudinary.uploader.upload(req.body.photo1);
        const photo2 = await cloudinary.uploader.upload(req.body.photo2);
        const photo3 = await cloudinary.uploader.upload(req.body.photo3);
        const photo4 = await cloudinary.uploader.upload(req.body.photo4);

        // Mettre à jour les champs des photos
        favoris.photo1 = photo1.secure_url;
        favoris.photo2 = photo2.secure_url;
        favoris.photo3 = photo3.secure_url;
        favoris.photo4 = photo4.secure_url;

        // Enregistrer les modifications dans la base de données
        await favoris.save();

        res.status(200).json({ message: "Favoris mis à jour avec succès" });
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .json({ message: "Erreur lors de la mise à jour des favoris" });
      }
    });

    app.get("/backoffice/messages", async (req, res) => {
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

    app.get("/backoffice", async (req, res) => {
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

    app.listen(PORT, () => {
      console.log(`Je tourne ici : http://localhost:${PORT}`);
    });
  });
