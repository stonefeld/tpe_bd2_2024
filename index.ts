import { MongoClient } from "mongodb";
import { createClient } from 'redis';

// Replace the uri string with your connection string.
const uri = "<connection string uri>";
const mongo = new MongoClient(uri);

// Redis Connection
const client = createClient();

client.connect().catch(err => console.log('Redis Client Error', err));

// MongoDB Example
async function run() {
  try {
    const database = mongo.db('sample_mflix');
    const movies = database.collection('movies');
    // Query for a movie that has the title 'Back to the Future'
    const query = { title: 'Back to the Future' };
    const movie = await movies.findOne(query);
    console.log(movie);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongo.close();
  }
}

run().catch(console.dir);

// Redis Example

await client.set('key', 'value');
const value = await client.get('key');

await client.hSet('user-session:123', {
    name: 'John',
    surname: 'Smith',
    company: 'Redis',
    age: 29
})

let userSession = await client.hGetAll('user-session:123');
console.log(JSON.stringify(userSession, null, 2));