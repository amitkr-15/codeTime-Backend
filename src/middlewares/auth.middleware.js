import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"

//if we are not using response(res) , insted that we can write underscore(_) 

export const verifyJWT = asyncHandler(async(req , _ , next )=>{
 try {

  // CHECKING THE REFRESH TOKEN IN COOKIES , WE KNOW THAT MOBILE APPLICATION DOES'NT HAVE . SO, WE USE HEADER (IF USER PROVIDE )

   const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")
 
   // console.log(token);
   
   if(!token){
     throw new ApiError(401,"Unauthorized request")
   }
    // IF WE HAVE THE TOKEN , THEN WE CAN CHECK IT IS VALID OR NOT , BY USING JWT  

   const decodeToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
 
   const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
 
   if(!user) {
     throw new ApiError(401,"Invalid Access Token")
   }
   req.user = user;
   next()
 } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
 }
})