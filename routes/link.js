import express from 'express';
import { sanitizeInput } from '../middleware.js';
import { connect, transactions, deleteRequistion } from '../controllers/link.js'
import { check } from 'express-validator';

const router = express.Router();

router.post("/", [check('institutionId').isString(), check('countryCode').isString()
    , check('userId').isString(), sanitizeInput,connect])


router.get("/", [check('country').isString(), check('id').isString()
    ,sanitizeInput ,transactions])


// TODO implement delete using stripe webhooks when user subscriptions expire
router.delete("/", deleteRequistion)

export default router