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

class Categorie {
    constructor({ id, nom }) {
        this.id = id;
        this.nom = nom;
    }
}    

module.exports = Categorie;

class Client {
    constructor({ id, nom, prenom, mail, mdp, adresses, telephone, paiements, panier }) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom; 
        this.mail = mail; 
        this.mdp = mdp; 
        this.adresses = adresses;
        this.telephone = telephone;  
        this.paiements = paiements;
        this.panier = panier;
    }
}

module.exports = Client;

class Adresse {
    constructor({ id, nom, rue, ville, cp, num, complement }){
        this.id = id;
        this.nom = nom;
        this.rue = rue;
        this.ville = ville;
        this.cp = cp;
        this.num = num;
        this.complement = complement;
    }
}

module.exports = Adresse;

class Paiement {
    constructor({ id, nom_carte , num_carte, date_expiration, cvv }) {
        this.id = id;
        this.nom_carte = nom_carte;
        this.num_carte = num_carte; 
        this.date_expiration = date_expiration; 
        this.cvv = cvv;
    }
}

module.exports = Paiement;

class Commande {
    constructor({ id, date, prixHT, prixTTC, statut, produits, adresseFacturation, adresseLivraison, client }) {
        this.id = id;
        this.date = date;
        this.prixHT = prixHT;
        this.prixTTC = prixTTC;
        this.statut = statut; 
        this.produits = produits; 
        this.adresseFacturation = adresseFacturation;
        this.adresseLivraison = adresseLivraison;
        this.client = client; 
    }
}    

module.exports = Commande; 

class Panier {
    constructor({ id, produits, prixHT, prixTTC }) {
        this.id = id; 
        this.produits = produits;
        this.prixHT = prixHT;
        this.prixTTC = prixTTC;
    }
}

module.exports = Panier; 

class Favoris {
    constructor({ categorie1, categorie2, categorie3, article1, article2, article3 }){
        this.categorie1 = categorie1;
        this.categorie2 = categorie2;
        this.categorie3 = categorie3;
        this.article1 = article1;
        this.article2 = article2;
        this.article3 = article3;
    }
}

module.exports = Favoris