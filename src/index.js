import { select, Separator } from "@inquirer/prompts";
import * as queries from "./queries.js";
import * as cruds from "./cruds.js";

async function clientsCRUD() {
  try {
    const action = await select({
      message: "Seleccione la operación que desea realizar",
      loop: false,
      choices: [
        {
          name: "CREAR",
          value: cruds.createClient,
          description: "Permite crear un nuevo cliente",
        },
        {
          name: "MODIFICAR",
          value: cruds.updateClient,
          description: "Permite modificar los datos de un cliente existente",
        },
        {
          name: "ELIMINAR",
          value: cruds.deleteClient,
          description: "Permite eliminar un cliente existente",
        },
      ],
    });

    await action();
  } catch {}
}

async function productsCRUD() {
  try {
    const action = await select({
      message: "Seleccione la operación que desea realizar",
      loop: false,
      choices: [
        {
          name: "CREAR",
          value: cruds.createProduct,
          description: "Permite crear un nuevo producto",
        },
        {
          name: "MODIFICAR",
          value: cruds.updateProduct,
          description: "Permite modificar los datos de un producto existente",
        },
      ],
    });

    // Ejecutamos la query seleccionada
    await action();
  } catch {}
}

try {
  const query = await select({
    message: "Seleccione la query que desea ejecutar",
    loop: false,
    choices: [
      {
        name: " 0) Cargar datos",
        value: queries.loadData,
        description: "Carga los datos de los archivos CSV. Se limpia la base de datos antes de cargar los datos",
      },
      new Separator(),
      {
        name: " 1) Clientes y celulares",
        value: queries.clientAndCellphones,
        description:
          "Obtener los datos de los clientes junto con sus teléfonos",
      },
      {
        name: " 2) Buscar a Jacob Cooper",
        value: queries.findJacobCooper,
        description:
          'Obtener el/los teléfono/s y el número de cliente del cliente con nombre "Jacob" y apellido "Cooper"',
      },
      {
        name: " 3) Clientes y celulares",
        value: queries.clientAndCellphones,
        description: "Mostrar cada teléfono junto con los datos del cliente",
      },
      {
        name: " 4) Clientes con facturas",
        value: queries.clientsWithBills,
        description:
          "Obtener todos los clientes que tengan registrada al menos una factura",
      },
      {
        name: " 5) Clientes sin facturas",
        value: queries.clientsWithoutBills,
        description:
          "Identificar todos los clientes que no tengan registrada ninguna factura",
      },
      {
        name: " 6) Clientes con cantidad de facturas",
        value: queries.clientsWithBillsCount,
        description:
          "Devolver todos los clientes, con la cantidad de facturas que tienen registradas (si no tienen considerar cantidad en 0)",
      },
      {
        name: " 7) Buscar a Kai Bullock y sus facturas",
        value: queries.findKaiBullockBills,
        description:
          'Listar los datos de todas las facturas que hayan sido compradas por el cliente de nombre "Kai" y apellido "Bullock"',
      },
      {
        name: " 8) Productos con facturas",
        value: queries.productsWithBills,
        description:
          "Seleccionar los productos que han sido facturados al menos 1 vez",
      },
      {
        name: " 9) Facturas con productos Ipsum",
        value: queries.billsWithIpsumProducts,
        description:
          'Listar los datos de todas las facturas que contengan productos de las marcas "Ipsum"',
      },
      {
        name: "10) Clientes con total gastado",
        value: queries.clientsWithTotalSpent,
        description:
          "Mostrar nombre y apellido de cada cliente junto con lo que gastó en total, con IVA incluido",
      },
      new Separator(),
      {
        name: "11) Facturas ordenadas por fecha",
        value: queries.billsOrderedByDateView,
        description:
          "Se necesita una vista que devuelva los datos de las facturas ordenadas por fecha",
      },
      {
        name: "12) Productos no facturados",
        value: queries.productsNotBilledView,
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
      {
        name: "14) ABM de productos",
        value: productsCRUD,
        description:
          "Permite crear nuevos productos y modificar los ya existentes. Tener en cuenta que el precio de un producto es sin IVA",
      },
    ],
  });

  // Ejecutamos la query seleccionada
  await query();
} catch {}
