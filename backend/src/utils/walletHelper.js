import Wallet from "../models/Wallet.js";

const updateTotalAmount = async (userId, amount) => {
    try {
        let wallet = await Wallet.findOne({ user: userId });

        if (!wallet) {
            wallet = new Wallet({ user: userId, totalamount: 0 });
        }

        wallet.totalamount += amount;

        await wallet.save();
    } catch (error) {
        console.error('Error updating wallet:', error);
    }
};

export { updateTotalAmount };