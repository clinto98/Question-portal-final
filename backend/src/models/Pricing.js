import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
    MAKER: {
        APPROVED_DIFFICULTY_0: { type: Number, required: true, default: 4 },
        APPROVED_DIFFICULTY_1: { type: Number, required: true, default: 6 },
        REJECTED_PENALTY: { type: Number, required: true, default: -2 },
        FALSE_REJECTION_COMPENSATION: { type: Number, required: true, default: 2 },
    },
    CHECKER: {
        REVIEW: { type: Number, required: true, default: 3 },
    },
});

// Create a single document for pricing
pricingSchema.statics.getSingleton = async function () {
    let pricing = await this.findOne();
    if (!pricing) {
        pricing = await this.create({});
    }
    return pricing;
};

const Pricing = mongoose.model('Pricing', pricingSchema);

export default Pricing;