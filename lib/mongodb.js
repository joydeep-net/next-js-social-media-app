import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'socialapp';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  directConnection: true,
};

let clientPromise;

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      // Reset so next call retries the connection
      global._mongoClientPromise = null;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

clientPromise = getClientPromise();

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export default clientPromise;
