const { logSuccess } = require("firebase-tools/lib/utils");

exports.errorHandler = (err,req,res,next) => {

    console.error( "ERROR : " , err.message) ;

    const statuscode = err.statuscode || 400 ;

    res.status(statuscode).json({
        success : false ,
        message: err.message || "Something went wrong "
    });
}