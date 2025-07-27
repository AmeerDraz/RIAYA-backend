
import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        title: {
            type: String,
            default: "",
        },
        text: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const testimonialModel =
    mongoose.models.Testimonial ||
    mongoose.model("Testimonial", testimonialSchema);

export default testimonialModel;
