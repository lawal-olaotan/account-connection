import express from 'express';
import { sanitizeInput } from '../middleware.js';
import 
{ generateLink, 
getRequistionAccounts,
getAccountTransactions,
saveRequistion
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

        req.session.save(async(err)=> {
            if(err){
                throw new Error(err.message)
            }
            await saveRequistion(id,userId).then(()=> {
                console.log('saved requsition')
                res.status(200).json({link})
            })

        })

    }catch(error){
        res.status(500).json(error.message)
    }
   

}])


router.get("/",[check('country').isString(),sanitizeInput,
async(req,res)=> {
    try{
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }

      const id =  req.session.requistion;
       const { country }= req.query

       if(!id){
            return res.status(500).json({message:'session is not defined'})
       }

       await setToken().then(async(client)=> {
            const accountsId =await getRequistionAccounts(client,id)
            const transactions = await getAccountTransactions(client,accountsId,country); 
            return res.status(200).json(transactions)

       })
       
    }catch(error){
        res.status(500).json({error})
    }
   

}])

// TODO implment delete using webhooks when user subscriptions expire
// router.get("/delete", async(res,req)=> {


// })

export default router