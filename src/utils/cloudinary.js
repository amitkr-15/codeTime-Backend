import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" ;
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
    cosnsole.log("file is uploaded on cloudinary", response.url);
    // for unlinking the file from the localpath
   // fs.unlinkSync(localFilePath)
    return response ;
  } catch (error) {
    // remove the locally saved temporary file as the upload operation got failed 
    fs.unlinkSync(localFilePath) 
    return null ;
  }

}

export {uploadOnCloudinary}

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
// { public_id: "olympic_flag" }, 
// function(error, result) {console.log(result); });