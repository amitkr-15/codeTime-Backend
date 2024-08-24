import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

// we can use aggregation concept to uuse as plugin

const videoSchema = new Schema(
  {
    videoFile :{
      type : String , // cloudinary url
      required : true
    },
    thumbnail : {
      type : String , // cloudinary url
      required : true
    },
    title : {
      type : String,
      required : true 
    },
    decription :{
      type : String,
      required : true
    },
    duratin :{
      type : Number,
      required :true 
    },
    views :{
      type : Number,
      default : 0
    },
    isPublished :{
      type: Boolean,
      default : true 
    },
    owner : {
      type : Schema.Types.ObjectId,
      ref  : "User"
    }
  },
  {
    timestamps: true 
  }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema)