const { MongoClient } = require("mongodb");
require('dotenv').config();
const url = process.env.DB_URL;
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
