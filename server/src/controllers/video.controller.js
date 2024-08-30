import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})
const getvideobytags = asyncHandler(async (req, res) => {
    const { tags, thisvideo } = req.body;
    if (!tags) {
        return res.status(401).json(new ApiError(401, {}, "Please provide at least one tag"));
    }
    const tagsArray = tags.split(',').map(tag => tag.trim());

    const { q, limit, page } = req.query;
    let sortOption = {};
    if (q === "newestfirst") {
        sortOption = { createdAt: -1 };
    } else if (q === 'oldestfirst') {
        sortOption = { createdAt: 1 };
    }

    const pageNumber = parseInt(page) || 1;
    const limitOptions = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitOptions;

    try {
        const aggregationPipeline = [
            {
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(thisvideo) },
                    tegs: {
                        $regex: tagsArray.join('|'),
                        $options: 'i'
                    },
                    isPublished: true
                }
            },
            { $sort: sortOption },
            { $skip: skip },
            { $limit: limitOptions },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            { $unwind: "$ownerDetails" },
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

        const totalVideos = await Video.countDocuments({
            _id: { $ne: new mongoose.Types.ObjectId(thisvideo) },
            tags: {
                $regex: tagsArray.join('|'),
                $options: 'i'
            },
            isPublished: true
        });
        const totalPages = Math.ceil(totalVideos / limitOptions);

        return res.status(200).json(new ApiResponse(200, {
            page: pageNumber,
            limit: limitOptions,
            totalPages,
            totalVideos,
            videos
        }, "Videos Fetched Successfully"));
    } catch (error) {
        console.error('Error fetching videos:', error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error Please Try Again"));
    }

});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    getvideobytags,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}