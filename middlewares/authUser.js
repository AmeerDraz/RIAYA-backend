import jwt from "jsonwebtoken";

// user authintacion middillware

const authUser = async (req, res, next) => {
    try {
        // const {atoken}=req.headers
        const { token } = req.headers;

        if (!token) {
            return res.json({
                success: false,
                message: "Not authorized Login Again",
            });
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        console.log("token_decode: ", token_decode);
        // req.body.userId = token_decode.id
        req.userId = token_decode.id;
        next();
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export default authUser;
