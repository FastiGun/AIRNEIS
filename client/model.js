class Client {
  constructor({ id, nom, prenom, mail, mdp, adresses, telephone, paiements, panier }) {
      this.id = id;
      this.nom = nom;
      this.prenom = prenom; 
      this.mail = mail; 
      this.mdp = mdp; 
      this.telephone = telephone;  
      this.paiements = paiements;
      this.panier = panier;
  }
}

module.exports = Client;