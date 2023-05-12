const { object, string, number } = require("yup");
const { ObjectId } = require("mongodb");
const Client = require("./model");

const productSchema = object({
  id: number().required().positive().integer(),
  nom: string().required(),
  prenom: string().required(),
  mail: string().required(),
  mdp: string().required(),
  telephone: string(),
  panier: number().required().positive().integer(),
});

const read = (db) => async (req, res) => {
  const collection = db.collection("client");
  const list = await collection.find({}).toArray();
  res.json(list);
};

const readOne = (db) => async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = db.collection("client");
    const client = await collection.findOne({ _id: id });
    if (client) {
      res.status(200).json(client);
    } else {
      res.status(404).json({ status: 404, message: "Client introuvable" });
    }
  } catch (err) {
    res.status(500).json({ status: 500, message: err && "Erreur serveur" });
  }
};

const create = (db) => async (req, res) => {
  const { body } = req;
  try {
    const parsedClient = productSchema.cast({ ...body });
    const client = new Client({ ...parsedClient });
    try {
      const collection = db.collection("client");
      const result = await collection.insertOne(client);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  } catch (err) {
    res.status(400).json({ message: "Erreur de format", err });
  }
  const { read, create } = require("./controller");
  module.exports = function (app, db) {
    app.get("/client", read(db));
    app.post("/client", create(db));
  };
};

module.exports = { read, create, readOne };