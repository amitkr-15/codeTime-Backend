import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deletefromcloudinary } from "../utils/cloudinary.js";
import verifypostowner from "../utils/checkforpostowner.js";
import { like } from "../models/like.model.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    try {
        // Check if profile image file exists
        const profileImgPath = req.files?.tweetthumbnail?.[0]?.path;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json(new ApiError(400, {}, "Please Add Atleat Some Words To tweet"));
        }
        if (!profileImgPath) {
            return res.status(400).json(new ApiError(400, {}, "Profile image is required"));
        }

        // Upload image to Cloudinary
        const uploadedImage = await uploadOnCloudinary(profileImgPath);
        if (!uploadedImage) {
            return res.status(500).json(new ApiError(500, {}, "Failed to upload image"));
        }

        const blog = await Tweet.create({
            content,
            coverImageURL: {
                url: uploadedImage.url,
                public_id: uploadedImage.public_id
            },
            createdBy: {
                _id: req.user._id,
                username: req.user.username,
                profileimg: req.user.avatar.url,
            },
        });

        if (!blog) {
            return res.status(501).json(new ApiError(501, {}, "Something Went Wrong While Posting Tweet"));
        }

        return res.status(201).json(new ApiResponse(201, blog, "Successfully Uploaded Tweet"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, {}, `Server Error :: ${error}`));
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const _id = req.params.id;
    try {
        const blog = await Tweet.findById(_id);

        if (!blog) {
            return res.status(404).json(new ApiError(404, {}, "Your Requested Tweet Is Not Found"));
        }

        const likeCount = await like.countDocuments({ comment: _id })
        let likebyuserstate = false;
        if (req.user) {
            // Check if the user has liked the video
            const getlikebyuserstate = await like.findOne({ comment: _id, likedBy: req.user._id });
            likebyuserstate = !!getlikebyuserstate; // Convert to boolean
        }
        return res.status(200).json(new ApiResponse(200, { blog, likeCount, likebyuserstate }, "Tweet Fetched Successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const _id = req.params.id;

    try {
        const lastblog = await Tweet.findById(_id);
        if (!lastblog) {
            return res
                .status(404)
                .json(new ApiError(404, {}, "This Tweet Not Found"));
        }

        // check the owner and current user is same or not 
        const verifyowner = verifypostowner(lastblog.createdBy._id, req.user._id)

        if (!verifyowner) {
            return res.status(401).json(new ApiError(401, {}, "You Are Not The Owner Of This Blog"))
        }

        const profileImgPath = req.files?.tweetthumbnail?.[0]?.path;
        const { content } = req.body;

        // Initialize blogsdata with the necessary fields
        const blogsdata = {
            content,
            createdBy: {
                _id: req.user._id,
                username: req.user.username,
                profileimg: req.user.avatar.url,
            }
        };

        if (profileImgPath) {
            const uploadedImage = await uploadOnCloudinary(profileImgPath);

            if (!uploadedImage) {
                return res.status(500).json(new ApiError(500, {}, "Failed to upload image"));
            }

            if (lastblog && lastblog.coverImageURL && lastblog.coverImageURL.public_id) {
                await deletefromcloudinary(lastblog.coverImageURL.public_id);
            }

            blogsdata.coverImageURL = {
                url: uploadedImage.url,
                public_id: uploadedImage.public_id
            };
        }

        const updatedblog = await Tweet.findByIdAndUpdate(_id, blogsdata, { new: true });

        if (!updatedblog) {
            return res.status(404).json(new ApiError(404, {}, "Tweet Not Found"));
        }

        return res.status(200).json(new ApiResponse(200, updatedblog, "Tweet Edited Successfully And Updated"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const _id = req.params.id;

    try {
        // checking for user then 
        const lastblog = await Tweet.findById(_id);
        if (!lastblog) {
            return res
                .status(404)
                .json(new ApiError(404, {}, "This Tweet Not Found"));
        }

        // check the owner and current user is same or not 
        const verifyowner = verifypostowner(lastblog.createdBy._id, req.user._id)

        if (!verifyowner) {
            return res.status(401).json(new ApiError(401, {}, "You Are Not The Owner Of This Blog"))
        }

        const blogsresult = await Tweet.findByIdAndDelete(_id);
        if (!blogsresult) {
            return res.status(404).json(new ApiResponse(404, {}, "Some Error Occerd While Deleteing Video"));
        }
        const resdeletefromcloudinary = await deletefromcloudinary(blogsresult?.coverImageURL?.public_id);
        return res.status(200).json(new ApiResponse(200, {}, "Blog Deleted Successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}