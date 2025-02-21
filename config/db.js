const mongoose = require("mongoose");

const connectDB = async () => {

  if (!process.env.DATABASE_URL) {
    console.error(" --- ## --- MONGODB_URI is not set in env --- ## ---");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
