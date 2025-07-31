import { Children, createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext=createContext();

export const ChatProvider = ({ children }) =>{

    const [messages,setMessages] = useState([]);
    const [users,setUsers]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({});

    const {socket, axios }=useContext(AuthContext);
    

    // function to all users for sidebar
    const getUsers = async () => {
        try {
            const {data} =await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            //toast.error(error.message)
            toast.error(error?.response?.data?.message || error.message || "Failed to load users");
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to send message to selected user
    const sendMessage = async (messageData) => {
                if (!selectedUser) {
            toast.error("No user selected! Cannot send a message.");
            return;
        }
        try {
            //console.log("Seleted user : ",selectedUser);
            //console.log("Reciver ID", selectedUser?._id)
            
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
            if(data.success){
                setMessages((prevMessages) => [...prevMessages,data.newMessage])
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }        
    }

    //function to subscribe to messages for selected user
    const subscribeToMessages=async () => {
        if(!socket) return;
        //if(!socket || !socket.connected) return;

        socket.on("newMessage",(newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen=true;
                setMessages((prevMessages)=> [...prevMessages,newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    //function to unscribe from messages
    const unsubscribeMessages=()=>{
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        //console.log("selected user Changed ",selectedUser);
        subscribeToMessages();
        return ()=> unsubscribeMessages();
    },[socket, selectedUser])

    const value={
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}