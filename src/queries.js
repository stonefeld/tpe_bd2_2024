import { setDbClients } from "./utils.js";
import {
  generateFacturas,
  generateClientes,
  generateProductos,
} from "./data.js";

// 0. Cargar los datos a la base de datos.
// 3 colecciones: clientes, facturas y productos.
export async function loadData() {
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
export async function clientAndCellphones() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .find({}, { projection: { _id: 0 } })
      .toArray();

    for (const cliente of result) {
      const keyId = `clientes:names:${cliente.nombre}${cliente.apellido}`;
      const keyClient = `clientes:${cliente.nro_cliente}`;

      await redis.set(keyId, cliente.nro_cliente);
      await redis.set(keyClient, JSON.stringify(cliente));
    }

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 2. Obtener el/los teléfono/s y el número de cliente del cliente con nombre “Jacob” y apellido “Cooper”.
export async function findJacobCooper() {
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

        const keyId = `clientes:names:${result.nombre}${result.apellido}`;
        const keyClient = `clientes:${result.nro_cliente}`;

        await redis.set(keyId, clientID);
        await redis.set(keyClient, JSON.stringify(result));
      } else {
        console.log("No se encontró al cliente");
        return;
      }
    }

    const cliente = await redis.get(`clientes:${clientID}`);
    console.log(JSON.stringify(JSON.parse(cliente), null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 3. Mostrar cada teléfono junto con los datos del cliente.
export async function phonesAndClientData() {
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
            _id: 0,
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

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 4. Obtener todos los clientes que tengan registrada al menos una factura.
export async function clientsWithBills() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
        {
          $lookup: {
            from: "facturas",
            localField: "nro_cliente",
            foreignField: "nro_cliente",
            as: "facturas",
          },
        },
        {
          $match: {
            "facturas.0": { $exists: true },
          },
        },
        {
          $project: {
            _id: 0,
            nombre: 1,
            apellido: 1,
            nro_cliente: 1,
          },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 5. Identificar todos los clientes que no tengan registrada ninguna factura.
export async function clientsWithoutBills() {
  const { mongo, redis } = await setDbClients();
  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
        {
          $lookup: {
            from: "facturas",
            localField: "nro_cliente",
            foreignField: "nro_cliente",
            as: "facturas",
          },
        },
        {
          $match: {
            "facturas.0": { $exists: false },
          },
        },
        {
          $project: {
            _id: 0,
            nombre: 1,
            apellido: 1,
            nro_cliente: 1,
          },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 6. Devolver todos los clientes, con la cantidad de facturas que tienen registradas (si no tienen considerar cantidad en 0)
export async function clientsWithBillsCount() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
        {
          $lookup: {
            from: "facturas",
            localField: "nro_cliente",
            foreignField: "nro_cliente",
            as: "facturas",
          },
        },
        {
          $project: {
            _id: 0,
            nombre: 1,
            apellido: 1,
            nro_cliente: 1,
            facturas_count: { $ifNull: [{ $size: "$facturas" }, 0] },
          },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 7. Listar los datos de todas las facturas que hayan sido compradas por el cliente de nombre "Kai" y apellido "Bullock".
export async function findKaiBullockBills() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");
    const facturas = database.collection("facturas");

    const client = await redis.get("clientes:names:KaiBullock");

    if (!client) {
      const result = await clientes.findOne(
        { nombre: "Kai", apellido: "Bullock" },
        { projection: { _id: 0 } }
      );

      if (result) {
        const clientID = result.nro_cliente;

        const keyId = `clientes:names:${result.nombre}${result.apellido}`;
        const keyClient = `clientes:${result.nro_cliente}`;

        await redis.set(keyId, clientID);
        await redis.set(keyClient, JSON.stringify(result));

        client = clientID;
      } else {
        console.log("No se encontr al cliente");
        return;
      }
    }

    const result = await facturas
      .find({ nro_cliente: Number(client) }, { projection: { _id: 0 } })
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 8. Seleccionar los productos que han sido facturados al menos 1 vez.
export async function productsWithBills() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const facturas = database.collection("facturas");

    const result = await facturas
      .aggregate([
        {
          $unwind: "$detalles",
        },
        {
          $lookup: {
            from: "productos",
            localField: "detalles.codigo_producto",
            foreignField: "codigo_producto",
            as: "producto_info",
          },
        },
        {
          $unwind: {
            path: "$producto_info",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$producto_info.codigo_producto",
            nombre_producto: { $first: "$producto_info.nombre" },
            descripcion_producto: { $first: "$producto_info.descripcion" },
            precio_producto: { $first: "$producto_info.precio" },
          },
        },
        {
          $project: {
            _id: 0,
            codigo_producto: "$_id",
            nombre_producto: 1,
            descripcion_producto: 1,
            precio_producto: 1,
          },
        },
        {
          $sort: { codigo_producto: 1 },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 9. Listar los datos de todas las facturas que contengan productos de las marcas que incluyan “Ipsum”.
export async function billsWithIpsumProducts() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const facturas = database.collection("facturas");

    const result = await facturas
      .aggregate([
        { $unwind: "$detalles" },
        {
          $lookup: {
            from: "productos",
            localField: "detalles.codigo_producto",
            foreignField: "codigo_producto",
            as: "productos_detalle",
          },
        },
        {
          $match: {
            "productos_detalle.marca": { $regex: "Ipsum", $options: "i" },
          },
        },
        {
          $group: {
            _id: "$nro_factura",
            fecha: { $first: "$fecha" },
            total_sin_iva: { $first: "$total_sin_iva" },
            iva: { $first: "$iva" },
            total_con_iva: { $first: "$total_con_iva" },
            nro_cliente: { $first: "$nro_cliente" },
          },
        },
        {
          $project: {
            _id: 0,
            nro_factura: "$_id",
            fecha: 1,
            total_sin_iva: 1,
            iva: 1,
            total_con_iva: 1,
            nro_cliente: 1,
          },
        },
        {
          $sort: { nro_factura: 1 },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 10. Mostrar nombre y apellido de cada cliente junto con lo que gastó en total, con IVA incluido
export async function clientsWithTotalSpent() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
        {
          $lookup: {
            from: "facturas",
            localField: "nro_cliente",
            foreignField: "nro_cliente",
            as: "facturas",
          },
        },
        {
          $unwind: {
            path: "$facturas",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              nro_cliente: "$nro_cliente",
              nombre: "$nombre",
              apellido: "$apellido",
            },
            totalGastado: { $sum: "$facturas.total_con_iva" },
          },
        },
        {
          $project: {
            _id: 0,
            nombre: "$_id.nombre",
            apellido: "$_id.apellido",
            totalGastado: 1,
          },
        },
      ])
      .toArray();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 11. Se necesita una vista que devuelva los datos de las facturas ordenadas por fecha
export async function billsOrderedByDateView() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");

    const existingViews = await database
      .listCollections({ type: "view" })
      .toArray();
    const viewExists = existingViews.some(
      (view) => view.name === "facturas_ordenadas_por_fecha"
    );

    if (!viewExists) {
      await database.createCollection("facturas_ordenadas_por_fecha", {
        viewOn: "facturas",
        pipeline: [
          { $sort: { fecha: 1 } },
          {
            $project: {
              _id: 0,
              nro_factura: 1,
              nro_cliente: 1,
              fecha: 1,
              total_con_iva: 1,
              iva: 1,
              total_sin_iva: 1,
            },
          },
        ],
      });
    }

    const result = await database
      .collection("facturas_ordenadas_por_fecha")
      .find()
      .toArray();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 12. Se necesita una vista que devuelva todos los productos que aún no han sido facturados.
export async function productsNotBilledView() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");

    const existingViews = await database
      .listCollections({ type: "view" })
      .toArray();
    const viewExists = existingViews.some(
      (view) => view.name === "productos_no_facturados"
    );

    if (!viewExists) {
      await database.createCollection("productos_no_facturados", {
        viewOn: "productos",
        pipeline: [
          {
            $lookup: {
              from: "facturas",
              localField: "codigo_producto",
              foreignField: "detalles.codigo_producto",
              as: "facturado_en",
            },
          },
          {
            $match: {
              facturado_en: { $size: 0 },
            },
          },
          {
            $project: {
              _id: 0,
              codigo_producto: 1,
              nombre: 1,
              marca: 1,
              descripcion: 1,
              precio: 1,
              stock: 1,
            },
          },
        ],
      });
    }

    const result = await database
      .collection("productos_no_facturados")
      .find()
      .toArray();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 13. Implementar la funcionalidad que permita crear nuevos clientes, eliminar y modificar los ya existentes
export async function createClient(nombre, apellido, direccion, activo) {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");
    const newNrCliente = (await getMaxClientNumber()) + 1;

    const cliente = {
      nro_cliente: newNrCliente,
      nombre: nombre,
      apellido: apellido,
      direccion: direccion,
      activo: activo,
    };

    await clientes.insertOne(cliente);

    await redis.set(`clientes:names:${nombre}${apellido}`, newNrCliente);
    await redis.set(`clientes:${newNrCliente}`, JSON.stringify(cliente));
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

export async function updateClient(id, nombre, apellido, direccion, activo) {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const cliente = {
      nombre: nombre,
      apellido: apellido,
      direccion: direccion,
      activo: activo,
    };

    await clientes.updateOne({ nro_cliente: id }, { $set: cliente });

    const oldClient = await redis.get(`clientes:${id}`);
    if (oldClient) {
      const cliente = JSON.parse(oldClient);
      await redis.del(`clientes:names:${cliente.nombre}${cliente.apellido}`);
    }

    await redis.set(`clientes:names:${nombre}${apellido}`, id);
    await redis.set(
      `clientes:${id}`,
      JSON.stringify({
        nro_cliente: id,
        ...cliente,
      })
    );
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

export async function deleteClient(id) {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    await clientes.deleteOne({ nro_cliente: id });

    const oldClient = await redis.get(`clientes:${id}`);
    if (oldClient) {
      const client = JSON.parse(oldClient);
      await redis.del(`clientes:names:${client.nombre}${client.apellido}`);
      await redis.del(`clientes:${id}`);
    }
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// 14. Implementar la funcionalidad que permita crear nuevos productos y modificar los ya existentes. Tener en cuenta que el precio de un producto es sin IVA.
export async function createProduct(marca, nombre, descripcion, precio, stock) {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const productos = database.collection("productos");

    const productLength = await productos.countDocuments();

    const result = await productos.insertOne({
      codigo_producto: productLength + 1,
      marca,
      nombre,
      descripcion,
      precio,
      stock,
    });

    console.log("Product created with ObjectId: " + result.insertedId);
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

export async function updateProduct(
  id,
  marca,
  nombre,
  descripcion,
  precio,
  stock
) {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const productos = database.collection("productos");

    const result = await productos.updateOne(
      { codigo_producto: id },
      {
        $set: {
          marca,
          nombre,
          descripcion,
          precio,
          stock,
        },
      }
    );

    console.log(
      "Update " +
        result.modifiedCount +
        " product" +
        (result.modifiedCount === 1 ? "" : "s")
    );
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// EXTRAS
// Pedir todos los clientes ordenados por nombre
export async function getAllClientsByName() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");
    return await clientes.find().sort({ nombre: 1 }).toArray();
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// Pedir todos los productos ordenados por nombre
export async function getAllProductsByName() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const productos = database.collection("productos");
    return await productos.find().sort({ marca: 1 }).toArray();
  } finally {
    await mongo.close();
    await redis.quit();
  }
}

// Obtener el último número de cliente
async function getMaxClientNumber() {
  const { mongo, redis } = await setDbClients();

  try {
    const database = mongo.db("db2");
    const clientes = database.collection("clientes");

    const result = await clientes
      .aggregate([
        { $sort: { nro_cliente: -1 } },
        { $limit: 1 },
        { $project: { _id: 0, nro_cliente: 1 } },
      ])
      .toArray();

    if (result.length > 0) {
      return result[0].nro_cliente;
    } else {
      return 0;
    }
  } finally {
    await mongo.close();
    await redis.quit();
  }
}
