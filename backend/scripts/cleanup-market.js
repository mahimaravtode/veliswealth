require('dotenv/config');
const mongoose = require('mongoose');
const { WATCHLIST_SYMBOLS } = require('../dist/services/marketService');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('marketmovers');
  const result = await col.deleteMany({ symbol: { $nin: WATCHLIST_SYMBOLS } });
  console.log('Deleted stale records:', result.deletedCount);
  const indices = await col.find({ type: 'Index' }).toArray();
  console.log('Indices remaining:', indices.length);
  indices.forEach((i) => console.log(' ', i.symbol, '-', i.name));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
