import { setDbClients } from "./utils.js";
import {
  generateFacturas,
  generateClientes,
  generateProductos,
} from "./data.js";

// 0. Cargar los datos a la base de datos.
// 3 colecciones: clientes, facturas y productos.
async function loadData() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");

    await database.dropDatabase();
    await redis.flushAll();

    const facturas = database.collection("facturas");
    const clientes = database.collection("clientes");
    const productos = database.collection("productos");

    const facturasArray = await generateFacturas();
    const clientesArray = await generateClientes();
    const productosArray = await generateProductos();

    await facturas.insertMany(facturasArray);
    await clientes.insertMany(clientesArray);
    await productos.insertMany(productosArray);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 1. Obtener los datos de los clientes junto con sus teléfonos.
async function clientAndCellphones() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .find({}, { projection: { _id: 0 } })
      .toArray();

    for (const client of result) {
      await redis.hSet(`clientes:${client.nro_cliente}`, client);
    }

    // TODO: Revisar si agregamos al set clientes:names:<nombre> = id

    console.log(result);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 2. Obtener el/los teléfono/s y el número de cliente del cliente con nombre “Jacob” y apellido “Cooper”.
async function findJacobCooper() {
  const { mongo, redis } = await setDbClients();

  try {
    let clientID = await redis.get("clientes:names:JacobCooper");

    if (!clientID) {
      const database = mongo.db("db2");
      const clientes = database.collection("clientes");

      const result = await clientes.findOne(
        {
          nombre: "Jacob",
          apellido: "Cooper",
        },
        { projection: { _id: 0 } }
      );
      if (result) {
        clientID = result.nro_cliente;
        await redis.set("clientes:names:JacobCooper", clientID);

        const key = `clientes:${clientID}`;
        if (!(await redis.get(key))) {
          const telefonos = result.telefonos;
          delete result.telefonos;
          await redis.hSet(key, result);
          for (const [index, telefono] of telefonos.entries()) {
            const key = `clientes:${clientID}:telefonos:${index}`;
            await redis.hSet(key, telefono);
          }
        }
      } else {
        console.log("No se encontró el cliente");
        return;
      }
    }

    const client = await redis.hGetAll(`clientes:${clientID}`);
    const telefonosKeys = await redis.keys(`clientes:${clientID}:telefonos:*`);

    client.telefonos = [];
    for (const key of telefonosKeys) {
      client.telefonos.push(await redis.hGetAll(key));
    }

    console.log({
      nro_cliente: client.nro_cliente,
      telefonos: client.telefonos,
    });
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

await loadData().catch(console.dir);
// clientAndCellphones().catch(console.dir);
await findJacobCooper().catch(console.dir);
