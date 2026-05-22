const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 1. Force the driver to use the correct SRV connection logic
    // 2. Set strict timeouts to fail fast if the network is really dead
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Forces IPv4 to bypass weird Windows/Network DNS issues
    });

    console.log(`✅ MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`❌ Database Connection Fail: ${error.message}`);
    // DO NOT exit here, let's see if the app can run without DB temporarily 
    // if you are just trying to test the markets.
  }
};

module.exports = connectDB;