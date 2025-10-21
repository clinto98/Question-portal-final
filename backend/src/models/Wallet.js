


import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalamount: { type: Number, default: 0 }, // Lifetime earnings ledger
    balance: { type: Number, default: 0 },     // Current withdrawable balance
    transactions: [{
        amount: Number,
        type: {
            type: String,
            enum: ['payout']
        },
        description: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

export default mongoose.model('Wallet', walletSchema);