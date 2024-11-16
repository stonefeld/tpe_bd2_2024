import { input, search, select, Separator } from "@inquirer/prompts";
import * as q from "./queries.js";
import { setDbClients } from "./utils.js";

async function pedirDatosCliente(cliente) {
  const nombre = await input({
    message: "Ingrese el nombre del cliente",
    validate: (value) => value.trim() !== "",
    default: cliente?.nombre,
  });

  const apellido = await input({
    message: "Ingrese el apellido del cliente",
    validate: (value) => value.trim() !== "",
    default: cliente?.apellido,
  });

  const direccion = await input({
    message: "Ingrese la dirección del cliente",
    validate: (value) => value.trim() !== "",
    default: cliente?.direccion,
  });

  const activo = await input({
    message: "El cliente está activo?",
    default: cliente?.activo,
  });

  return {
    nombre,
    apellido,
    direccion,
    activo,
  };
}

async function crearCliente() {
  const datos = await pedirDatosCliente();
  await q.createClient(datos.nombre, datos.apellido, datos.direccion, datos.activo);
}

async function modificarCliente() {
  let clientes = await q.getAllClientsByName();
  clientes = clientes.map((c) => ({
    ...c,
    nombre_completo: `${c.nombre} ${c.apellido}`,
  }));

  const mapper = (c) => ({
    name: c.nombre_completo,
    value: c,
    description: c.direccion,
  });

  const c = await search({
    message: "Seleccione el cliente que desea modificar",
    source: async (input) => {
      if (!input) return clientes.map(mapper);
      return clientes
        .filter((c) =>
          c.nombre_completo.toLowerCase().includes(input.toLowerCase()),
        )
        .map(mapper);
    },
  });

  const datos = await pedirDatosCliente(c);
  await q.updateClient(
    c.nro_cliente,
    datos.nombre,
    datos.apellido,
    datos.direccion,
    datos.activo,
  );
}

async function eliminarCliente() {
  let clientes = await q.getAllClientsByName();
  clientes = clientes.map((c) => ({
    ...c,
    nombre_completo: `${c.nombre} ${c.apellido}`,
  }));

  const mapper = (c) => ({
    name: c.nombre_completo,
    value: c,
    description: c.direccion,
  });

  const c = await search({
    message: "Seleccione el cliente que desea eliminar",
    source: async (input) => {
      if (!input) return clientes.map(mapper);
      return clientes
        .filter((c) =>
          c.nombre_completo.toLowerCase().includes(input.toLowerCase()),
        )
        .map(mapper);
    },
  });

  await q.deleteClient(c.nro_cliente);
}

async function clientsCRUD() {
  try {
    const operacion = await select({
      message: "Seleccione la operación que desea realizar",
      loop: false,
      choices: [
        {
          name: "CREAR",
          value: crearCliente,
          description: "Permite crear un nuevo cliente",
        },
        {
          name: "MODIFICAR",
          value: modificarCliente,
          description: "Permite modificar los datos de un cliente existente",
        },
        {
          name: "ELIMINAR",
          value: eliminarCliente,
          description: "Permite eliminar un cliente existente",
        },
      ],
    });

    // Ejecutamos la query seleccionada
    await operacion();
  } catch {}
}

try {
  const query = await select({
    message: "Seleccione la query que desea ejecutar",
    loop: false,
    choices: [
      {
        name: " 0) Cargar datos",
        value: q.loadData,
        description: "Carga los datos de los archivos CSV",
      },
      new Separator(),
      {
        name: " 1) Clientes y celulares",
        value: q.clientAndCellphones,
        description:
          "Obtener los datos de los clientes junto con sus teléfonos",
      },
      {
        name: " 2) Buscar a Jacob Cooper",
        value: q.findJacobCooper,
        description:
          'Obtener el/los teléfono/s y el número de cliente del cliente con nombre "Jacob" y apellido "Cooper"',
      },
      {
        name: " 3) Clientes y celulares",
        value: q.clientAndCellphones,
        description: "Mostrar cada teléfono junto con los datos del cliente",
      },
      {
        name: " 4) Clientes con facturas",
        value: q.clientsWithBills,
        description:
          "Obtener todos los clientes que tengan registrada al menos una factura",
      },
      {
        name: " 5) Clientes sin facturas",
        value: q.clientsWithoutBills,
        description:
          "Identificar todos los clientes que no tengan registrada ninguna factura",
      },
      {
        name: " 6) Clientes con cantidad de facturas",
        value: q.clientsWithBillsCount,
        description:
          "Devolver todos los clientes, con la cantidad de facturas que tienen registradas (si no tienen considerar cantidad en 0)",
      },
      {
        name: " 7) Buscar a Kai Bullock y sus facturas",
        value: q.findKaiBullockBills,
        description:
          'Listar los datos de todas las facturas que hayan sido compradas por el cliente de nombre "Kai" y apellido "Bullock"',
      },
      {
        name: " 8) Productos con facturas",
        value: q.productsWithBills,
        description:
          "Seleccionar los productos que han sido facturados al menos 1 vez",
      },
      {
        name: " 9) Facturas con productos Ipsum",
        value: q.billsWithIpsumProducts,
        description:
          'Listar los datos de todas las facturas que contengan productos de las marcas "Ipsum"',
      },
      {
        name: "10) Clientes con total gastado",
        value: q.clientsWithTotalSpent,
        description:
          "Mostrar nombre y apellido de cada cliente junto con lo que gastó en total, con IVA incluido",
      },
      new Separator(),
      {
        name: "11) Facturas ordenadas por fecha",
        value: q.billsOrderedByDateView,
        description:
          "Se necesita una vista que devuelva los datos de las facturas ordenadas por fecha",
      },
      {
        name: "12) Productos no facturados",
        value: q.productsNotBilledView,
        description:
          "Se necesita una vista que devuelva todos los productos que aún no han sido facturados",
      },
      new Separator(),
      {
        name: "13) ABM de clientes",
        value: clientsCRUD,
        description:
          "Permite crear nuevos clientes, eliminar y modificar los ya existentes",
      },
      // {
      //   name: "14) ABM de productos",
      //   value: productsCRUD,
      //   description:
      //     "Permite crear nuevos productos y modificar los ya existentes. Tener en cuenta que el precio de un producto es sin IVA",
      // },
    ],
  });

  // Ejecutamos la query seleccionada
  await query();
} catch {}
