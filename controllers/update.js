import {getRequisitionByUser,updateRequistionById} from '../db/queries/requistion.js';
import { saveSubscriptions} from '../db/queries/subscription.js';
import { setToken } from '../db/queries/token.js';
import { utils } from '../helpers/update.js';
import { getAccountTransactions, processMultipleAccounts } from '../helpers/transactions.js'
import { getRequistionAccounts} from '../helpers/link.js'
import { scheduleTrialReminder } from '../helpers/subscription.js'


const updateTransactions = async(req,res)=> {

    try{

        const {userId,institutionId,id} = req.body;
        const util = utils();

        const requistion = await getRequisitionByUser(userId,institutionId)
        if(!requistion) return res.status(209).json({transaction:false})

        const {createdAt, transaction} = requistion;

        const isRequistionActive = util.checkRequisitionStatus(createdAt);

        if(!isRequistionActive){
            await util.manageRequistionUpdate(id,userId,institutionId)
            return res.status(209).json(true)
        }

        const client = await setToken(); 
        const accountsId = await getRequistionAccounts(client, id)
        if(!accountsId.length) return res.status(409).json({transaction:false});
        
        
        const { saas, recent} = accountsId.length > 1 ? await processMultipleAccounts(client, accountsId) : await getAccountTransactions(client, accountsId[0]);

    
        const newSaas = detectNewTransaction(saas,transaction.saas);
        const newRecent = detectNewTransaction(recent,transaction.recent);

        if(!newSaas && !newRecent){
            await updateRequistionById(id,{lastUpdatedAt:new Date()})
            res.status(200).json({ok:true});
        }

        if(newSaas.length) await scheduleTrialReminder(newSaas)

        const trialsTurnedSubscription = checkExistingfreeTrials(recent,transaction.recent);

        const combinedSaas = [...newSaas, ...trialsTurnedSubscription, ...saas]

        await saveSubscriptions(combinedSaas, userId)
        await updateRequistionById(id,{lastUpdatedAt:new Date(),transaction:{saas:combinedSaas, recent}})

        res.status(200).json({ok:true});
        
    }catch(error){
        console.log(error)
        res.status(500).json({transaction:false})
    }
}

const detectNewTransaction = (updated, old) => {
        const  detectTransaction = updated.filter((newTranscx)=> {
            (!old.some( oldTrancx => oldTrancx.creditorName === newTranscx.creditorName))
        } )

        return detectTransaction

}

const checkExistingfreeTrials = (recent,newRecent) => {
    const freeTrialUpdate = []
    newRecent.forEach(expense => {
        recent.forEach(transaction => {
            const {creditorName,bookingDate,pattern} = transaction
            const oldDate = new Date(bookingDate)
            const newDate = new Date(expense.bookingDate)
            const currentDate = new Date();
            const transactionDiff = (newDate - oldDate) /(1000 * 3600 * 24)
            const TransactionDiffToday = (currentDate - newDate) /(1000 * 3600 * 24)
            const possibleTrialDays = [3,7,15,30,60,90]

            if(pattern === 'freeTrial' && creditorName === expense.creditorName 
            && possibleTrialDays.some(transactionDiff) && TransactionDiffToday <= 30) {
                transaction.bookingDate = expense.bookingDate
                transaction.pattern = 'monthly'
                transaction.count = 2
                freeTrialUpdate.push(transaction)
                
            }
        })
    })
    // update free trials here in DB
    return freeTrialUpdate
}

export default updateTransactions