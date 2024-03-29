# AIRNEIS
AIRNEIS est une application web développée avec Express.js et Pug. Il s'agit d'un site e-commerce permettant aux utilisateurs de parcourir et d'acheter des produits en ligne. L'application offre une interface utilisateur conviviale et une gestion administrative pour gérer les produits, les catégories, les commandes et le support client.

# Fonctionnalités
- Parcours des produits par catégorie
- Ajout de produits au panier
- Passage de commandes
- Gestion des retour et des produits (partie backoffice)
- Support client via formulaire de contact
- Intégration d'une API pour une application mobile (Android Studio)

# Prérequis
Avant de pouvoir exécuter l'application, assurez-vous d'avoir les éléments suivants installés :
- Node.js (v14 ou supérieur)
- MongoDB

# Installation
- Clonez ce dépôt sur votre machine locale : git clone https://github.com/FastiGun/AIRNEIS.git
- Accédez au répertoire du projet : cd airneis
- Installez les dépendances : npm install
  
- Configurez les variables d'environnement :

Créez un fichier .env à la racine du projet et ajoutez les configurations suivantes :
DB_URL=mongodb://localhost:27017/airneis
SECRET_KEY= Une valeur de votre choix

Assurez-vous de remplacer mongodb://localhost:27017/airneis par l'URL de votre base de données MongoDB.

- Démarrez l'application : npm start

L'application sera accessible à l'adresse http://localhost:3000.

# Auteurs

- [@RunninZoom](https://github.com/RunninZoom)
- [@FastiGun](https://github.com/FastiGun)
- [@belcasam](https://github.com/belcasam)
