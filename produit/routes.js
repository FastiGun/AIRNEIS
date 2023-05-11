const { read, create, readOne, update, deleteOne } = require("./controller");

module.exports = function (app, db) {
  app.get("/api/produit", read(db));
  app.post("/api/produit", create(db));
  app.get("/api/produit/:id", readOne(db));
  app.put("/api/produit/:id", update(db));
  app.delete("/api/produit/:id", deleteOne(db));
};
