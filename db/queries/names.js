import { dbPromise } from '../config.js'; 

export const instititionQuery = () => {
    
    const connect = async()=> {
        const db =  (await dbPromise).db()
        const collection = db.collection('banks')
        return collection
    }
    
    const saveBankNames = async(institutions,country) => {
        const collection = await connect(); 

        const refinedInstitutions = []

        for(let institution of institutions){
            const { name, logo, id, transaction_total_days,
                bic} = institution
            refinedInstitutions.push({name,country,logo,id,transaction_total_days,bic})
        }
    
        if(refinedInstitutions){
            await collection.insertMany(refinedInstitutions).then(err => {
                if(!err) return 
            })
        }
        
    }

    const getBanksInformation = async(country) =>  {
        const collection = await connect()
        const cursor = await collection.find({country}).toArray(); 
        return cursor
    }

    const getBankById = async(id)=>{
        const db = await connect()
        const institutionInformation = await db.findOne({id})
        return institutionInformation

    }

    return{
        saveBankNames,
        getBanksInformation,
        getBankById
    }
}
