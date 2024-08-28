import {v2 as cloudinary} from 'cloudinary';

import fs from "fs" ;
import { configDotenv } from "dotenv";

configDotenv({
  path: "./.env"
})

// fs are use for filehandling . eg- write , read , upload ,delete
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// we should use try catch block for uploading the file in in cloudinary. it will take time . so , we use async func

const uploadOnCloudinary = async (localFilePath) =>{
  try {
    if(!localFilePath) return null ;
    // upload the file on cloudlinary
    const response = await cloudinary.uploader.upload(localFilePath , { resource_type : "auto"})

    //file has been uploaded successfully
    console.log("file is uploaded on cloudinary", response.url);
    // for unlinking the file from the localpath

   fs.unlinkSync(localFilePath)
   
   // console.log(response)
    return response ;

  } catch (error) {
    // remove the locally saved temporary file as the upload operation got failed 
    //console.log("In cloudinary" , error)

    fs.unlinkSync(localFilePath) 
    return null ;
  }

}


const deletefromcloudinary = async (public_id) => {
  try {
      const response = await cloudinary.uploader.destroy(public_id, { invalidate: true });
      // console.log('Delete response:', response);
      return response;
  } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
  }
};

const videodeletefromcloudinary = async (public_id) => {
  try {
      const response = await cloudinary.uploader.destroy(public_id, { 
          invalidate: true,
          resource_type: "video" 
      });
      // console.log('Delete response:', response);
      return response;
  } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
  }
};

export {uploadOnCloudinary,deletefromcloudinary ,videodeletefromcloudinary}

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
// { public_id: "olympic_flag" }, 
// function(error, result) {console.log(result); });