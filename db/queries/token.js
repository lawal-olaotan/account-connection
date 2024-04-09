import { dbPromise } from '../config.js'; 
import { cardlessClient } from '../../gocardless.js';


// save Token
export const saveRefreshToken = async({refresh,access,userId})=> {
        const db = ( await dbPromise).db();

        // values will expire after 30 days
       db.collection('linkToken').createIndex({"createdAt":1},{ expireAfterSeconds: 86400 * 30})

        // gets refreshed tokens
        const userPreviousToken = await getRefreshToken(userId);

        // checks if tokens and update object 
        if(!userPreviousToken){
            await db.collection('linkToken').updateOne(
                { userId}, 
                {$set:{ createdAt:new Date(), access,refresh}}
            ).then(()=> true )
        } 

        await db.collection('linkToken').insertOne({createdAt:new Date(),access, refresh, userId}).then(err => {
            if(!err) return 
        })

}

// gets existing token
export const getRefreshToken = async(userId) => {
            const db = ( await dbPromise).db();
            const userToken = await db.collection('linkToken').findOne({userId}); 
            return userToken;
}

// set Token 
export const setToken = async(userId) => {
    // access token
    const userToken = await getRefreshToken(userId);
    let accessTokens;

    if(!userToken  || "refresh" in userToken){
        const { access, refresh } = await cardlessClient.generateToken();
        accessTokens = access;
        const tokensData = {
            refresh,
            access,
            userId
        }
        saveRefreshToken(tokensData);
    }else{
        const {  refresh } = userToken
        accessTokens= requestNewToken(refresh) 
    }
    
    cardlessClient.token = accessTokens
    return cardlessClient
} 

const requestNewToken = async(refresh)=> {
    const { access } =  await cardlessClient.exchangeToken({refreshToken: refresh});
    return access
}

