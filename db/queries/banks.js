import { dbPromise } from '../config.js'; 

export const banks = () => {

    const connect = async()=> {
        const db =  (await dbPromise).db()
        const collection = db.collection('banks')
        return collection
    }

    const pipe = async(creditorName) => {

      if (!creditorName) {
        throw new Error("Creditor name is required for the search query");
      }

        return [
            {
              $search: {
                index: "banks_search_index", 
                autocomplete: {
                  query: creditorName,
                  path: "name",
                  fuzzy: {
                    maxEdits: 2,
                    prefixLength: 3
                  }
                }
              }
            },
            {
              $limit: 1
            }
          ]
    }


    const bankPaymentSearch = async(transactions) => {

        const collection = await connect()

        const matchedTransactions = [];


        for ( const transaction of transactions ){
            const { creditorName } = transaction
            const pipeline = await pipe(creditorName)
            const results = await collection.aggregate(pipeline).toArray()
            if(results.length){
                matchedTransactions.push(creditorName)
            }
        }
        transactions = transactions.filter(transaction => !matchedTransactions.includes(transaction.creditorName))

        return transactions
    }

    return { bankPaymentSearch }
}