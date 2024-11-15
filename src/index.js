import { MongoClient } from "mongodb";
import { createClient } from "redis";

async function setClients() {
  const mongo = new MongoClient("mongodb://localhost:27017");
  const redis = createClient();

  await mongo.connect().catch((err) => console.log("Mongo Client Error", err));

  redis.on("error", (err) => console.log("Redis Client Error", err));
  await redis.connect();

  return { mongo, redis };
}

// 1. Obtener los datos de los clientes junto con sus teléfonos.
async function clientAndCellphones() {
  const { mongo, redis } = await setClients();

  try {
    const database = mongo.db("db2");
    const clients = database.collection("clients");

    const result = await clients.find({}, { projection: { _id: 0 } }).toArray();

    for (const client of result) {
      await redis.hSet(`clients:${client.nro_cliente}`, client);
    }

    // TODO: Revisar si agregamos al set clients:names:<nombre> = id

    console.log(result);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 2. Obtener el/los teléfono/s y el número de cliente del cliente con nombre “Jacob” y apellido “Cooper”.
async function findJacobCooper() {
  const { mongo, redis } = await setClients();

  try {
    let clientID = await redis.get("clients:names:JacobCooper");

    if (!clientID) {
      const database = mongo.db("db2");
      const clients = database.collection("clients");

      const projection = { nro_cliente: 1 };
      const result = await clients.findOne(
        { nombre: "Jacob", apellido: "Cooper" },
        { projection }
      );
      if (result) {
        clientID = result.nro_cliente;
        await redis.set("clients:names:JacobCooper", clientID);
      } else {
        console.log("No se encontró el cliente");
        return;
      }
    }

    const client = await redis.hGetAll(`clients:${clientID}`);
    console.log({ _id: client.nro_cliente, telefonos: client.telefonos });
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

clientAndCellphones().catch(console.dir);
findJacobCooper().catch(console.dir);
