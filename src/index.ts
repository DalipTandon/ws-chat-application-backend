import { WebSocketServer,WebSocket } from "ws";

const wss=new WebSocketServer({port:8080});

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