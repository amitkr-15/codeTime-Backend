import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from 'dotenv'

//cookie parser r used to store some data - crud operation can perform by server only
// cors we know that it will give error , while connecting to the db . So, there we use proxy concept 

const app = express()
dotenv.config({
  path: "./env"
})
const corsarry = [
  process.env.CORS_ORIGIN1,
  process.env.CORS_ORIGIN2,
  process.env.CORS_ORIGIN3,
]

app.use(cors({
  // origin: process.env.CORS_ORIGIN,
  // credentials: false
  origin: corsarry,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true, // Allow credentials
  preflightContinue: false,
  optionsSuccessStatus: 204
  // read about cors or cridentials or whitelisting 
}))

// setting for data - limit for json data ( we r accepting data from various source like URL )

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.get("/checkhealthstatus", healthcheck);

// ROUTES IMPORT 
import userRouter from "./routes/user.routes.js"
import TweetsRouter from "./routes/tweets.routes.js"
import Videorouter from "./routes/video.routes.js"
import LikeRouter from "./routes/like.routes.js"
import CommentRouter from "./routes/comments.routes.js"
import PlaylistRouter from "./routes/playlist.routes.js"
import SubscriptionRouter from "./routes/subscription.routes.js"
import { healthcheck } from "./controllers/healthcheck.controller.js"
import globalsearchRouter from "./routes/globalsearch.routes.js";


// routes declaration
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/tweets", TweetsRouter);
app.use("/api/v1/videos", Videorouter);
app.use("/api/v1/like", LikeRouter)
app.use("/api/v1/comment", CommentRouter);
app.use("/api/v1/playlist", PlaylistRouter);
app.use("/api/v1/subscriptions", SubscriptionRouter);
app.use("/api/v1/search", globalsearchRouter);

//eg :- http://localhost:8000/users/login

export {app}