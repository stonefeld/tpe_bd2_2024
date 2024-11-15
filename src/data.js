import { loadCSVData } from "./utils.js";

async function generateFacturas() {
  try {
    const facturas = await loadCSVData("./datasets/e01_factura.csv");
    const detalles = await loadCSVData("./datasets/e01_detalle_factura.csv");

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

async function generateClientes() {
  try {
    const clientes = await loadCSVData("./datasets/e01_cliente.csv");
    const telefonos = await loadCSVData("./datasets/e01_telefono.csv");

    const result = clientes.map((cliente) => {
      const telefonosCliente = telefonos.filter(
        (telefono) =>
          parseInt(telefono.nro_cliente) === parseInt(cliente.nro_cliente)
      );
      return {
        nro_cliente: parseInt(cliente.nro_cliente),
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        direccion: cliente.direccion,
        activo: parseInt(cliente.activo),
        telefonos: telefonosCliente.map((telefono) => ({
          codigo_area: parseInt(telefono.codigo_area),
          nro_telefono: parseInt(telefono.nro_telefono),
          tipo: telefono.tipo,
        })),
      };
    });

    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function generateProductos() {
  try {
    const productos = await loadCSVData("./datasets/e01_producto.csv");

    const result = productos.map((producto) => ({
      codigo_producto: parseInt(producto.codigo_producto),
      marca: producto.marca,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: parseFloat(producto.precio),
      stock: parseInt(producto.stock),
    }));

    return result;
  } catch (err) {
    console.error("Error:", err);
  }
}

async function insertClientRedis(cliente, redis) {
  const keyId = `clientes:${cliente.nombre}${cliente.apellido}`;
  const keyClient = `clientes:${cliente.nro_cliente}`;

  await redis.set(keyId, cliente.nro_cliente);

  if (!(await redis.exists(keyClient))) {
    const clienteCopy = { ...cliente };
    const telefonos = clienteCopy.telefonos;
    delete clienteCopy.telefonos;

    await redis.hSet(keyClient, clienteCopy);
    for (const [index, telefono] of telefonos.entries()) {
      const key = `clientes:${clienteCopy.nro_cliente}:telefonos:${index}`;
      await redis.hSet(key, telefono);
    }
  }
}

export {
  generateFacturas,
  generateClientes,
  generateProductos,
  insertClientRedis,
};
