import Wallet from '../models/Wallet.js';

const updateWallet = async (userId, amount, type, description) => {
    try {
        let wallet = await Wallet.findOne({ user: userId });

        if (!wallet) {
            wallet = new Wallet({ user: userId });
        }

        if (type === 'credit' || type === 'debit') {
            wallet.totalamount += amount;
            wallet.balance += amount;
        } else if (type === 'payout') {
            wallet.balance += amount; // amount is negative
            wallet.transactions.push({ amount: Math.abs(amount), type, description });
        }

        await wallet.save();
    } catch (error) {
        console.error('Error updating wallet:', error);
    }
};

export { updateWallet };