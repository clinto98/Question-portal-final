import Wallet from '../models/Wallet.js';

const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ user: req.user.id })

        if (!wallet) {
            wallet = new Wallet({ user: req.user.id, totalamount: 0 });
            await wallet.save();
        }

        res.json(wallet);
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export { getWallet };