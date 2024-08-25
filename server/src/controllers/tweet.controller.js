import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
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