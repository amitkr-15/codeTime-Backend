import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// USING DB FOR FINDING THE USER ID (after User dot something is db mmethod to done some operation )

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    //  SAVING THE TOKEN IN THE DB
    // VALIDATEBEFORESAVE IS USED TO NOT SEND THE PASSWORD I THINK

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
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
  const { fullName, email, username, password } = req.body;

  console.log("email :", email); // USE OF POSTMAN
  //console.log("password :" , password);

  // checking for required fields available or not
  // We can use if condition for each field , but here advance if condition are use with 'some'(2-arg , return boolean) method

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  // checking for existing username or email - it will take time to find from the DB (User). So, we use await

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // advnc operator used
  });

  // if find exitedUser then provide error mssg

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exit");
  }

  // check image is available on localpath or not - we can use multer for the refrence , multer will provide the url of th file.
  // always print req.files

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  console.log(req.files);
  // fixing for the empty coverimage , if user send
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload of image on cloudinary platform - it will take time . so use await

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // checking on the cloudinary

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required ");
  }

  // entry in DataBase - using User model

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // not uploaded, " "
    password,
    email,
    username: username.tolowerCae(),
  });

  // checking if user is created or not - using DB(already add _id)
  // after - user._id down method write
  // removing of password & refreshToken - we use select method (we don't want to show , write in this method)

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  // send to response after checking the error

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully !!"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
   1. req body --> data 
   2. username or email
   3. find the user
   4. password check 
   5. access and refresh token
   6. send cookie 
   */

  //   TAKING USERNAME OR EMAIL ID TO LOGINE FROM DB
  const { username, email, password } = req.body;
  //console.log(email);

  // CHECKING FOR THE ID
  if (!username && !email) {
    throw new ApiError(400, "username or email is required ");
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
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exit");
  }
  //CHCKING PASSWORD IS CORRECT OR NOT
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // NOW VERIFYING WITH THE ACCESS TOKEN AND REFRESH TOKEN TO LOGIN WITH THE PASSWORD by getting the id value

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // HERE COOKIES R USED , WE CAN MODIFY THE COOKIES IN THE SERVER ONLY

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully "
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
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
      $set: {
        // THIS REMOVES THE FIELD FROM DOCUMENT
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  // FOR COOKIES

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // WE CAN TAKE REFRESH TOKEN FROM THE COOKIES , OR PORVIDED BY THE USER IN DATABASE - using to terminate

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    // CHECKING PRESENT AND STORE REFRESH TOKEN
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, " Invalid refresh token");
    }

    // if  new token and user token are not equal then throw error

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    //  to generate new token

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAcccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, " All fields are required");
  }
  // NOW UPDATING THE FULLNAME AND EMAIL BY USING DB METHODS

  const user = await user
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName: fullName,
          email: email,
        },
      },
      { new: true }
    )
    .select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successlly"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // WE CAN USE MIDDLEWARE TO GET THE URL OF THE AVATAR / DP

  const avatarLocalPath = req.file?.path;
  // we use file not files ,one file we needed to do that

  if (!avatarLocalPath) {
    throw new ApiError(200, "Avatar file is missing");
  }
  // TO UPLOAD THE FILE WE NEED PATH OF THE AVATAR
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading an avatar");
  }
  // NOW UPDATING THE AVATAR IN THE USER ID

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));

  // TO DELETE THE OLD AVATAR
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missign");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(200, "Error while uploading a cover Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image upload successfully"));
});

// HERE DB AGGREGATION PIPELINES ARE USED TO DO SOME LOGIC (how we can know how much subscriber have in channel )

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, " Username is missing");
  }
  // TO USE AGGREATE PIPELINE

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.tolowerCae(),
      },
    },
    // to know the how much subscriber is , we can check the channel connect to a user (we can count the channel to whom the user have subscriber)
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscibedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAcccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
