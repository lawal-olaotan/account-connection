
import { dbPromise } from "../config.js";
import dotenv from "dotenv"

dotenv.config();

// TODO: loads of repetition here, please modify

// saves requisition based user Id
export const saveRequistion = async (id, userId, institutionId, link) => {

    const db = (await dbPromise).db();
    const collection = db.collection('requsition');

    const requisition = {
        createdAt: new Date(),
        id,
        userId,
        institutionId,
        isConnected: false,
        transaction: [],
        link,
        lastUpdatedAt: new Date()
    }

    await collection.insertOne(requisition).then((err) => {
        if (!err) return
    })
}

export const getRequisitionByUser = async (userId, institutionId) => {
    const db = (await dbPromise).db();
    const collection = db.collection('requsition');

    const requistion = await collection.findOne(
        {
            $and: [
                { userId },
                { institutionId }
            ]
        }
    )
    return requistion;
}

/**
 * 
 * @param {*} userId 
 * @param {*} institutionId 
 * @returns 
 */
export const getRequisitionsByUser = async (userId) => {
    const db = (await dbPromise).db();
    const collection = db.collection('requsition');
    const requistions = await collection.find({ userId }).toArray()
    return requistions;
}
/**
 * removed requstion using requistion id
 * @returns 
 */

export const removeRequisitionsById = async (id) => {
    const db = (await dbPromise).db();
    const collection = db.collection('requsition');
    const response = await collection.deleteOne({ id })
    return response
}


export const updateRequisitionConnection = async (id, transaction) => {
    try {
        const db = (await dbPromise).db();
        const document = await db.collection('requsition').findOneAndUpdate({ id }, { $set: { isConnected: true, transaction, link: '', lastUpdatedAt: new Date() } }, { returnDocument: 'after', upsert: true });
        return document
    } catch (error) {
        console.log(error)
    }

}

// function updates requistion last updated date to check if requistion needs to be updated
export const updateRequistionById = async (id, query) => {

    try {
        const db = (await dbPromise).db();
        await db.collection('requsition').findOneAndUpdate({ id }, { $set: query });
    } catch (error) {
        console.log(error)
    }
}

// function updates existing transactions
export const updateExistingTransactions = async (id, transaction) => {
    try {
        const { bookingDate, count, creditorName, pattern } = transaction
        const db = (await dbPromise).db();
        await db.collection('requsition').updateOne(
            { id },
            {
                $set: {
                    "transaction.$[elem].bookingDate": bookingDate,
                    "transaction.$[elem].count": count,
                    "transaction.$[elem].patter": pattern,
                }
            },
            {
                arrayFilters: [
                    { 'elem.creditorName': creditorName },
                ]
            }
        );

    } catch (error) {
        throw new Error(error.message)
    }
}

// function inserts requistions transactions
export const insertRequistionTransactions = async (id, transactions) => {
    try {
        const db = (await dbPromise).db();

        await db.collection('requsition').updateOne(
            { id },
            {
                $push: { transaction: { $each: transactions } }
            }
        )

    } catch (error) {
        throw new Error(error.message)
    }

}


// // function gets requistion details by requistion id
export const getRequisitionById = async (id) => {
    const db = (await dbPromise).db();
    const collection = db.collection('requsition');
    const services = await collection.findOne({ id })
    return services
}


