const mongoose = require("mongoose");

//Client
const clientSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  nom: String,
  prenom: String,
  mail: String,
  mdp: String,
  telephone: { type: String, default: null },
});

const Client = mongoose.model("Client", clientSchema, "client");

//Panier
const panierSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  article: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  quantite: { type: Number, default: 0 },
});

const Panier = mongoose.model("Panier", panierSchema, "panier");

//Produit
const produitSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  nom: String,
  prix: Number,
  stock: Number,
  description: String,
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  photo: String,
});

const Produit = mongoose.model("Produit", produitSchema, "produit");

//Categorie
const categorieSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  nom: String,
});

const Categorie = mongoose.model("Categorie", categorieSchema, "categorie");

//Adresse
const adresseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  nom: String,
  rue: String,
  ville: String,
  cp: String,
  num: String,
  complement: String,
});

const Adresse = mongoose.model("Adresse", adresseSchema, "adresse");

//Paiement
const paiementSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  nom_carte: String,
  num_carte: String,
  date_expiration: String,
  cvv: String,
});

const Paiement = mongoose.model("Paiement", paiementSchema, "paiement");

//Commande
const commandeSchema = new mongoose.Schema({
  date: String,
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
  article1: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  article2: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  article3: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
  photo1: String,
  photo2: String,
  photo3: String,
  photo4: String,
});

const Favoris = mongoose.model("Favoris", favorisSchema, "favoris");

module.exports = {
  Client,
  Panier,
  Produit,
  Categorie,
  Adresse,
  Paiement,
  Commande,
  Favoris,
};
