import { dbPromise } from "../config.js";
import dotenv from "dotenv"
dotenv.config();


export const saveSubscriptions = async(transactions,postedBy) => {
    const subscriptions = createSubscriptionObject(transactions,postedBy);
     await subscriptionApiCall(subscriptions,'/subscriptions')
}

const createSubscriptionObject = (transactions,postedBy)=> {

    return transactions.map( transaction => {
        const { bookingDate, creditorName, pattern, currency, amount} = transaction
        const { starts,ends} = getDates(bookingDate); 
        const name = creditorName.toLowerCase()
        const subscriptionTypes = ['biannual','annual','monthly' ]
        const serviceType = subscriptionTypes.includes(pattern)? 'subscription' : 'trial';
        
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