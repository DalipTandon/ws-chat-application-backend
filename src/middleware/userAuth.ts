
import express, {Request,Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { userModel } from "../model/db"
import dotenv from 'dotenv';
dotenv.config();
declare global {
    namespace Express {
        interface Request {
            user?: any; 
        }
    }
}
export const userAuthentication=async(req:Request,res:Response,next:NextFunction):Promise<any>=>{

    try{
        const cookie=req.cookies;
        const{token}=cookie;
        if (!token) {
            return res.status(401).json({
                message: "Token expired",
            });
        }
        
        const verifyToken=await jwt.verify(token,process.env.SECREAT as string)as JwtPayload;
        
        
        if(!verifyToken){
            throw new Error("invalid token");
        }
        //@ts-ignore
        const{_id}=verifyToken;

        const user=await userModel.findById({_id});

        if(!user){
            throw new Error("User does't exists");
        }

        req.user=user;
        next();

    }catch(error:any){
        res.status(400).send(
            {
                message:"Error"+error.message
            }
        )
    }
}