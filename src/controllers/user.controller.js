import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    //  SAVING THE TOKEN IN THE DB 
    // VALIDATEBEFORESAVE IS USED TO NOT SEND THE PASSWORD I THINK 

    await user.save({validateBeforeSave : false})
    return {accessToken , refreshToken}

  } catch (error) {
    throw new ApiError(500, "something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler( async(req , res ) =>{
  // res.status(200).json({
  //   message : "ok"
  // })

/* 
    1. get user details from frontend
    2. validation - not empty 
    3. check if user already exists: username , email
    4. check for images, check for avatar .
       [ USE MIDDLEWARE    IN ROOUTES FOLDER IN REGISRATION FILE. ]
    5. upload them to cloudinary , avatar
    6. create user object - create entry in DB
    7. remove the password & refresh token field from response
    8. check for user creation 
    9. return response 
*/
    const { fullName , email , username , password } = req.body 
  
   // console.log("email :" , email);  // USE OF POSTMAN
   //console.log("password :" , password);

    // checking for required fields available or not 
    // We can use if condition for each field , but here advance if condition are use with 'some'(2-arg , return boolean) method 
   
    if(
      [ fullName , email , username , password ].some((field) => field?.trim() === "")
    ){
      throw new ApiError(400 , "All field are required")
    }

    // checking for existing username or email - it will take time to find from the DB (User). So, we use await 
   
    const existedUser = await User.findOne({
      $or: [{ username }, { email }]  // advnc operator used 
    })

    // if find exitedUser then provide error mssg

    if(existedUser){
      throw new ApiError(409, "User with email or username already exit")
    }

    // check image is available on localpath or not - we can use multer for the refrence , multer will provide the url of th file. 
    // always print req.files 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    //console.log(req.files)
    //New approach to find the cover image is available in localpath or not 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
    }

    // upload of image on cloudinary platform - it will take time . so use await

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // checking on the cloudinary 

    if(!avatar){
      throw new ApiError(400,"Avatar file is required ")
    }

    // entry in DataBase - using User model

    const user = await User.create({
      fullName ,
      avatar : avatar.url,
      coverImage : coverImage?.url || "", // not uploaded, " "
      password,
      email,
      username: username.tolowerCae()
    })

    // checking if user is created or not - using DB(already add _id)
    // after - user._id down method write 
    // removing of password & refreshToken - we use select method (we don't want to show , write in this method)

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if(!createdUser){
      throw new ApiError(500 , "something went wrong while registering the user")
    }
    
    // send to response after checking the error 

    return res.status(201).json(
      new ApiResponse(200 , createdUser , "User registered successfully !!")
    )
   
})

const loginUser = asyncHandler(async(req , res) =>{
  /*
   1. req body --> data 
   2. username or email
   3. find the user
   4. password check 
   5. access and refresh token
   6. send cookie 
   */

   //   TAKING USERNAME OR EMAIL ID TO LOGINE FROM DB
   const { username , email , password } = req.body
   //console.log(email);

   // CHECKING FOR THE ID 
    if( !username && !email)  {
        throw new ApiError(400 , "username or email is required ")
    }

    /* 
      Here is an alternative of above code based on logic discussed in video:
     if (!(username || email)) {
         throw new ApiError(400, "username or email is required")
        } 
    */

    // ACCESSING ONE ID FOR LOGIN
    const user = await User.findOne({
      // db advnc operator to find any one id 
      $or : [{username} , { email}]
      
    })
    if(!user) {
      throw new ApiError(404, "user does not exit")
    }
    //CHCKING PASSWORD IS CORRECT OR NOT
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
      throw new ApiError(401,"Invalid user credentials")
    }

    // NOW VERIFYING WITH THE ACCESS TOKEN AND REFRESH TOKEN TO LOGIN WITH THE PASSWORD by getting the id value

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // HERE COOKIES R USED , WE CAN MODIFY THE COOKIES IN THE SERVER ONLY 

    const options = {
      httpOnly : true , 
      secure : true ,
    }
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
      new ApiResponse(
        200,
        {
          user : loggedInUser , accessToken , refreshToken
        },
        "User logged In Successfully "
      )
    )

})

const logoutUser = asyncHandler (async(req , res ) =>{
  /*
    To logout , we have to 
    0. Know the user id , to remove 
    1. clear the cookies 
    2. remove the acees token from the system 
    To do that , we can inject middleware before clicking the logout button in frontend to get accessing of the token and the cookies . We can make one middleware of authentication of our  
   */
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set :{
        // THIS REMOVES THE FIELD FROM DOCUMENT
        refreshToken : undefined  
      }
    },
    {
      new : true
    }
  )
  // FOR COOKIES

  const options = {
    httpOnly : true,
    secure : true
  }
  return res 
  .status(200)
  .clearCookie("accessToken" , options)
  .clearCookie("refreshToken" , options)
  .json(
    new ApiResponse(200, {} , "User logged Out")
  )
})

export {registerUser , loginUser , logoutUser}