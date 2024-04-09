import { randomUUID } from "crypto";
import { setToken } from "../db/queries/token.js";

export const generateLink = async(institutionId,countryCode,transaction_total_days)=> {

    const client = await setToken()
    const client_url = process.env.CLIENT_URL


    const data = await client.initSession({
        redirectUrl:`${client_url}connect/detect?insId=${institutionId}&country=$${countryCode}`,  // Redirect URL
        institutionId:institutionId,
        referenceId:randomUUID(),
        accessValidForDays:90,
        maxHistoricalDays:transaction_total_days,
        accessScope:['transactions']
    })

    return data; 

}

export const getRequistionAccounts = async(client,requisitionId)=> {
    const {accounts} = await client.requisition.getRequisitionById(requisitionId);

    // if(accounts.length > 1 ){
    //     // check if user is on a premium
    //     console.log('more than one accounts')
    // }

    return accounts[0];
}

export const deleteRequstionById = async(id)=> {
    const client = await setToken()
    const response = await client.requisition.deleteRequisition(id)
    return response;

}