import { dbPromise } from '../config.js'; 
import { ObjectId } from 'mongodb';

export const getUserById = async (userId) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('users');
    const userDetails = collection.findOne({_id:new ObjectId(userId)}); 
    return userDetails

}