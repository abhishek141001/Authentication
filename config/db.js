import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const mongoUri = process.env.MONGODB

const connectDb = async()=>{

    await mongoose.connect(mongoUri)
}

export default connectDb