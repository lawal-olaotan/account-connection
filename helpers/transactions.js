
import { instititionQuery } from "../db/queries/instituition.js";
 // removed parameters client,accountId
 export const getAccountTransactions = async (client,accountId,country,transactionLength)=> {

    const account = await client.account(accountId);
    const totalTransactionInNumber = Number(transactionLength);
    let { transactions } = await account.getTransactions();
    const  creditors = await getCreditors(transactions,country);

    const expenses = await recurringPayments(creditors,totalTransactionInNumber);
    const mostRecentTransactions = await getCurrentMonthTransactions(creditors,country)
    
    // remove transactions that exisit in most recent transactions from transactions array. 
    const recentTransactions = mostRecentTransactions.filter(recentTransaction => 
        !expenses.some(transaction => 
            transaction.creditorName === recentTransaction.creditorName))

    return [expenses, recentTransactions]

}

const getCreditors = async(transactions, country) => {

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

const recurringPayments = async(transactions,totalTransactionInNumber)=> {

    const transactionMap = new Map()

    for(let transaction of transactions){
        const { creditorName, amount, currency , bookingDate, merchantCategoryCode} = transaction;
        const  key = `${creditorName}`;

        if(transactionMap.has(key)){

            let value = transactionMap.get(key)
           const isBillingMonthly = await monthlyExpensesCheck(value.bookingDate, bookingDate);
           let isBillingAnnual; 

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
 
    return(currentDate > previousDate && (currentDate.getFullYear() !== previousDate.getFullYear()) && ( (previousDate.getFullYear()+ 1) === currentDate.getFullYear()))
}

// SUBSCRIPTION ALGORITHM
const monthlyExpensesCheck = async(firstDate,secondDate) => {
    const currentDate = new Date(firstDate)
    const previousDate = new Date(secondDate)
 
    return(currentDate > previousDate && (currentDate.getMonth() !== previousDate.getMonth()) && ( (previousDate.getMonth()+ 1) === currentDate.getMonth()))
 }

const getCurrentMonthTransactions = async(transactions,country)=> {

    // get range of dates from transactions
        try{
            const currentDate = new Date(); 

            let transasctionsInCurrentMonth = transactions?.filter(transaction => {
                const transactionDate = new Date(transaction.bookingDate);
                return transactionDate.getMonth() === currentDate.getMonth() ;
            })

            // TODO: to be refined with better algrothim
            if(!transasctionsInCurrentMonth.length){
                transasctionsInCurrentMonth = transactions?.filter(transaction => {
                    const transactionDate = new Date(transaction.bookingDate);
                    return transactionDate.getDate() - 15;
                })
            }

            const refinedTransactions = removeBankPayments(transasctionsInCurrentMonth,country)

            return refinedTransactions;
        }catch(error){
            throw error.message
        }
}
