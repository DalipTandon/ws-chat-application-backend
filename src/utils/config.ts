import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
export const connetDb=async()=>{
    //@ts-ignore
    await mongoose.connect(process.env.CONNECTION_STRING);
}