import { WebSocketServer,WebSocket } from "ws";
import express,{Request,Response}  from "express";
import { connetDb, generateRandomId } from "./utils/config";
import { roomModel, userModel } from "./model/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
import { userAuthentication } from "./middleware/userAuth";
const app=express();
import dotenv from 'dotenv';
dotenv.config();
app.use(express.json());
app.use(cookieParser());
const wss=new WebSocketServer({port:8080});


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
            message:"User succesfully signedin"
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
            message:"User successfully signed in"
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
    try{const roomId=req.body.roomId;
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

app.post("/message",async(req:Request,res:Response)=>{
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
                        messages:message
                    }
                }
            }
        )

        res.status(200).send("message send")
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