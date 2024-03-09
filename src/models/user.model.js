import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'

const userSchema = new Schema(
  {
    username :{
      type: String,
      required : true,
      unique: true,
      lowercase: true,
      trim : true,
      index: true
    },
    email:{
      type: String,
      required : true ,
      unique : true,
      lowercase : true,
      trim : true,
    },
    fullName : {
      type: String,
      required : true ,
      trim : true , 
      index : true
    },
    avatar:{
      type : String, // take url from clodinary platform
      required : true ,
    },
    coverImage : {
      type : String, // cloudinary url
    },
    watchHistory : [
      {
        type : Schema.Types.ObjectId,
        ref : "Video"
      }
    ],
    password : {
      type : String ,
      required : [true , "password is required"]
    },
    refreshToken :{
      type : String,
    }
  },
  { 
    timestamps:true 
  }
)

// to gereate the encrypted password while user are login - before login we can use middleware pre to generate the . it will take time so , we use async . before saving the password we should always encrypt the password . In the arrow function , we dont have (this) context 
userSchema.pre("save" , async function(next) {

  // checking for the user, if user are modifying the password or not . let assume the user are changing the dp & then it click the save button . so , every process for saving , the password is generated . for that we uses if condition  to check password is changed by the user or not
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password , 10)
  next()
})

// custom method can design 
// we can modified the user db , by using the own method provided by the mongoose 
// we are comparing bcrypt generated password and user define password 

userSchema.methods.isPassword = async function(password){
  return await bcrypt.compare(password,this.password)
}

// jwt is bearer token . it is like  a key.

userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email : this.email,
      username: this.username,
      fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User" ,userSchema)