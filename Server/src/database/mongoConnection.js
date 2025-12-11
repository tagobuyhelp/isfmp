import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`);

        console.log("MongoDB connection Successfully...");
    } catch (err) {
        console.error("MondoDb connection Failed", err)
        process.exit(1)
    }
}




export default connectDB

