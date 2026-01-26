import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./Database/dbConfig.js"
import router from "./Routes/authRoute.js"
import Orgroute from "./Routes/organizerRoute.js"
import ticketRoute from "./Routes/ticketRoute.js"
import adminRoute from "./Routes/adminRoute.js"



dotenv.config()

connectDB()

const app = express()

app.use(express.json())
app.use(cors())

app.get("/", (req,res)=>{
    res.send("Welcome to Event Hub backend")
})

app.use("/api/auth", router )
app.use("/api/organizer", Orgroute )
app.use("/api/payment", ticketRoute)
app.use("/api/admin",adminRoute)


const port = process.env.port

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});