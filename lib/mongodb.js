import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'socialapp';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client = null;
let clientPromise = null;

async function getClientPromise() {
  if (clientPromise) {
    return clientPromise;
  }

  client = new MongoClient(uri, options);
  clientPromise = client.connect();

  // Reset on error so next request creates a fresh connection
  clientPromise.catch(() => {
    client = null;
    clientPromise = null;
  });

  return clientPromise;
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}

export default getClientPromise;
