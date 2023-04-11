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

class Avis {
    constructor({ id, date, contenu, note }) {
        this.id = id;
        this.date = date;
        this.contenu = contenu;
        this.note = note;
    }
}    

module.exports = Avis;


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

class Commande {
    constructor({ id, date, prix }) {
        this.id = id;
        this.date = date;
        this.prix = prix;
    }
}    

module.exports = Commande; 

class Panier {
    constructor({ id, prix }) {
        this.id = id; 
        this.prix = prix; 
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