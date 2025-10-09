import mongoose from "mongoose";

const expertSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please add a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            default: "expert",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Expert", expertSchema);
