import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

//cookie parser r used to store some data - crud operation can perform by server only
// cors we know that it will give error , while connecting to the db . So, there we use proxy concept 

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: false
}))

// setting for data - limit for json data ( we r accepting data from various source like URL )

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


export {app}