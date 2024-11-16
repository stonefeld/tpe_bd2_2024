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
      await redis.set(
        `clientes:names:${client.nombre}${client.apellido}`,
        client.nro_cliente,
      );
      await redis.set(`clientes:${client.nro_cliente}`, JSON.stringify(client));
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
        { projection: { _id: 0 } },
      );

      if (result) {
        clientID = result.nro_cliente;

        const keyId = `clientes:names:${result.nombre}${result.apellido}`;
        const keyClient = `clientes:${result.nro_cliente}`;

        await redis.set(keyId, clientID);
        await redis.set(keyClient, JSON.stringify(result));
      } else {
        console.log("No se encontró el cliente");
        return;
      }
    }

    const cliente = await redis.get(`clientes:${clientID}`);
    console.log(JSON.parse(cliente));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 3. Mostrar cada teléfono junto con los datos del cliente.
async function phonesAndClientData() {
  const { mongo, redis } = await setDbClients();
  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
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
      ])
      .toArray();

    console.log(result);
  } catch (err) {
    console.error("Error ejecutando la consulta:", err);
  } finally {
    await mongo.close();
  }
}

// 4. Obtener todos los clientes que tengan registrada al menos una factura.
async function clientsWithBills() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes.aggregate([
      {
        $lookup: {
          from: "facturas", 
          localField: "nro_cliente", 
          foreignField: "nro_cliente", 
          as: "facturas" 
        }
      },
      {
        $match: {
          "facturas.0": { $exists: true } 
        }
      },
      {
        $project: {
          _id: 0,
          nombre: 1,
          apellido: 1,
          nro_cliente: 1
        }
      }
    ]).toArray();

    console.log("Clientes con facturas:");
    console.log(result);
  } catch (err) {
    console.error("Error ejecutando la consulta:", err);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}


// 5. Identificar todos los clientes que no tengan registrada ninguna factura.
async function clientsWithoutBills() {

}

// 6. Devolver todos los clientes, con la cantidad de facturas que tienen registradas (si no tienen considerar cantidad en 0)
async function clientsWithBillsCount() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes.aggregate([
      {
        $lookup: {
          from: "facturas", // Colección con la que se realiza el join
          localField: "nro_cliente", // Campo de la colección clientes
          foreignField: "nro_cliente", // Campo de la colección facturas
          as: "facturas" // El alias para la información relacionada con facturas
        }
      },
      {
        $project: {
          _id: 0,
          nombre: 1,
          apellido: 1,
          nro_cliente: 1,
          facturas_count: { $ifNull: [{ $size: "$facturas" }, 0] } // Contamos las facturas, y si no tiene, asignamos 0
        }
      }
    ]).toArray();

    console.log("Clientes con cantidad de facturas:");
    console.log(result);
  } catch (err) {
    console.error("Error ejecutando la consulta:", err);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}


// 7. Listar los datos de todas las facturas que hayan sido compradas por el cliente de nombre"Kai" y apellido "Bullock".
async function findKaiBullockBills() {

}

// 8. Seleccionar los productos que han sido facturados al menos 1 vez.
async function productsWithBills() {

}

// 9. Listar los datos de todas las facturas que contengan productos de las marcas “Ipsum”.
async function billsWithIpsumProducts() {

}

// 10. Mostrar nombre y apellido de cada cliente junto con lo que gastó en total, con IVA incluido
async function clientsWithTotalSpent() {

}

// 11. Se necesita una vista que devuelva los datos de las facturas ordenadas por fecha
async function billsOrderedByDateView() {

}

// 12. Se necesita una vista que devuelva todos los productos que aún no han sido facturados.
async function productsNotBilledView() {

}

// 13. Implementar la funcionalidad que permita crear nuevos clientes, eliminar y modificar los ya existentes
async function createClient() {

}

async function deleteClient(id) {

}

async function updateClient(id) {

}

// 14. Implementar la funcionalidad que permita crear nuevos productos y modificar los ya existentes. Tener en cuenta que el precio de un producto es sin IVA.
async function createProduct() {

}

async function updateProduct(id) {

}

await loadData().catch(console.dir);
await clientAndCellphones().catch(console.dir);
await findJacobCooper().catch(console.dir);
await phonesAndClientData().catch(console.dir);
await clientsWithBills().catch(console.dir);
await clientsWithoutBills().catch(console.dir);
await clientsWithBillsCount().catch(console.dir);
await findKaiBullockBills().catch(console.dir);
await productsWithBills().catch(console.dir);
await billsWithIpsumProducts().catch(console.dir);
await clientsWithTotalSpent().catch(console.dir);
await billsOrderedByDateView().catch(console.dir);
await productsNotBilledView().catch(console.dir);