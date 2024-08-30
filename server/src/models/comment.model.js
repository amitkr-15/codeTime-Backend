import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content : {
      type : String,
      required : true
    },
    video : {
      type: Schema.Types.ObjectId,
      ref : "Video"
    },
    commenton: {
      type: String,
      enum: ['Video', 'Tweet'],
      required: true
  },
    postId: {
      type: Schema.Types.ObjectId,
      required: true
  },
    owner : {
      type : Schema.Types.ObjectId,
      ref : "User"
    }

  },{timestamps:true})

  commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)