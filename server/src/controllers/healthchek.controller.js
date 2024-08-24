
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        const totalUser = await User.countDocuments({});
        const totallike = await like.countDocuments({});
        const totalComments = await Comment.countDocuments({});

        // Aggregate total views from all videos
        const totalViewsResult = await Video.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }
                }
            }
        ]);

        const totalViews = totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

        return res.status(200).json(new ApiResponse(200, {
            Stateofwholeapp: {
                totalComments,
                totalUser,
                totallike,
                totalViews
            },
        }, "Health :: All System Is Good And Thanks To Hitesh Sir For This Series #ChaiaurCode"));
    } catch (error) {
        console.error('Error in health check:', error);
        return res.status(500).json(new ApiError(500, {}, "Internal Server Error"));
    }
})

export {
    healthcheck
    }
    
