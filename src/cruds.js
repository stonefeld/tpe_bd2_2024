import { input, search } from "@inquirer/prompts";
import * as queries from "./queries.js";

// Pedir datos interactivamente
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

async function pedirDatosProducto(producto) {
  const marca = await input({
    message: "Ingrese la marca del producto",
    validate: (value) => value.trim() !== "",
    default: producto?.marca,
  });

  const nombre = await input({
    message: "Ingrese el nombre del producto",
    validate: (value) => value.trim() !== "",
    default: producto?.nombre,
  });

  const descripcion = await input({
    message: "Ingrese la descripción del producto",
    validate: (value) => value.trim() !== "",
    default: producto?.descripcion,
  });

  const precio = await input({
    message: "Ingrese el precio del producto",
    validate: (value) => !isNaN(value),
    default: producto?.precio,
  });

  const stock = await input({
    message: "Ingrese el stock del producto",
    validate: (value) => !isNaN(value),
    default: producto?.stock,
  });

  return {
    marca,
    nombre,
    descripcion,
    precio,
    stock,
  };
}

// CRUD de clientes
export async function createClient() {
  const datos = await pedirDatosCliente();
  await queries.createClient(
    datos.nombre,
    datos.apellido,
    datos.direccion,
    datos.activo,
  );
}

export async function updateClient() {
  let clientes = await queries.getAllClientsByName();
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
  await queries.updateClient(
    c.nro_cliente,
    datos.nombre,
    datos.apellido,
    datos.direccion,
    datos.activo,
  );
}

export async function deleteClient() {
  let clientes = await queries.getAllClientsByName();
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

  await queries.deleteClient(c.nro_cliente);
}

// CRUD de productos
export async function createProduct() {
  const datos = await pedirDatosProducto();
  await queries.createProduct(
    datos.marca,
    datos.nombre,
    datos.descripcion,
    datos.precio,
    datos.stock,
  );
}

export async function updateProduct() {
  let productos = await queries.getAllProductsByName();
  productos = productos.map((p) => ({
    ...p,
    nombre_completo: `${p.marca} (${p.nombre})`,
  }));
  const mapper = (p) => ({
    name: p.nombre_completo,
    value: p,
    description: p.descripcion,
  });

  const p = await search({
    message: "Seleccione el producto que desea modificar",
    source: async (input) => {
      if (!input) return productos.map(mapper);
      return productos
        .filter((p) => p.nombre_completo.toLowerCase().includes(input.toLowerCase()))
        .map(mapper);
    },
  });

  const datos = await pedirDatosProducto(p);
  await queries.updateProduct(
    p.codigo_producto,
    datos.marca,
    datos.nombre,
    datos.descripcion,
    datos.precio,
    datos.stock,
  );
}
