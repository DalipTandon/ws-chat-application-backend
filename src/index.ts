import { WebSocketServer,WebSocket } from "ws";
import express  from "express";
import { connetDb } from "./utils/config";
import { userModel } from "./model/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app=express();
app.use(express.json());
const wss=new WebSocketServer({port:8080});

import dotenv from 'dotenv';

dotenv.config();
app.post("/signup",async(req,res)=>{
    try{
        const {username,email,password}=req.body;   
        const hashedPassword=await bcrypt.hash(password,10);     
        const user=await userModel.create({
            username,
            password:hashedPassword,
            email
        });
        //@ts-ignore
        var token=await jwt.sign({_id:user._id},process.env.SECREAT as string,{expiresIn:"7d"})
        res.cookie("token",token)
        res.status(200).send({
            message:"User succesfully signedin"
        })

    }catch(error){
        res.status(400).send({
            message:"Error"
        })
    }
})

app.post("/signin",async(req,res)=>{
    try{
        const{username,password}=req.body;
        const user=await userModel.findOne({
            username
        })
        if(!user){
            throw new Error("User does't exists")
        }
        const checkpassword=await bcrypt.compare(password,user.password);
        if(!checkpassword){
            throw new Error("incorrect password");
        }else{
            //@ts-ignore
        var token=await jwt.sign({_id:user._id},process.env.SECREAT as string,{expiresIn:"7d"});
        res.cookie("token",token);
        res.status(200).send({
            message:"User successfully signed in"
        })
        }
    }catch(error:any){
        res.status(400).send({
            message:"Error"+error.message
        })
    }
})


interface User{
    socket:WebSocket;
    room:string
}

//  {
//     "type": "join",
//     "payload": {
//       "roomId": "123"
//     }
//  }


// {
// 	"type": "chat",
// 	"payload": {
// 		"message: "hi there"
// 	}
// }

let allSockets:User[]=[];
wss.on("connection",(socket)=>{
    console.log("user connected  # ");

    socket.on("message",(message)=>{
        //@ts-ignore
        const parsedMessage=JSON.parse(message);
        if(parsedMessage.type =="join"){
          //  console.log("room joined");
            
            allSockets.push({
                socket,
                room:parsedMessage.payload.roomId
            })
        }

        if(parsedMessage.type=="chat"){
           // console.log("ready for chat");
            
            let currentRoom=null;
            for(let i=0;i<allSockets.length;i++){
                if(allSockets[i].socket == socket){
                    currentRoom=allSockets[i].room;
                }
            }
            for(let i=0;i<allSockets.length;i++){
                if(allSockets[i].room == currentRoom){
                    allSockets[i].socket.send(parsedMessage.payload.message);
                }
            }
        }
        
    })
})



connetDb().then(()=>{
    console.log("connected to database");
    app.listen(3000,()=>{
        console.log("server started at port 3000");
        
    });
    
}).catch((err)=>{
    console.log("something went wrong");
    
})