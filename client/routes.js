const { read, create, readOne, update, deleteOne } = require("./controller");

module.exports = function (app, db) {
  app.get("/api/client", read(db));
  app.post("/api/client", create(db));
  app.get("/api/client/:id", readOne(db));
};
