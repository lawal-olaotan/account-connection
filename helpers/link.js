import { randomUUID } from "crypto";
import { setToken } from "../db/queries/token.js";
import { instititionQuery } from "../db/queries/instituition.js"

export const generateLink = async(institutionId,countryCode,userId)=> {

    const client = await setToken()
    const client_url = process.env.CLIENT_URL

    const transaction_total_days = await transactionLengthByinstitutionId(institutionId)

    const data = await client.initSession({
        redirectUrl:`${client_url}connect/success?insId=${institutionId}&country=${countryCode}&userId=${userId}`,
        institutionId:institutionId,
        referenceId:randomUUID(),
        accessValidForDays:90,
        maxHistoricalDays:transaction_total_days,
        access_scope:['transactions']
    })

    return data; 

}

export const getRequistionAccounts = async(client,requisitionId)=> {

    const { accounts } = await client.requisition.getRequisitionByUser(requisitionId);

    // if(accounts.length > 1 ){
    //     // check if user is on a premium
    //     console.log('more than one accounts')getRequisitionByUser
    // }

    return accounts[0];
}

export const deleteRequstionById = async(id)=> {
    const client = await setToken()
    const response = await client.requisition.deleteRequisition(id)
    return response;

}

const transactionLengthByinstitutionId = async(institutionId) => {
        const db = instititionQuery()
        const { transaction_total_days } = await db.getBankById(institutionId);
        return transaction_total_days
}