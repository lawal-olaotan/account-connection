import { dbPromise } from '../config.js'; 

export const saveBankNames = async(country,institutions)=> {


    const db = ( await dbPromise).db();
    const collection = db.collection('banks')
    const collectionCount = await getBankNames(country)
    if(collectionCount.length) return;

    const insarray = []

    for(let institution of institutions){
        insarray.push({name:institution.name,country,logo})
    }

    if(insarray){
        await collection.insertMany(insarray).then(err => {
            if(!err) return 
        })
    }

   
    
} 

export const getBankNames = async(country)=> {
    const db = ( await dbPromise).db();
    const banksCol = db.collection('banks');
    const cursor = await banksCol.find({country}).toArray()
    return cursor
}