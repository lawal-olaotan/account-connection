import { randomUUID } from "crypto";
import { setToken } from "./token.js";
import { instititionQuery } from "./names.js";
import { dbPromise } from "../config.js";
import dotenv from "dotenv"

dotenv.config();



// TODO redirect url will be changed in the future for student collaboration.
export const generateLink = async(institutionId,countryCode,transaction_total_days)=> {

        const client = await setToken()
        const client_url = process.env.CLIENT_URL


        const data = await client.initSession({
            redirectUrl:`${client_url}connect/detect?insId=${institutionId}&country=$${countryCode}`,  // Redirect URL
            institutionId:institutionId,
            referenceId:randomUUID(),
            accessValidForDays:90,
            maxHistoricalDays:transaction_total_days,
            accessScope:['transactions']
        })

        return data; 

}

// NEXT PRORITY
// gets accounnt details for user 
export const getRequistionAccounts = async(client,requisitionId)=> {
    const {accounts} = await client.requisition.getRequisitionById(requisitionId);

    // if(accounts.length > 1 ){
    //     // check if user is on a premium
    //     console.log('more than one accounts')
    // }

    return accounts[0];
}

// removed parameters client,accountId
export const getAccountTransactions = async (client,accountId,country)=> {

    const account = await client.account(accountId);
    let { transactions } = await account.getTransactions();
    const  creditors = await getCreditors(transactions,country);

    const recurringExpenses = await recurringPayments(creditors);

    const mostRecentTransactions = await getCurrentMonthTransactions(creditors,country)
    

    // remove transactions that exisit in most recent transactions from transactions array. 
    const recentTransactions = mostRecentTransactions.filter(recentTransaction => 
        !recurringExpenses.some(transaction => 
            transaction.creditorName === recentTransaction.creditorName))

    return [recurringExpenses, recentTransactions]

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

const recurringPayments = async(transactions)=> {

    const transactionMap = new Map()

    for(let transaction of transactions){
        const { creditorName, amount, currency , bookingDate, merchantCategoryCode} = transaction;

        const  key = `${creditorName}`;

        if(transactionMap.has(key)){
            let value = transactionMap.get(key)

           const isBillingMonthly = await checkBookDate(value.bookingDate, bookingDate);
           if(!isBillingMonthly) continue
            value.count += 1 
        }else{
            transactionMap.set(key,{creditorName,amount, currency,bookingDate,count:1,merchantCategoryCode})
        }
    }

    let recurringTransactions = Array.from(transactionMap.values()).filter(transaction => parseInt(transaction.count) >= 2)


    return recurringTransactions; 

}


// SUBSCRIPTION ALGORITHM
const checkBookDate = async(firstDate,secondDate) => {

    const dateLastMonth = parseInt(firstDate.split('-')[2]);
    const dateThisMonth = parseInt(secondDate.split('-')[2]);

   const currentDate = new Date(firstDate)
   const previousDate = new Date(secondDate)

   return(currentDate > previousDate && (currentDate.getMonth() !== previousDate.getMonth()) && dateLastMonth === dateThisMonth )
}

// saves requisition based user Id
export const saveRequistion = async(id,userId,institutionId,link)=> {

    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');

    const requisition = {
        createdAt:new Date(),
        id,
        userId,
        institutionId,
        isConnected:false,
        transactions:[],
        link,
        active:true
    }
    
    await collection.insertOne(requisition).then((err)=> {
            if(!err) return
    })
}

export const getRequisitionById = async(userId,institutionId) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');

    const requistion = await collection.findOne(
      {  $and:[
        {userId},
        {institutionId}
        ]}
    )
    return requistion;
}

/**
 * 
 * @param {*} userId 
 * @param {*} institutionId 
 * @returns 
 */
export const getRequisitionsByUser = async(userId) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');
    const requistions = await collection.find({userId}).toArray()
    return requistions;
}
/**
 * 
 * @param {*} userId 
 * @param {*} institutionId 
 * @returns 
 */
export const removeRequisitionsByUser = async(userId) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');
    await collection.deleteMany({userId})
}

export const updateRequisitionConnection = async(id,transaction)=> {
    const db = ( await dbPromise).db();
    
    // store token valid till date in redis store
    // store last access date
    // status: active
    const {value} = await db.collection('requsition').findOneAndUpdate({id},{$set:{isConnected:true,transaction,link:''}}, {
        returnDocument: "after" 
    });
    
    // update connection usage
    // update requistion Id
    // 


    // await updateConnectionLimit(value)
}


const updateConnectionLimit = async(value)=> {
    const { userId } = value 
    const db = (await dbPromise).db(); 
    const collection = db.collection('connectionLimits'); 

    const {services} = await collection.findOne({userId})

    await collection.update({userId},{
        $set:{
            "service.used":services.used + 1
        }
    })

    return true;
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

