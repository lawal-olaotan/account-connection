import express from 'express';
import { sanitizeInput } from '../middleware.js';
import 
{ generateLink, 
getRequistionAccounts,
getAccountTransactions,
saveRequistion,
getRequisitionById,
removeRequisitionsByUser,
updateRequisitionConnection
} from '../db/queries/linkAccount.js';
import {
    setToken
} from '../db/queries/token.js'
import { validationResult, check} from 'express-validator';
import { instititionQuery } from "../db/queries/names.js"

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
 

        // checks if institution Id is already saved with userId
        const isRequistionRegistered = await getRequisitionById(userId,institutionId);

        if(isRequistionRegistered){
            const { link } = isRequistionRegistered
            if(!link)  return res.status(209).json({link:false});
            return res.status(200).json({link}); 
        } 

        const db = instititionQuery()
        const { transaction_total_days } = await db.getBankById(institutionId);

        // add transaction days from UI 
        const { id, link } = await generateLink(institutionId,countryCode,transaction_total_days); 

        await saveRequistion(id,userId,institutionId,link).then(()=> {
            console.log('saved requsition')
            res.status(200).json({link})
        })

    }catch(error){
        console.log(error)
        res.status(500).json(error.message)
    }
   

}])


router.get("/",[check('country').isString(),check('requestId').isString()
,sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { country, requestId } = req.query
        if(!requestId) return res.status(409).json({message:'session is not defined'})

        const client = await setToken()
        const accountsId = await getRequistionAccounts(client,requestId)

        if(!accountsId.length) return null 
        const transaction = await getAccountTransactions(client,accountsId,country)
        // encrypt transactions
        await updateRequisitionConnection(requestId,transaction[0]);
        res.status(200).json(transaction)

                // set scheduler to update every 24 hours
                // check for all requistion regitered to a user
                
                // create process for each one and use queues if user account is more than four

                //  CORE PROCESS
                // check if access days is not execeeded 
                // if accesdays is due : send email & update requisition as non active
                

                // UPDATE REQUISTION
                // when users get new link
                // create a new endpoint called update
                // check if requistion is previously saved and check last day of access
                

                // if new transactions are found from last day of access 
                // return no update

                // if there is a transaction update
                // check if recorded recurring expenses is charged again
                //  update billing data and time and start tracking usage ()

                // check if new merchants are contained in expenses from last month 
                // check if it's a free trial period or subscription

                //if freetrial check the days for freetrial , use transaction date to calculate days left and hold in a suggested expenses collections. 
                
                // schedule a reminder two days to subscription ending. 

                //  add subscriptions to insights collections


                    
        
    }catch(error){
        res.status(500).json({transaction:error})
    }
   

}])

// TODO:
// connecting mutliple accounts at the same time
// Syncing realtime purchases
// delete users who don't pay 
// delete users who unsubcribe 




// TODO implement delete using stripe webhooks when user subscriptions expire
router.delete("/", async(req,res)=> {

    try{
        const { userId, requisitionId } = req.body;

        const userRequistions = await removeRequisitionsByUser(userId)
        res.status(200).json(userRequistions)

    }catch(error){
        res.status(500).json({error})
    }

})

export default router