import express from 'express';
import { getWallet } from '../controllers/walletController.js';
import { protect } from '../middlewares/authmiddleware.js';

const router = express.Router();

router.get('/', protect, getWallet);

export default router;