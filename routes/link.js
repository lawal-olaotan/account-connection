import express from 'express';
import { sanitizeInput } from '../middleware.js';
import 
{
saveRequistion,
getRequisitionByUser,
removeRequisitionsById,
updateRequisitionConnection
} from '../db/queries/requistion.js';
import {
    setToken
} from '../db/queries/token.js'
import { validationResult, check} from 'express-validator';
import {  generateLink,} from '../helpers/link.js'
import {  getAccountTransactions  } from '../helpers/transactions.js'
import { getRequistionAccounts, deleteRequstionById } from '../helpers/link.js'

const router = express.Router();

router.post("/",[check('institutionId').isString(), check('countryCode').isString()
,check('userId').isString(),sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array()});
          }

        const {institutionId, userId, countryCode} = req.body;

        console.log(userId);


        // checks if institution Id is already saved with userId
        const isRequistionRegistered = await getRequisitionByUser(userId,institutionId);

        if(isRequistionRegistered){
            const { link } = isRequistionRegistered
            if(!link)  return res.status(209).json({link:false});
            return res.status(200).json({link}); 
        } 

        // add transaction days from UI 
        const { id, link } = await generateLink(institutionId,countryCode,userId); 

        await saveRequistion(id,userId,institutionId,link).then(()=> {
            console.log('saved requsition')
            res.status(200).json({link})
        })

    }catch(error){
        console.log(error)
        res.status(500).json(error.message)
    }
}])


router.get("/",[check('country').isString(),check('id').isString()
,sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { country, id } = req.query
        
        if(!id) return res.status(409).json({message:'session is not defined'})

        const client = await setToken()
        const accountsId = await getRequistionAccounts(client, id)
        // 
        if(!accountsId.length) return null 
        
        const transactionLength = "90";
        const transaction = await getAccountTransactions(client,accountsId,country,transactionLength)
        // encrypt transactions
        await updateRequisitionConnection(id,transaction[0]);

        res.status(200).json(transaction);
        
    }catch(error){
        res.status(500).json({transaction:error})
    }
}])


// TODO implement delete using stripe webhooks when user subscriptions expire
router.delete("/", async(req,res)=> {

    try{
        const { id } = req.body;
        await deleteRequstionById(id).then(async()=> {
            await removeRequisitionsById(id)
            res.status(200).json({ok:true})
        })
    
    }catch(error){
        console.log(error.message)
        res.status(500).json({ok:false})
    }

})

export default router