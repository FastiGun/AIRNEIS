const { object, string, number } = require("yup");
const { ObjectId } = require("mongodb");
const Produit = require("./model");

const productSchema = object({
  id: number().required().positive().integer(),
  nom: string().required(),
  prix: number().required().positive().integer(),
  stock: number().positive().integer(),
  description: string().required(),
  categorie: number().required(),
  quantite: number().integer().positive(),
});

const read = (db) => async (req, res) => {
  const collection = db.collection("produit");
  const list = await collection.find({}).toArray();
  res.json(list);
};

const readOne = (db) => async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = db.collection("produit");
    const produit = await collection.findOne({ _id: id });
    if (produit) {
      res.status(200).json(produit);
    } else {
      res.status(404).json({ status: 404, message: "Produit introuvable" });
    }
  } catch (err) {
    res.status(500).json({ status: 500, message: err && "Erreur serveur" });
  }
};

const create = (db) => async (req, res) => {
  const { body } = req;
  try {
    const parsedProducts = productSchema.cast({ ...body });
    const produit = new Produit({ ...parsedProducts });
    try {
      const collection = db.collection("produit");
      const result = await collection.insertOne(produit);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  } catch (err) {
    res.status(400).json({ message: "Erreur de format", err });
  }
  const { read, create } = require("./controller");
  module.exports = function (app, db) {
    app.get("/produit", read(db));
    app.post("/produit", create(db));
  };
};

const productSchemaUpdate = object({
  nom: string(),
  prix: number().positive().integer(),
  stock: number().positive().integer(),
  id: number().positive().integer(),
});

const update = (db) => async (req, res) => {
  const { body } = req;
  try {
    const id = new ObjectId(req.params.id);
    const parsedProducts = productSchemaUpdate.cast({ ...body });
    const product = new Products({ ...parsedProducts });
    // on supprime les propriétés null et undefined
    const productFiltered = cleanObj(product);
    const collection = db.collection("produit");
    const productUpdated = await collection.updateOne(
      { _id: id },
      { $set: { ...productFiltered } }
    );
    res.status(200).json(productUpdated);
  } catch (err) {
    res.status(500).json({ status: 500, message: err && "Erreur serveur" });
  }
  const cleanObj = (obj) =>
    Object.keys(obj).reduce(
      (acc, curr) => ({
        ...acc,
        ...(obj[curr] !== null && obj[curr] !== undefined
          ? { [curr]: obj[curr] }
          : {}),
      }),
      {}
    );
};

const deleteOne = (db) => async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = db.collection("produit");
    const productDeleted = await collection.deleteOne({ _id: id });
    res.status(200).json(productDeleted);
  } catch (err) {
    res.status(500).json({ status: 500, message: err && "Erreur serveur" });
  }
};

module.exports = { read, create, readOne, update, deleteOne };