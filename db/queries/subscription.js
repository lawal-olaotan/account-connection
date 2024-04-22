import { dbPromise } from "../config.js";


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
    const db = ( await dbPromise).db();
    const collection = await db.collection('userTrials')

    const subscriptions = createSubscriptionObject(transactions,postedBy);

     if(subscriptions.length < 2) {
        return await collection.insertOne(subscriptions[0])
     }

     await collection.inserMany(subscriptions)
}


// export const saveSubscriptions = async(transactions,postedBy)=>
// {
//     try{

        
        

//     }catch(error){
//         throw new Error(error.message)
//     }

// }
    

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