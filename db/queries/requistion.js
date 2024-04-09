
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

export const removeRequisitionsById = async(id) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('requsition');
    const response = await collection.deleteOne({id})
    return response
}

export const updateRequisitionConnection = async(id,transaction)=> {
    const db = ( await dbPromise).db();
    
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


