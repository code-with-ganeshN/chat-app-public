import Message from "../models/Message.js";
import { login } from "./userController.js";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import { io,userSocketMap } from "../server.js";
import User from "../models/User.js";
import mongoose from "mongoose";


//get all users except the logged in user
export const getUsersForSidebar=async(req,res)=>{
    try {
        const userId=req.user._id;
        const filteredUsers=await User.find({_id:{$ne:userId}}).select("-password");

        //count number of messages not sceen
        const unseenMessages={}
        const promises=filteredUsers.map(async(user)=>{
            const messages=await Message.find({senderId:user._id,receiverId:userId,seen:false})
            if(messages.length>0){
                unseenMessages[user._id]=messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
}

//get all messages for selected user

export const getMessages=async(req,res)=>{
    try {
        const{id:selectedUserId}=req.params;
        const myId=req.user._id;

        const messages=await Message.find({
            $or: [
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

        res.json({success:true,messages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})        
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen=async(req,res)=>{
    try {
        const{id} =req.params;
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})  
    }
}



// Delete Message endpoint
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }
    // Only allow deletion if the authenticated user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.json({ success: false, message: "Unauthorized to delete this message" });
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Edit Message endpoint
export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }
    // Only allow editing if the authenticated user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.json({ success: false, message: "Unauthorized to edit this message" });
    }
    if (!text || text.trim() === "") {
      return res.json({ success: false, message: "Message text cannot be empty" });
    }
    message.text = text;
    await message.save();
    res.json({ success: true, updatedMessage: message });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};


// send message to selected user
export const sendMessage=async(req,res)=>{
    try {
        const {text,image}=req.body;
        const receiverId=req.params.id;

        console.log("Reciver ID",receiverId);
        
        const senderId=req.user._id;
        
        console.log("Sender ID",senderId);

        let imageUrl;
        if(image){
            const uploadResponse=await cloudinary.uploader.upload(image)
            imageUrl=uploadResponse.secure_url;
        }
        const newMessage=await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })

        // Emit the new message to the reciver's socket
        const receiverSocketId=userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.json({success:true,newMessage})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
                
    }
}
