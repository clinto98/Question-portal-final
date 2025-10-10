import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
    },
    diagramUrl: {
        type: String,
        default: null,
    },
});

// Custom validator for optionSchema
optionSchema.pre('validate', function(next) {
    if (!this.text && !this.diagramUrl) {
        next(new Error('Each option must have either text or a diagram URL.'));
    } else {
        next();
    }
});

const previousQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        trim: true,
    },
    options: {
        type: [optionSchema],
        required: true,
    },
    correctAnswer: {
        type: optionSchema,
        required: true,
    },
    diagramUrl: {
        type: String,
        default: null,
    },
    referenceUrl: {
        type: String,
        default: null,
    },
    FrequentlyAsked: {
        type: Boolean,
        default: false,
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy",
        required: true,
    },
    explanation: {
        type: String,
        trim: true,
    },
    explanationImageUrl: {
        type: String,
        default: null,
    },
    keywords: {
        type: [String],
    },
    unitNo: {
        type: String,
        trim: true,
        required: true,
    },
    topic: {
        type: String,
        trim: true,
        required: true,
    },
});

// Custom validator for the main question and explanation
previousQuestionSchema.pre('validate', function(next) {
    if (!this.question && !this.diagramUrl) {
        return next(new Error('A question must have either text or a diagram URL.'));
    }
    if (!this.explanation && !this.explanationImageUrl) {
        return next(new Error('An explanation must have either text or a diagram URL.'));
    }
    next();
});

const previousPaperSchema = new mongoose.Schema(
    {
        examYear: {
            type: Number,
            required: true,
        },
        examType: {
            type: String,
            enum: ["Board", "Entrance", "Scholarship", "Other"],
            required: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        syllabus: {
            type: String,
            enum: ["CBSE", "ICSE", "State Board", "SAT", "Other"],
            required: true,
            trim: true,
        },
        standard: {
            type: String,
            enum: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
            required: true,
        },
        paperName: {
            type: String,
            required: true,
            trim: true,
        },

        sourceType: {
            type: String,
            enum: ["AI", "PDF", "Manual", "Other"],
            required: true,
            default: "Manual",
        },
        questions: {
            type: [previousQuestionSchema],
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        unit: {
            type: String,
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("PreviousQuestionPaper", previousPaperSchema);
