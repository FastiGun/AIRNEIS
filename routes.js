module.exports = function (app, db) {
  require("./produit/routes")(app, db);
  require("./client/routes")(app, db);
};
