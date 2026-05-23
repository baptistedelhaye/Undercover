import express from 'express';
import { getCategories } from '../controllers/roomController.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/health', (req, res) => res.json({ success: true, message: 'Party Games backend actif' }));

export default router;
