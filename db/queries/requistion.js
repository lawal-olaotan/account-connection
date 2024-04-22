
import { dbPromise } from "../config.js";
import dotenv from "dotenv"

dotenv.config();



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
        lastUpdatedAt:new Date()
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

export const removeRequisitionsById = async(id) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');
    const response = await collection.deleteOne({id})
    return response
}

export const updateRequisitionConnection = async(id,transaction)=> {
    try{
        const db = ( await dbPromise).db();
        await db.collection('requsition').findOneAndUpdate({id},{$set:{isConnected:true,transaction,link:'',lastUpdatedAt:new Date()}}, {
            returnDocument: "after" 
        });
        
        // await updateConnectionLimit(userId)
    }catch(error){
        console.log(error)
    }

}

export const updateReqLastUpdated = async(id) => {
    
    try{
        const db = ( await dbPromise).db();
        await db.collection('requsition').findOneAndUpdate({id},{$set:{lastUpdatedAt:new Date()}}, {
            returnDocument: "after" 
        });
        
        // await updateConnectionLimit(userId)
    }catch(error){
        console.log(error)
    }
}


export const updateExistingTransactions = async(id,transaction)=> {
    try{
        const {bookingDate,count,creditorName,pattern} = transaction
        const db = ( await dbPromise).db();
        await db.collection('requsition').updateOne(
            { id },
            {
                $set:{
                    "transaction.$[elem].bookingDate":bookingDate,
                    "transaction.$[elem].count":count,
                    "transaction.$[elem].patter":pattern,
                }
            },
            {
                    arrayFilters:[
                        {'elem.creditorName': creditorName},
                    ]
            }
        );

    }catch(error){
        throw new Error(error.message)
    }
}

export const insertRequistionTransactions = async(id, transactions)=>{
    try{
        const db = ( await dbPromise).db();

        await db.collection('requsition').updateOne(
        { id },
            {
                $push:{transaction:{$each:transactions}}
            }
        )

    }catch(error){
        throw new Error(error.message)
    }
        
}


const updateConnectionLimit = async(userId)=> {
    const db = (await dbPromise).db(); 
    const collection = db.collection('trialLimits'); 

    const services = await collection.findOne({userId})
    console.log(services)

    // await collection.update({userId},{
    //     $set:{
    //         "service.used":services.used + 1
    //     }
    // })

    return true;
}


