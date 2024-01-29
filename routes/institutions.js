/**
 * @file Defines all routes for the link route.
 */

import express from 'express';
import { setToken,getInsData} from '../db/queries/token.js';
import { sanitizeInput } from '../middleware.js';
import { validationResult, check} from 'express-validator';
import { saveBankNames } from '../db/queries/names.js';

const router = express.Router();

// change to GET request
router.get('/',[
    check('userId').trim().isString(),
    check('country').trim().isString(),
    sanitizeInput, async(req,res) => {

        try{
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
              }

            const {userId, country } = req.query;
            
            await setToken(userId, country).then(async(client)=> {

                const institutions = await getInsData(client,country)
                await saveBankNames(country,institutions)
                res.status(200).json(institutions)
            })
        }catch(error){
            res.status(500).json({error})
        }


    }  
])

export default router

