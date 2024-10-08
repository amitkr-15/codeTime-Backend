import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema(
  {
    owner : {
      type: Schema.Types.ObjectId,
      ref : "User"
    },
    content : {
      type : String,
      required : true
    },
    coverImageURL: {
      url: {
          type: String,
          required: true,
      },
      public_id: {
          type: String,
          required: true,
      }
  },
  createdBy: {
      _id: {
          type: Schema.Types.ObjectId,
          ref: "User",
      },
      username: {
          type: String
      },
      profileimg: {
          type: String
      }
  },
  },
  {timestamps:true})

export const Tweet = mongoose.model("Tweet", tweetSchema)