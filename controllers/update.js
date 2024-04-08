import express from 'express';
import { sanitizeInput } from '../middleware.js';
import { validationResult, check} from 'express-validator';
router.post('/',[check('').isString(), check('').isString(),check('').isString(),sanitizeInput,async(req,res)=> {
try{

    
const errors = validationResult(req);

if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
// logic goes here



}catch(error){
res.status(500).json({transaction:error})
}
}])



export default router

// use session
// get transactions of user
// dyanamically get history dates
// check if any transactions from last month is repeated 
// check for 0.0 transactions 
// encrypt jsons 
// everyday call a scheduler to look at the change in transactions


// Model idea

// Transactions
// Transactions that are 
// Is it a subscription service
// get the days for the subscription 
// check for recurring patterns on annual basis, bimonthly basis based on transactions history and internet information
// check for free trials


// Usage insights
// gather insights on how well the software users are attached usage
