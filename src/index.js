import { MongoClient } from "mongodb";
import { createClient } from 'redis';

// Replace the uri string with your connection string.
const url = "mongodb://localhost:27017";
const mongo = new MongoClient(url);

// Redis Connection
const redis = createClient();

// 1. Obtener los datos de los clientes junto con sus teléfonos. 
async function clientAndCellphones() {
  try {
    await mongo.connect().catch(err => console.log('Mongo Client Error', err));
    const database = mongo.db('db2');
    const clients = database.collection('clients');

    const result = await clients.find({}).toArray();

    for (const client of result) {
      const data = JSON.stringify(client);
      await redis.set(`clients:${data.nro_cliente}`, data);
    }

    // TODO: Revisar si agregamos al set clients:names:<nombre> = id

    console.log(result);

  } finally {
    await mongo.close();
  }
}

clientAndCellphones().catch(console.dir);

// 2. Obtener el/los teléfono/s y el número de cliente del cliente con nombre “Jacob” y apellido “Cooper”.
async function findJacobCooper() {
  try {
    // Busco en Redis
    redis.connect().catch(err => console.log('Redis Client Error', err));

    let clientID = await redis.get('clients:names:JacobCooper');
    
    if (!clientID) {
      await mongo.connect().catch(err => console.log('Mongo Client Error', err));
      const database = mongo.db('db2');
      const clients = database.collection('clients');

      const projection = { _id: 1 };
      const result = await clients.findOne({ nombre: 'Jacob', apellido: 'Cooper' }, { projection });
      if (result) {
        clientID = result._id;
        await redis.set('clients:names:JacobCooper', clientID);
      } else {
        console.log('No se encontró el cliente');
        return;
      }
    }

    let client = await redis.get(`clients:${clientID}`);
    data = JSON.stringify(client);
     result = { _id: data.nro_cliente, telefonos: data.telefonos };
     
     console.log(result);
    
  } finally {
    await mongo.close();
    await redis.quit();
  }  
}

findJacobCooper().catch(console.dir);