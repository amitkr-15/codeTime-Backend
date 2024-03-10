// UTILS FOLDER R USED TO ACCESS A FILE OF REGULAR USED FUNC 

// HERE PROMISE CONCEPT ARE USED 

const asyncHandler = (requestHandler) =>{
  rerurn (req , res , next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
  }
}

export {asyncHandler}



/*
 THIS METHOD USED TRY CATCH CONCEPT 


const asyncHandler = () =>{}
 const asyncHandler = (func) => {}
 const asyncHandler = (func) => async{()}=>{}
 const asyncHandler = (func) => async(extend=>{}}

const asyncHandler = (func) => async( err , req , res , next) =>{
  try{
      await fn (req , res , next)
  }
  catch(error{
    res.status(err.code || 500).json({
      success: false,
      message : err.message
    })
  }
} 
 */