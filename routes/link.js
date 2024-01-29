import express from 'express';
import { sanitizeInput } from '../middleware.js';
import 
{ generateLink, 
getRequistionAccounts,
getAccountTransactions
} from '../db/queries/linkAccount.js';
import {
    setToken
} from '../db/queries/token.js'
import { validationResult, check} from 'express-validator';

const router = express.Router();

router.post("/",[check('institutionId').isString()
,check('userId').isString(),sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }

        const {institutionId, userId } = req.body;

        // add transaction days from UI 
        const { id, link } = await generateLink(institutionId, userId); 

        req.session.requistion = id

        req.session.save((err)=> {
            if(err){
                throw new Error(err.message)
            }
            console.log('saved requsition')
            res.status(200).json({link})
        })

    }catch(error){
        res.status(500).json(error.message)
    }
   

}])


router.get("/",[check('institutionId').isString()
,check('userId').isString(),sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }

       const id =  req.session.requistion;
       const insArray = req.session.insArray

       if(!id){
            return res.status(500).json({message:'id is not defined'})
       }

       await setToken().then(async(client)=> {
            const accountsId =await getRequistionAccounts(client,id)
            const transactions = await getAccountTransactions(client,accountsId,insArray); 
            return res.status(200).json(transactions)
       })
       
    }catch(error){
        res.status(500).json({error})
    }
   

}])

export default router