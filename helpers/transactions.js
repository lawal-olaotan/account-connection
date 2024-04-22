
import { instititionQuery } from "../db/queries/instituition.js";
 // removed parameters client,accountId
 export const getAccountTransactions = async (client,accountId,country,transactionLength)=> {

    
        const account = await client.account(accountId);
        const totalTransactionInNumber = Number(transactionLength);
        let { transactions } = await account.getTransactions();
        const  creditors = await getCreditors(transactions,country);

        const freetrials = await detectFreeTrials(creditors);
        const expenses = await recurringPayments(creditors,totalTransactionInNumber);
        const mostRecentTransactions = await getCurrentMonthTransactions(creditors,country)
        console.log(mostRecentTransactions)

        let detectedExpenses = freetrials.length ? expenses.concat(...freetrials) : expenses


    
    // remove transactions that exisit in most recent transactions from transactions array. 
        const recentTransactions = mostRecentTransactions.filter(it => 
            !detectedExpenses.some(transaction => 
                transaction.creditorName === it.creditorName))


        return [detectedExpenses, recentTransactions]

}

export const getCreditors = async(transactions, country = 'GB') => {
    const { booked, pending} = transactions;
    let transactionArray = [...booked, ...pending]
    transactionArray = await removeBankPayments(transactionArray,country);
    const creditors = []; 

    for(let transactionIndex = 0; transactionIndex < transactionArray.length; transactionIndex++){
            const transaction = transactionArray[transactionIndex]; 
            if(!("creditorName" in transaction)) continue
                const {bookingDate, transactionAmount,creditorName, merchantCategoryCode} = transaction
                const { amount, currency } = transactionAmount
                creditors.push({creditorName,bookingDate,merchantCategoryCode,currency,amount})
    }   

    return creditors; 

}

const removeBankPayments = async(transactions,country)=> {

    try{
        const db = instititionQuery()
        const banks = await db.getBanksInformation(country);
        const bankArray = [];

        banks.forEach(bank=>{
            bankArray.push((bank.name.toLowerCase()))
        })


        const filteredTransactions = transactions.filter(transaction => {
            return !bankArray.some(bankname => transaction.creditorName?.toLowerCase().includes(bankname));
        });

        return  filteredTransactions;
    }catch(error){
        throw error.message
    }
        
}

export const recurringPayments = async(transactions,totalTransactionInNumber = 90 )=> {

    const transactionMap = new Map()
    let isBillingAnnual;

    for(let transaction of transactions){
        const { creditorName, amount, currency , bookingDate, merchantCategoryCode} = transaction;
        const  key = `${creditorName}`;

        if(transactionMap.has(key)){

            let value = transactionMap.get(key)
           const isBillingMonthly = await monthlyExpensesCheck(value.bookingDate, bookingDate);

           if(totalTransactionInNumber > 720){
                isBillingAnnual =  await calculateAnnualExpenses(value.bookingDate, bookingDate);
           }
          
           if(isBillingMonthly){
                value.count += 1 
                value.pattern = 'monthly';
           }

           if(isBillingAnnual){
            value.count += 1 
            value.pattern = 'Annual';
           }


        }else{
            transactionMap.set(key,{creditorName,amount, currency,bookingDate,count:1,merchantCategoryCode,pattern:'',priceChange:0})
        }
    }

    let recurringTransactions = Array.from(transactionMap.values()).filter(transaction => parseInt(transaction.count) >= 2)


    return recurringTransactions; 

}

const calculateAnnualExpenses = async(firstDate,secondDate) => {
    const currentDate = new Date(firstDate)
    const previousDate = new Date(secondDate)
    const dateDiffInDays = (currentDate - previousDate)/(1000*3600*24);
    return( (dateDiffInDays >= 365 && dateDiffInDays <= 370) && ( (previousDate.getFullYear()+ 1) === currentDate.getFullYear()))
}

// SUBSCRIPTION ALGORITHM
const monthlyExpensesCheck = async(firstDate,secondDate) => {
    const currentDate = new Date(firstDate)
    const previousDate = new Date(secondDate)
    const dateDiffInDays = (currentDate - previousDate)/(1000*3600*24);
 
    return(
        (dateDiffInDays >= 30 && dateDiffInDays <= 40) &&
        (previousDate.getMonth()+ 1) === currentDate.getMonth()
    )
 }

const getCurrentMonthTransactions = async(transactions,country)=> {

    // get range of dates from transactions
        try{
            const currentDate = new Date(); 

            let transasctionsInCurrentMonth = transactions?.filter(transaction => {
                const transactionDate = new Date(transaction.bookingDate);
                return transactionDate.getMonth() === currentDate.getMonth() ;
            })

            if(!transasctionsInCurrentMonth.length){
                transasctionsInCurrentMonth = transactions?.filter(transaction => {
                    const transactionDate = new Date(transaction.bookingDate);
                    return transactionDate.getDate() - 15;
                })
            }

            const refinedTransactions = await removeBankPayments(transasctionsInCurrentMonth,country)
            return refinedTransactions;
            
        }catch(error){
            console.log(error.message)
        }
}

// TODO: 
export const detectFreeTrials = async(creditors) => {

    // Filter out expenses that are zero in value
    const freeTrials = creditors.filter( creditor => {

        const transactionDate = new Date(creditor.bookingDate)
        const currentDate = new Date()
        const difference = (currentDate - transactionDate) /(1000 * 3600 * 24)

        return creditor.amount === "-0.0000" && difference <= 30 
    })

    // add the freeTrila pro
    return  freeTrials.map(freeTrial => {
        return {
            ...freeTrial,
            pattern : "freeTrial",
            count:1
        }
    })

}


