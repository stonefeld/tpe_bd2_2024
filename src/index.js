import { select, Separator } from "@inquirer/prompts";
import * as q from "./queries.js";

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
    ],
  });

  // Ejecutamos la query seleccionada
  await query();
} catch {}
