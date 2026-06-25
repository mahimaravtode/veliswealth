const mongoose = require('mongoose');
const MarketMover = require('./backend/models/MarketMover');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/velis-wealth');
  const count = await MarketMover.countDocuments();
  console.log('Total documents:', count);
  
  const all = await MarketMover.find().limit(5);
  console.log('Sample documents:', JSON.stringify(all, null, 2));

  const circuits = await MarketMover.find({ circuitHit: { $ne: 'None' } });
  console.log('Circuits hit count:', circuits.length);
  
  await mongoose.disconnect();
}
run();
