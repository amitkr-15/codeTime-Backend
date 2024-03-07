import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// recheck the import statement , always approach the extension in file name of import 

const connectDB = async() =>{
  try {
    // we should actually see what is printing in the connectionInstance
   const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

   console.log(`\n MongoDB connected  !! DB HOST: ${connectionInstance.connection.host}`);
 } catch (error) {
    console.log("MONGODB connection FAILED" , error);
    process.exit(1);
    // node.js provide process to exit the function . we can use instead of throw here
    
  }
}
export default connectDB ;