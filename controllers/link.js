import {
    saveRequistion,
    getRequisitionByUser,
    removeRequisitionsById,
    updateRequisitionConnection,
    getRequisitionById
} from '../db/queries/requistion.js';
import {
    setToken
} from '../db/queries/token.js'
import { validationResult } from 'express-validator';
import { generateLink, } from '../helpers/link.js'
import { getAccountTransactions, processMultipleAccounts } from '../helpers/transactions.js'
import { getRequistionAccounts, deleteRequstionById } from '../helpers/link.js'
import { scheduleTrialReminder } from '../helpers/subscription.js'
import { aws } from '../helpers/aws.js'

export const connect = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { institutionId, userId, countryCode } = req.body;
        // checks if institution Id is already saved with userId
        const isRequistionRegistered = await getRequisitionByUser(userId, institutionId);

        if (isRequistionRegistered) {
            const { link } = isRequistionRegistered
            if (!link) return res.status(209).json({ link: false });
            return res.status(200).json({ link });
        }

        const { id, link } = await generateLink(institutionId, countryCode, userId);
        await saveRequistion(id, userId, institutionId, link).then(() => {
            console.log('saved requsition')
            res.status(200).json({ link })
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({link:false})
    }
}

export const transactions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { country, id } = req.query
        if (!id) return res.status(409).json({ transaction: 'search is not valid' })

        const isRequistionConnected = await getRequisitionById(id)
        if (isRequistionConnected.isConnected) return res.status(209).json(false)

        const client = await setToken()
        const accountsId = await getRequistionAccounts(client, id)

        if (!accountsId.length) return res.status(409).json(false)

        const transaction = accountsId.length > 1 ? await processMultipleAccounts(client, accountsId) : await getAccountTransactions(client, accountsId[0]);

        const { userId, institutionId } = await updateRequisitionConnection(id, transaction);
        await scheduleTrialReminder(transaction.saas, userId)

        // schedule constant 
        const schedulerPayload = {userId,id,institutionId}
        await scheduleTransactionSync(schedulerPayload)
    
        res.status(200).json(transaction);

    } catch (error) {
        console.log(error)
        res.status(500).json(false)
    }
}

export const deleteRequistion = async (req, res) => {

    try {
        const { id } = req.body;
        if(!id) return res.status(209).json({ ok: false })

        await deleteRequstionById(id).then(async () => {
            await removeRequisitionsById(id)
            return res.status(200).json({ ok: true })
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ ok: false })
    }

}

const scheduleTransactionSync = async(schedulerPayload) => {
    const awsConfig = aws(); 
    await awsConfig.schedule(schedulerPayload);
}
