import { setDbClients } from "./utils.js";
import {
  generateFacturas,
  generateClientes,
  generateProductos,
  insertClientRedis,
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
      await insertClientRedis(client, redis);
    }

    console.log(JSON.stringify(result, null, 2));
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
        await insertClientRedis(result, redis);
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

// 3. Mostrar cada teléfono junto con los datos del cliente.
async function phonesAndClientData(params) {
  const { mongo, redis } = await setDbClients();
  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes.aggregate([
      {
        $unwind: "$telefonos", 
      },
      {
        $project: {
          _id: 0, // sacamos el id
          codigo_area: "$telefonos.codigo_area",
          nro_telefono: "$telefonos.nro_telefono",
          tipo: "$telefonos.tipo",
          nombre: "$nombre",
          apellido: "$apellido",
          direccion: "$direccion",
          activo: "$activo",
        },
      },
    ]).toArray(); 

    console.log(result);
  } catch (err) {
    console.error("Error ejecutando la consulta:", err);
  } finally {
    await mongo.close(); // Cierra la conexión con MongoDB
    await redis.quit(); // Cierra la conexión con Redis (si es necesario)
  }
  // db.clientes.aggregate([
  //   {
  //     $unwind: "$telefonos" // Descompone el array `telefonos` en múltiples documentos
  //   },
  //   {
  //     $project: {
  //       _id: 0, // Excluye el ID del resultado
  //       codigo_area: "$telefonos.codigo_area",
  //       nro_telefono: "$telefonos.nro_telefono",
  //       tipo: "$telefonos.tipo",
  //       nombre: "$nombre",
  //       apellido: "$apellido",
  //       direccion: "$direccion",
  //       activo: "$activo"
  //     }
  //   }
  // ]);
  
}

await loadData().catch(console.dir);
await clientAndCellphones().catch(console.dir);
await phonesAndClientData().catch(console.dir);
// await findJacobCooper().catch(console.dir);
