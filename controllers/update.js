import {getRequisitionByUser,updateExistingTransactions,insertRequistionTransactions,updateReqLastUpdated} from '../db/queries/requistion.js';
import { updateSubscriptions, saveSubscriptions } from '../db/queries/subscription.js';
import { setToken } from '../db/queries/token.js';
import { utils } from '../helpers/update.js';
import {getRequistionAccounts} from '../helpers/link.js'
import { getCreditors, detectFreeTrials,recurringPayments} from '../helpers/transactions.js';


const updateTransactions = async(req,res)=> {

    try{

        const {userId,institutionId,id} = req.body;
        const util = utils();

        const requistion = await getRequisitionByUser(userId,institutionId)
        if(!requistion) return res.status(200).json({ok:"No such requisition"})
        const {createdAt,transaction} = requistion;
        const isRequistionActive = util.checkRequisitionStatus(createdAt);

        if(!isRequistionActive){
            await util.manageRequistionUpdate(id,userId,institutionId)
            return res.status(200).json({ok:true})
        }

        const client = await setToken(); 
        const accountsId = await getRequistionAccounts(client,id)
        if(!accountsId.length) return res.status(200).json({ok:false});
        const account = client.account(accountsId);

        
        const dateFrom = computeDateFrom(createdAt);
        const dateTo = new Date().toISOString().split('T')[0];

        let { transactions} = await account.getTransactions({dateFrom,dateTo});
        const {booked,pending} = transactions
        if(!booked.length && !pending.length )return res.status(200).json({ok:true})

        const creditors  = await getCreditors(transactions);
        const recurringExpenses = await recurringPayments(creditors);

        // Detects free trials
        let trialServices = await detectFreeTrials(creditors);
        trialServices = removeExistingExpenses(trialServices,transaction);

        // Detects new subscription
        // Checks if exiting subscription comes up again in new month;
        let newExpenses = removeExistingExpenses(recurringExpenses,transaction);
        newExpenses = !newExpenses ? [] : newExpenses;

        const updatedTransactions = checkExistingSubscription(transaction,recurringExpenses,id);
        const updatedTrials = checkExistingfreeTrials(transaction,transaction);


        const oldTransactions = [...updatedTransactions,...updatedTrials]
        const newTransactions = [...trialServices,...newExpenses]

        // Use conditionals  to update the database with the new data
        if(oldTransactions.length){
            await updateExistingTransactions(id,oldTransactions)
            await updateSubscriptions(oldTransactions, userId)
        }

        if(newTransactions.length){
            await insertRequistionTransactions(id,newTransactions)
            await saveSubscriptions( newTransactions, userId)
        }

        await updateReqLastUpdated(id)

        // create Lambda function 


        res.status(200).json({ok:true});
        
    }catch(error){
        console.log(error.message)
        res.status(500).json({error:error.message})
    }
}


const computeDateFrom = (lastUpdatedAt) => {

    const date = new Date(lastUpdatedAt);

    const targetMonth = (date.getMonth() - 1)% 12
    date.setMonth(targetMonth);

    const formattedDate = date.toISOString().split('T')[0]

    return formattedDate

}


const checkExistingSubscription = (transactions,expenses,id) => {

        const updateableExpenses = []

        expenses.forEach(expense => {
            transactions.forEach(async(transaction )=> {
                const {creditorName,bookingDate,pattern,count} = transaction
                const oldDate = new Date(bookingDate)
                const newdate = new Date(expense.bookingDate)

                if(creditorName === expense.creditorName && expense.pattern === pattern
                && (oldDate.getMonth() +1) === newdate.getMonth()) {
                    transaction.count = count + 1
                    transaction.bookingDate = expense.bookingDate
                    updateableExpenses.push(transaction)
                }
            })
        })

        return updateableExpenses
}

const checkExistingfreeTrials = (transactions,creditors) => {
        const freeTrialUpdate = []
        creditors.forEach(expense => {

            transactions.forEach(transaction => {
                const {creditorName,bookingDate,pattern} = transaction
                const oldDate = new Date(bookingDate)
                const newDate = new Date(expense.bookingDate)
                const currentDate = new Date();
                const transactionDiff = (newDate - oldDate) /(1000 * 3600 * 24)
                const TransactionDiffToday = (currentDate - newDate) /(1000 * 3600 * 24)
                const possibleTrialDays = [3,7,15,30,60,90]

                if(pattern === 'freeTrial' && creditorName === expense.creditorName 
                && possibleTrialDays.includes(transactionDiff) && TransactionDiffToday <= 30) {
                    transaction.bookingDate = expense.bookingDate
                    transaction.pattern = 'monthly'
                    transaction.count = 2
                    
                }
            })
        })
        // update free trials here in DB
        return freeTrialUpdate
}

const removeExistingExpenses = (detectExpenses,oldExpenses) => {
   return detectExpenses.filter( items => !oldExpenses.some(trans => items.creditorName === trans.creditorName));
}


export default updateTransactions