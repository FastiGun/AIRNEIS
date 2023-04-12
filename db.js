const { MongoClient } = require("mongodb");
const url = "mongodb+srv://admin:admin@cluster05326.ihn9hcl.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);
const dbName = "airneis";

async function main() {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  return db;
}

const connexion = main().catch(console.error);
module.exports = { connexion };
