import express from "express";
import "dotenv/config";
import cors from "cors";
import http from 'http';
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRouters.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";


//create express app and HTTP server
const app=express();
const server=http.createServer(app);

//Initilize socket.io server
export const io=new Server(server,{
    cors:{origin:"*"}
});

//Store online users
export const userSocketMap={};

//Socket.io connection handler
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId;
    console.log("User Connected",userId);

    if(userId) userSocketMap[userId]=socket.id;
    //userSocketMap.map((e)=>{console.log(e);


    //Emit online user to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Dissconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
    
})

//userSocketMap.map((e)=>{console.log(e)});

//Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

//Route setup
app.use("/api/status",(req,res)=> res.send("server is live"));
app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter);

//connect to mongodb
await connectDB();

//Running the server in local server in vercel server not avaliable then it run in local server
if(process.env.NODE_ENV !== "production"){
    const PORT =process.env.PORT || 5000;
    server.listen(PORT,()=>console.log("server is running on PORT : "+ PORT));
}


//export server for vercel
export default server;