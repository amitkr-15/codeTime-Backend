// this can work , but there is better approach 

// require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js"
import dotenv from "dotenv"

import {app} from "./app.js"

// import app from "./app.js";



dotenv.config({
  path: './env'
})

connectDB()
// when the db is connected it will give the promise , bcz we use async fun
.then(()=>{
  // before listening to db , we can write code for error 
  app.on("error" , (error) =>{
    console.log("ERRR:" ,error );
    throw error
  })
  app.listen(process.env.PORT || 8000 , () =>{
    console.log(`👽 Server is running at port : ${process.env.PORT}`);
    
  })
})
.catch((err) =>{
  console.log("MONGO db connection failed !!! " , err);
})

 /* THE FIRST APPROACH TO ADD DATABASE  */

// This is the first approach to connect database in backend . 

// 1. use asyn await , wrap the code in try catch, DB is always in another continent . so, it will take time to load the database.

//2. best approach - use exec function , best programmer write semicolon before start exec 


 /*
import mongoose from "mongoose"
import {DB_NAME} from "./constants"
import express from "express"
const app = express()

;( async () => {
  try {
   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   app.on("error" , (error) =>{
     console.log("ERRR:" ,error );
     throw error
   })
   
   app.listen(process.env.PORT, () =>{
     console.log(`App is listening on port ${process.env.PORT}`);
   })
  } catch (error) {
    console.error("ERROR:" , error)
    throw error
  }
} )()
*/