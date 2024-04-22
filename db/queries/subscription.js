import { dbPromise } from "../config.js";
import dotenv from "dotenv"
dotenv.config();

export const updateSubscriptions = async(transactions,postedBy) => {
    const db = ( await dbPromise).db();
    const collection = await db.collection('userTrials')

    transactions.forEach(async(transaction )=> {
            const { bookingDate,creditorName} = transaction;

           const { starts,ends} = getDates(bookingDate)

            const name = creditorName.toLowerCase();
            const filterParam = {$and:[{postedBy,name}]}
            await collection.updateOne(filterParam,{
                $set:{
                    starts,
                    ends
                }
            })
    })
}

export const saveSubscriptions = async(transactions,postedBy) => {
    const subscriptions = createSubscriptionObject(transactions,postedBy);
    const route = subscriptions.length < 2 ? '/usertrials' : '/subscriptions'
    const data = subscriptions.length < 2 ? subscriptions[0] : subscriptions
     await subscriptionApiCall(data,route)
}

const createSubscriptionObject = (transactions,postedBy)=> {

    return transactions.map( transaction => {
        const { bookingDate, creditorName, pattern, currency, amount} = transaction
        const { starts,ends} = getDates(bookingDate); 
        const name = creditorName.toLowerCase()
        const serviceType = pattern === 'monthly' ? 'subscription' : 'trial';
        
        return transaction = {
            name,
            icon:'',
            domain:'',
            isReminderset:false,
            serviceType,
            amount:`${currency} ${amount}`,
            starts,
            ends,
            postedBy
        }
    })

}

const getDates = (bookingDate)=> {

    const starts = new Date(bookingDate);
    let ends = new Date(bookingDate)
    ends = ends.setMonth(ends.getMonth()+1); 

    const subscriptionDates = {starts,ends}

    return subscriptionDates
}

export const subscriptionApiCall = async (data,route) => {
    try {
        const subscriptionApiUrl = `${process.env.SUBSCRIPTION_API}${route}`
      const apicall = await fetch(subscriptionApiUrl,
        {
          method:'POST',
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const apifetchResponse = await apicall.json();
      return apifetchResponse;
    } catch (error) {
      console.log(`Error ${error}`);
    }
};