import mongoose from "mongoose";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { roomModel } from "../model/db";


dotenv.config();
export const connetDb=async()=>{
    //@ts-ignore
    await mongoose.connect(process.env.CONNECTION_STRING);
}



export const generateRandomId:any=async()=>{
    let roomId=uuidv4();
    const room=await roomModel.findOne({
        roomId
    });
    if(!room){
        return roomId;
    }else{
        return generateRandomId();
    }
}