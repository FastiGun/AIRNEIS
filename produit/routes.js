const {read, create, readOne, update, deleteOne} = require("./controller");

module.exports = function (app, db) {
  app.get("/produit", read(db));
  app.post("/produit", create(db));
  app.get("/produit/:id", readOne(db));
  app.put("/produit/:id", update(db));
  app.delete("/produit/:id", deleteOne(db));
};