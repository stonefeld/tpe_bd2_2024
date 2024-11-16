import { MongoClient } from "mongodb";
import { createClient } from "redis";
import fs from "fs";
import csv from "csv-parser";

export async function setDbClients() {
  const mongo = new MongoClient("mongodb://localhost:27017");
  const redis = createClient();

  await mongo.connect().catch((err) => console.log("Mongo Client Error", err));

  redis.on("error", (err) => console.log("Redis Client Error", err));
  await redis.connect();

  return { mongo, redis };
}

export async function loadCSVData(filePath) {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
}
