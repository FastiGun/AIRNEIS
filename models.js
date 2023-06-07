const mongoose = require("mongoose");

//Client
const clientSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  mail: String,
  mdp: String,
  telephone: { type: String, default: null },
  admin: { type: Boolean, default: false },
});

const Client = mongoose.model("Client", clientSchema, "client");

//Panier
const panierSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  article: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  quantite: { type: Number, default: 0 },
});

const Panier = mongoose.model("Panier", panierSchema, "panier");

//Produit
const produitSchema = new mongoose.Schema({
  nom: String,
  prix: Number,
  stock: Number,
  description: String,
  materiaux: String,
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  image1: String,
  image2: String,
  image3: String,
  image4: String,
});

const Produit = mongoose.model("Produit", produitSchema, "produit");

//Categorie
const categorieSchema = new mongoose.Schema({
  nom: String,
  description: String,
  image: String,
});

const Categorie = mongoose.model("Categorie", categorieSchema, "categorie");

//Adresse
const adresseSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  nom: String,
  rue: String,
  ville: String,
  cp: String,
  pays: String,
  region: String,
  complement: String,
});

const Adresse = mongoose.model("Adresse", adresseSchema, "adresse");

//Paiement
const paiementSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  libelle_carte: String,
  nom_carte: String,
  num_carte: String,
  date_expiration: String,
  cvv: String,
});

const Paiement = mongoose.model("Paiement", paiementSchema, "paiement");

//Commande
const commandeSchema = new mongoose.Schema({
  date: Date,
  prixHT: Number,
  prixTTC: Number,
  statut: String,
  produits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panier",
    },
  ],
  adresseFacturation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Adresse",
  },
  adresseLivraison: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Adresse",
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
});

const Commande = mongoose.model("Commande", commandeSchema, "commande");

//Favoris
const favorisSchema = new mongoose.Schema({
  categorie1: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  categorie2: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  categorie3: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  produit1: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  produit2: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  produit3: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  photo1: String,
  photo2: String,
  photo3: String,
  photo4: String,
});

const Favoris = mongoose.model("Favoris", favorisSchema, "favoris");

//Message
const messageSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  sujet: {
    type: String,
  },
  contenu: {
    type: String,
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema, "message");

module.exports = {
  Client,
  Panier,
  Produit,
  Categorie,
  Adresse,
  Paiement,
  Commande,
  Favoris,
  Message,
};
