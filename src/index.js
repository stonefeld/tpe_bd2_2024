import { MongoClient } from "mongodb";
import { createClient } from "redis";
import fs from "fs";
import csv from "csv-parser";

async function setClients() {
  const mongo = new MongoClient("mongodb://localhost:27017");
  const redis = createClient();

  await mongo.connect().catch((err) => console.log("Mongo Client Error", err));

  redis.on("error", (err) => console.log("Redis Client Error", err));
  await redis.connect();

  return { mongo, redis };
}

async function generateFacturas() {
  try {
    // Cargar los datos de ambos archivos
    const facturas = await loadCSVData("./src/datasets/e01_factura.csv");
    const detalles = await loadCSVData(
      "./src/datasets/e01_detalle_factura.csv"
    );

    // Crear el array de facturas con subarrays de detalles
    const result = facturas.map((factura) => {
      const detallesFactura = detalles.filter(
        (detalle) => detalle.nro_factura === factura.nro_factura
      );
      return {
        nro_factura: parseInt(factura.nro_factura),
        fecha: factura.fecha,
        total_sin_iva: parseFloat(factura.total_sin_iva),
        iva: parseFloat(factura.iva),
        total_con_iva: parseFloat(factura.total_con_iva),
        nro_cliente: parseInt(factura.nro_cliente),
        detalles: detallesFactura.map((detalle) => ({
          codigo_producto: parseInt(detalle.codigo_producto),
          nro_item: parseInt(detalle.nro_item),
          cantidad: parseFloat(detalle.cantidad),
        })),
      };
    });

    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

// 0. Cargar los datos a la base de datos.
// 3 colecciones: clientes, facturas y productos.
async function loadData() {
  const { mongo, redis } = await setClients();

  try {
    const database = mongo.db("db2");
    const facturas = database.collection("facturas");

    const facturasArray = await generateFacturas();

    await facturas.insertMany(facturasArray);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 1. Obtener los datos de los clientes junto con sus teléfonos.
async function clientAndCellphones() {
  const { mongo, redis } = await setClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clients");

    const result = await clientes
      .find({}, { projection: { _id: 0 } })
      .toArray();

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

async function loadCSVData(filePath) {
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" })) // Usamos ";" como separador
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
}

loadData().catch(console.dir);
// clientAndCellphones().catch(console.dir);
// findJacobCooper().catch(console.dir);
