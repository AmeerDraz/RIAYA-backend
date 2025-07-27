// import jwt from 'jsonwebtoken'

// // doctor authintacion middillware

// const authDoctor =async (req,res,next)=>{
//     try {

//         // const {atoken}=req.headers
//         const {dtoken} = req.headers

//         if(!dtoken){
//             return res.json({success:false,message:'Not authorized Login Again'})
//         }
//         const token_decode=jwt.verify(dtoken,process.env.JWT_SECRET)
//         // req.body.userId = token_decode.id
//         req.docId = token_decode.id;
//         next()

//     }catch(error){
//         console.log(error)
//         res.json({success:false , message:error.message})
//     }
// }


// export default authDoctor


import jwt from "jsonwebtoken";

// Doctor Authentication Middleware
const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;

        if (!dtoken) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, please login again",
            });
        }

        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
        req.docId = token_decode.id;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export default authDoctor;
