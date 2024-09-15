import { randomUUID } from "crypto";
import { setToken } from "../db/queries/token.js";
import { instititionQuery } from "../db/queries/instituition.js"
import { openBankingApi } from "../gocardless.js";

export const generateLink = async (institution_id, countryCode, userId) => {

    const client_url = process.env.CLIENT_URL
    const agreement = await createAgreement(institution_id)
    const data = {
        redirect: `${client_url}connect/success?insId=${institution_id}&country=${countryCode}&userId=${userId}`,
        institution_id,
        reference: randomUUID(),
        agreement
    }
    const linkObject = await openBankingApi("requisitions/", 'POST', data)
    return linkObject
}
// function generates user agreement token using Gocardless api 
export const createAgreement = async (institution_id) => {

    const max_historical_days = await transactionLengthByinstitutionId(institution_id);

    const dataTransaction = {
        institution_id,
        max_historical_days,
        access_valid_for_days: 90,
        access_scope: ['transactions']
    }
    const scope = await openBankingApi('agreements/enduser/', 'POST', dataTransaction)
    return scope.id
}
// function get user requistion by from nordiden client library
export const getRequistionAccounts = async (client, requisitionId) => {
    const { accounts } = await client.requisition.getRequisitionById(requisitionId);
    return accounts;
}
// function deletes user requistion by requition Id
export const deleteRequstionById = async (id) => {

        const client = await setToken()
        const response = await client.requisition.deleteRequisition(id)
        return response;
}
// function returns transaction length provided  of each financial institution
export const transactionLengthByinstitutionId = async (institutionId) => {
    const db = instititionQuery()
    const { transaction_total_days } = await db.getBankById(institutionId);
    return transaction_total_days
}