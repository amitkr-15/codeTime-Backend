import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router()

// upload.fields - is a middleware (for file handling), used to check whether the file uploaded or not, ( Its mean injected )

router.route("/register").post(
   upload.fields([
      {
        name : "avatar", // frontend file name should be same 
        maxCount : 1
      },
      {
        name : "coverImage",
        maxCount : 1
      }
   ]),
  registerUser
  )
  router.route("/login").post(loginUser)

  //secured routes 
  router.route("/logout").post(verifyJWT , logoutUser)
  
export default router