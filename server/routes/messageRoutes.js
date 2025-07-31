import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, deleteMessage, editMessage } from "../controllers/messageController.js";
import User from "../models/User.js";

const messageRouter=express.Router();

messageRouter.get("/users",protectRoute,getUsersForSidebar);
messageRouter.get("/:id",protectRoute,getMessages);
messageRouter.put("/mark/:id",protectRoute,markMessageAsSeen);
messageRouter.post("/send/:id",protectRoute,sendMessage);

//new routes for editing and deleting the messages from chat area

// New routes
messageRouter.delete("/:id", protectRoute, deleteMessage); // Delete message
messageRouter.put("/edit/:id", protectRoute, editMessage); // Edit message

export default messageRouter;

