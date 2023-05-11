class Produit {
  constructor({ id, nom, prix, stock, description, categorie, quantite, photo }) {
      this.id = id;
      this.nom = nom;
      this.prix = prix;
      this.stock = stock;
      this.description = description;
      this.categorie = categorie;
      this.quantite = quantite;
      this.photo = photo;
  }
}

module.exports = Produit;