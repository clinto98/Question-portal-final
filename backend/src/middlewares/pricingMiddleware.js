import Pricing from '../models/Pricing.js';

const loadPricing = async (req, res, next) => {
    try {
        const pricing = await Pricing.findOne();
        if (!pricing) {
            // If no pricing document exists, create one with default values
            const newPricing = await Pricing.create({});
            req.pricing = newPricing;
        } else {
            req.pricing = pricing;
        }
        next();
    } catch (error) {
        console.error("Error loading pricing:", error);
        res.status(500).json({ message: "Server error while loading pricing configuration." });
    }
};

export { loadPricing };
