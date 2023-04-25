class Produits {
    constructor({ title, price, stock, id, description }) {
        this.title = title;
        this.price = price;
        this.stock = stock;
        this.id = id;
        this.description = description;
    }
}

module.exports = Produits;

class Categories {
    constructor({ id, title }) {
        this.id = id;
        this.title = title;
    }
}    

module.exports = Categories;

class Client {
    constructor({ id, nom, prenom, mail, mdp, rue, ville, cp , port }) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom; 
        this.mail = mail; 
        this.mdp = mdp; 
        this.rue = rue; 
        this.ville = ville; 
        this.cp = cp; 
        this.port = port;  
    }
}

module.exports = Client;

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
    constructor({ id, date, prix, statut, nb_articles, articles, num_client }) {
        this.id = id;
        this.date = date;
        this.prix = prix;
        this.statut = statut; 
        this.nb_articles = nb_articles; 
        this.articles = articles; 
        this.num_client = num_client; 
    }
}    

module.exports = Commande; 

class Panier {
    constructor({ id, prix, nb_article }) {
        this.id = id; 
        this.prix = prix;
        this.nb_article = nb_article; 
    }
}

module.exports = Panier; 

class Statut {
    constructor({ id, statut }) {
        this.id = id; 
        this.statut = statut; 
    }
}

module.exports = Statut; 