import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
});


const roomSchema=new mongoose.Schema({
    roomId:{
        type:String,
        required:true
    },
    roomName:{
        type:String,
        required:true
    },
    owner:{
        type:String
    },
    users:[],
    isPrivate:{
        type:Boolean,
        default:false
    },
    chats:[
        {
            user:String,
            messages:String
        }
    ]
})

export const roomModel=mongoose.model("Room",roomSchema);
export const userModel=mongoose.model("User",userSchema);