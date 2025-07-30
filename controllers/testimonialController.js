import testimonialModel from "../models/testimonialModel.js";
import { userModel } from "../models/userModel.js";

const addTestimonial = async (req, res) => {
    try {
        const userId = req.userId;
        const { text, title, location } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Please write your testimonial.",
            });
        }

        const testimonial = new testimonialModel({
            user: userId,
            text,
            title: title || "",
            location: location || "",
        });

        await testimonial.save();
        // Mark user as reviewed
        await setUserReviewed(userId);

        res.status(201).json({
            success: true,
            message: "Testimonial submitted successfully.",
            testimonial,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// جلب التقييمات
export const getTestimonials = async (req, res) => {
    try {
        const testimonials = await testimonialModel
            .find()
            .populate("user", "name image address")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, testimonials });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// تعديل التقييم
export const updateTestimonial = async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const userId = req.userId;
        const { text, title, location } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Testimonial text is required.",
            });
        }

        const testimonial = await testimonialModel.findById(testimonialId);

        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: "Testimonial not found.",
            });
        }

        if (testimonial.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to edit this testimonial.",
            });
        }

        testimonial.text = text;
        testimonial.title = title || testimonial.title;
        testimonial.location = location || testimonial.location;

        await testimonial.save();

        res.status(200).json({
            success: true,
            message: "Testimonial updated successfully.",
            testimonial,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Mark user as reviewed after adding a testimonial
// This function should be called after a testimonial is successfully added
const setUserReviewed = async (userId) => {
    try {
        await userModel.findByIdAndUpdate(userId, { isReviewed: true });
    } catch (err) {
        console.error("Error setting isReviewed:", err);
    }
};
export { addTestimonial };
