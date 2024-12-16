import { WebSocketServer,WebSocket } from "ws";
import express,{Request,Response}  from "express";
import { connetDb, generateRandomId } from "./utils/config";
import { roomModel, userModel } from "./model/db";
import http from 'http';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
import cors from "cors";
import { userAuthentication } from "./middleware/userAuth";
const app=express();
const server = http.createServer(app);
import dotenv from 'dotenv';
dotenv.config();
app.use(express.json());
app.use(cookieParser());
const wss=new WebSocketServer({server});

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

//singup end-point
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
            message:"User succesfully signedin",
            data:user
        })

    }catch(error){
        res.status(400).send({
            message:"Error"
        })
    }
})


//signin endpoint
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
            message:"User successfully signed in",
            data:user
        })
        }
    }catch(error:any){
        res.status(400).send({
            message:"Error"+error.message
        })
    }
})


//create room endpoint
app.post("/createroom",userAuthentication,async(req:Request,res:Response)=>{
    try{
        const{roomName,isPrivate}=req.body;
        const user=req.user.username;
        const owner=user;   
        const roomId=await generateRandomId();
        const room=await roomModel.create({
            roomName,
            roomId,
            owner,
            users:[owner],
            isPrivate
        })
        res.status(200).json({
            message:"Room created successfully",
            data:room
        })
    }catch(error:any){
        res.status(400).send({
            message:"Error :"+error.message
        })
    }
})

app.post("/joinroom",userAuthentication,async(req:Request,res:Response)=>{
    try{
        const roomId=req.body.roomId;
    const user=req.user.username;

    const isExists=await roomModel.findOne({
        roomId
    });
    if(!isExists){
        throw new Error("No room with this id exists");
    }
    const updateRoom=await roomModel.findOneAndUpdate(
        {roomId:roomId, users: {$ne: user}}, {$push: {users: user}}

    )
    res.status(200).send({
        message:"User successfully joined the room"
    })}catch(error:any){
        res.status(400).send({
            message:"Error :"+error.message
        })
    }
})
app.get("/availableroom",userAuthentication,async(req,res)=>{
    try{
        const allRoom=await roomModel.find({
            isPrivate:false
        })
        res.status(200).send({
            data:allRoom
        })

    }catch(error:any){
        res.status(400).send({
            message:"Error :"+error.message
        })
    }
})

app.post("/message",userAuthentication,async(req:Request,res:Response)=>{
    try{
        const{roomId,message}=req.body
        const user=req.user.username;
        const room = await roomModel.findOne({ roomId });
            if (!room) {
                throw new Error("room does't exists")
        }
        await roomModel.findOneAndUpdate(
            {roomId},
            {
                $push:{
                    chats:{
                        user,
                        message
                    }
                }
            }
        )
        allSockets
        .filter((userSocket) => userSocket.room === roomId)
        .forEach((userSocket) => {
            userSocket.socket.send(
                JSON.stringify({
                    type: "chat",
                    payload: { user, message },
                })
            );
        });
        res.status(200).send("message send")
    }catch(error:any){
        res.status(400).send({
            message:"Error"+error.message
        })
    }
})

app.post("/logout",userAuthentication,(req,res)=>{
    try{
        res.cookie("token",null,{expires:new Date(Date.now())})
        res.status(200).send({
            message:"Logged out successfully"
        })
    }catch(error:any){
        res.status(400).send({
            message:"Error :"+error.message
        })
    }
})

app.get("/room/:roomId",userAuthentication,async(req,res)=>{
    try{
        const roomId=req.params.roomId;
        console.log(roomId);
        
      //  const Room=roomId.toString();
        const findRoom=await roomModel.findOne({roomId});
        if(!findRoom){
            throw new Error("No room with this id exists");
        }

        res.status(200).send({
            message:"Successfully fetched room data",
            data:findRoom
        })
    }catch(error:any){
        res.status(400).send({
            message:"Error :"+ error.message
        })
    }
})
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
            interface User{
            socket:WebSocket;
            room:string
            }

let allSockets:User[]=[];
wss.on("connection",(socket)=>{
    console.log("user connected  # ");

    socket.on("message",(message)=>{
        //@ts-ignore
        const parsedMessage=JSON.parse(message.toString());
        console.log(parsedMessage.payload.message);
        
        if(parsedMessage.type =="join"){
          //  console.log("room joined");
          const { roomId } = parsedMessage.payload;
            
            allSockets.push({
                socket,
                room:roomId
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
            if (currentRoom) {
                allSockets
                    .filter((user) => user.room === currentRoom)
                    .forEach((user) => {
                        user.socket.send(
                            JSON.stringify({
                                type: "chat",
                                message: parsedMessage.payload.message,
                            })
                        );
                    });
            } else {
                console.error("Socket not in a room");
            }
        }
        
    })
    socket.on("close", () => {
        console.log("User disconnected");
        allSockets = allSockets.filter((user) => user.socket !== socket);
    });
});







connetDb().then(()=>{
    console.log("connected to database");
    server.listen(3000,()=>{
        console.log("server started at port 3000");
        
    });
    
}).catch((err)=>{
    console.log("something went wrong");
    
})