import express from 'express';
import updateTransactions from '../controllers/update.js'
const router = express.Router()



router.post('/',updateTransactions)

export default router