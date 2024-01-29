import { randomUUID } from "crypto";
import { setToken } from "./token.js";
import { cardlessClient } from "../../gocardless.js";



// TODO redirect url will be changed in the future for student collaboration.
export const generateLink = async(institutionId)=> {

        const client = await setToken()

        const data = await client.initSession({
            redirectUrl:"https://app.joineconome.com/connect/",
            institutionId:institutionId,
            referenceId:randomUUID(),
            accessValidForDays:30,
            accessScope:[
                'transactions',
                'details'
            ]
        })

        return data; 

}



// gets accounnt details for user 
export const getRequistionAccounts = async(client,requisitionId)=> {
    const {accounts} = await client.requisition.getRequisitionById(requisitionId);

    // if(accounts.length > 1 ){
    //     // check if user is on a premium
    //     console.log('more than one accounts')
    // }
    return accounts[0];
}


export const getAccountTransactions = async (client,accountId,insArray)=> {

    // what if accountId is greater than one 
    // TODO when case arises.

    const account = client.account(accountId);
    let {transactions} = await account.getTransactions();


    const recurringExpenses = await detectRecurringExpenses(transactions,insArray)
    return recurringExpenses


    // get .
    let mostRecentTransactions  =   await account.getTransactions(recentTransactionRange);
    mostRecentTransactions = await getCreditors(mostRecentTransactions);
    const recentTransactionRange = getDateRange(new Date(), 1)

    // remove transactions that exisit in most recent transactions from transactions array. 
    // const refinedRecentTransaction = mostRecentTransactions.filter(recentTransaction => 
    //     !transactions.some(transaction => 
    //         transaction.transactionId === recentTransaction.transactionId))

    

}

const getDateRange = async (startDate, monthRange) => {
        
    const previousMonth = new Date(startDate);
    previousMonth.setMonth(startDate.getMonth() - monthRange);
    previousMonth.setDate(1);

    const dateFrom = startDate.toISOString().split('T')[0];
    const dateTo = previousMonth.toISOString().split('T')[0];

    return ({dateFrom,dateTo})
}

const detectRecurringExpenses = async(transactions)=> {
    const  creditors = await getCreditors(transactions);



    // remove banks from payments
    // const recurrings = creditors.reduce((accumatedTransactions,firstTransaction,index,array ) => {
    //     for (let index2 = index + 1; index2 < array.length; index2++) {
    //         const transaction2 = array[index2];
    
    //         if (firstTransaction["creditorName"] === transaction2["creditorName"]) {
    //             accumatedTransactions.push([firstTransaction, transaction2]);
    //         }
    //     }
    //     return accumatedTransactions;
    // },[])

    return creditors;
}

const getCreditors = async(transactions) => {

    const { booked, pending } = transactions
    const transactionArray = [...booked, ...pending]
    const creditors = []; 


    for(let transactionIndex = 0; transactionIndex < transactionArray.length; transactionIndex++){
            const transaction = transactionArray[transactionIndex]; 
            if(("creditorName" in transaction)) creditors.push(transaction)
    }   

    return creditors; 
}

// const removeBankPayment = async(transactions)=> {
//     // get list of banks 

//     const banksArray = 
// }

// get recurring expenses. 




