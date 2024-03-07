// we are overwriting the ERROR provided by the node package 

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something is went wrong",
    errors = [],
    statck= ""
  ){
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors

    // stack is avialable or not , we use this to find where is the  error 
    
    if(statck){
      this.stack = statck
    }else{
      Error.captureStackTrace(this , this.constructor)
    }
    
  }
}

export {ApiError}