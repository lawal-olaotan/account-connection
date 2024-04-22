import { dbPromise } from '../config.js'; 

export const getUserById = async (userId) => {
    const db = ( await dbPromise).db();
    const collection = db.collection('users');
    const userDetails = collection.findOne({_id:userId}); 
    return userDetails

}