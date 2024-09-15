/**
 * @file Defines go cardless client.
 */
 import NordigenClient from "nordigen-node";
import dotenv from "dotenv"
import { refreshToken} from "./db/queries/token.js";


dotenv.config();

// sets gocardless client
export const cardlessClient = new NordigenClient({
    secretId: process.env.SECRET_ID,
    secretKey: process.env.SECRET_KEY
});

/**
 * function calls open banking 
 * @param {*} route 
 * @param {*} method 
 * @param {*} data 
 */
export const openBankingApi  = async( route, method, data) => {
    const client = await refreshToken(); 
    const uri = process.env.GOCARDLESS_URI

    const parameter = {
        method,
        headers:{
            "accept": "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${client}`
        },
        body: JSON.stringify(data)
    }

    const response = await fetch(`${uri}${route}`,parameter)
    const responseJson = await response.json()
    return responseJson
}



