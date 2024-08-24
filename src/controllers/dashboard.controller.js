import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;

    if (!channelId) {
        return res.status(400).json(new ApiError(400, {}, "Please Provide Channel ID"));
    }

    try {
        // Count the number of subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: new mongoose.Types.ObjectId(channelId) });

        // Aggregate total views, total likes, and count total videos
        const videoStats = await Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: "$likes" },
                    totalVideos: { $sum: 1 }
                }
            }
        ]);

        const stats = videoStats[0] || { totalViews: 0, totalLikes: 0, totalVideos: 0 };

        return res.status(200).json(new ApiResponse(200, {
            totalSubscribers,
            totalViews: stats.totalViews,
            totalLikes: stats.totalLikes,
            totalVideos: stats.totalVideos
        }, "Channel Stats Fetched Successfully"));

    } catch (error) {
        console.error('Error fetching channel stats:', error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;
    const { limit, page } = req.query;

    if (!channelId) {
        return res.status(400).json(new ApiError(400, {}, "Please Provide Channel ID"));
    }

    const pageNumber = parseInt(page) || 1;
    const limitOptions = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitOptions;

    try {
        const aggregationPipeline = [
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } }, // Match by channel ID and only published videos
            { $skip: skip }, // Pagination: Skip records
            { $limit: limitOptions }, // Pagination: Limit records
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            { $unwind: "$ownerDetails" }, // Unwind to get single owner details
            {
                $project: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    tittle: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    tegs: 1,
                    owner: 1,
                    ownerusername: "$ownerDetails.username",
                    owneravatar: "$ownerDetails.avatar.url",
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ];

        const videos = await Video.aggregate(aggregationPipeline);

        if (!videos.length) {
            return res.status(404).json(new ApiError(404, {}, "No Videos Found"));
        }

        const totalVideos = await Video.countDocuments({ owner: new mongoose.Types.ObjectId(channelId), isPublished: true });
        const totalPages = Math.ceil(totalVideos / limitOptions);

        return res.status(200).json(new ApiResponse(200, {
            page: pageNumber,
            limit: limitOptions,
            totalVideos,
            totalPages,
            videos
        }, "Channel Videos Fetched Successfully"));

    } catch (error) {
        console.error('Error fetching channel videos:', error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }