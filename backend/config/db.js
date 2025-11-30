const connectDB = async (mongoose) => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trading-system';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
