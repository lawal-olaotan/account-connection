
import { banks } from "../db/queries/banks.js";
import { detectRecurringPayments } from '../helpers/subscription.js'
import { checkSaaSMerchants } from '../db/queries/saas-checker.js'
import * as TestJson from '../test.json' assert { type: "json" };

// removed parameters client,accountId
export const getAccountTransactions = async (client, accountId) => {
    const account = await client.account(accountId);
    let { transactions } = await account.getTransactions();

    const creditors = await getCreditors(transactions);
    const bankssearch = banks()
    const filteredPayments = await bankssearch.bankPaymentSearch(creditors);

    // Four stage check 
    const freetrials = await detectFreeTrials(filteredPayments);
    const detectedExpenses = detectRecurringPayments(filteredPayments)
    let recurringExpenses = [...freetrials, ...detectedExpenses]
    const recent = await getRecentTransactions(filteredPayments);
    const saasTransactions = await discoverSaasTransaction(recurringExpenses, recent)

    const saas = mergeAndRemoveDuplicateMerchants(recurringExpenses,saasTransactions)

    return {saas, recent:filteredPayments}
}

export const getCreditors = async (transactions) => {
    const { booked, pending } = transactions;
    let transactionArray = [...booked, ...pending]
    const creditors = [];

    for (let transactionIndex = 0; transactionIndex < transactionArray.length; transactionIndex++) {
        const transaction = transactionArray[transactionIndex];
        if (!("creditorName" in transaction) || (nonSaaSMCCs.has(transaction.merchantCategoryCode))) continue
        const { bookingDate, transactionAmount, creditorName, merchantCategoryCode } = transaction
        const { amount, currency } = transactionAmount
        creditors.push({ creditorName, bookingDate, merchantCategoryCode, currency, amount })
    }
    return creditors;

}

const discoverSaasTransaction = async (recurringExpenses, recentTransactions) => {
    const combinedArray = mergeAndRemoveDuplicateMerchants(recurringExpenses, recentTransactions)
    const likelySaas = await checkSaaSMerchants(combinedArray);
    return likelySaas
}

const getRecentTransactions = async (transactions) => {

    // get range of dates from transactions
    try {

        transactions.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        const currentDate = new Date()

        let transactionsInCurrentMonth = transactions?.map(transaction => {
            const transactionDate = (currentDate - new Date(transaction.bookingDate)) / (1000 * 60 * 60 * 24);
            if (transactionDate <= 30) {
                return {
                    ...transaction,
                    pattern: 'recent',
                    ends: null,
                    count: 0
                };
            }
            return null;
        }).filter(Boolean);


        return transactionsInCurrentMonth;

    } catch (error) {
        console.log(error.message)
    }
}

// TODO: 
export const detectFreeTrials = async (creditors) => {

    // Filter out expenses that are zero in value
    const freeTrials = creditors.filter(creditor => {

        const transactionDate = new Date(creditor.bookingDate)
        const currentDate = new Date()
        const difference = (currentDate - transactionDate) / (1000 * 3600 * 24)

        return creditor.amount === "-0.0000" && difference < 30
    })

    return freeTrials.map(freeTrial => {
        return {
            ...freeTrial,
            pattern: "trial",
            count: 1,
            ends: null
        }
    })

}

export const processMultipleAccounts = async (client, accounts) => {

    const transactions = { saas:[], recent:[]
    }

    for (const account of accounts) {
        const { saas, recent} = await getAccountTransactions(client, account);
        transactions.saas.push(...saas)
        transactions.recent.push(...recent)
    }

    return transactions
}

export const mergeAndRemoveDuplicateMerchants = (recurringExpenses, recentTransactions) => {
    const combinedArray = [...recurringExpenses, ...recentTransactions];
    const uniqueMerchants = new Map();

    combinedArray.forEach(transaction => {
        if (!uniqueMerchants.has(transaction.creditorName)) {
            uniqueMerchants.set(transaction.creditorName, transaction);
        }
    });

    return Array.from(uniqueMerchants.values());
}

const nonSaaSMCCs = new Set([
    '5411', // Grocery Stores, Supermarkets
    '5541', // Service Stations
    '5812', // Eating Places, Restaurants
    '5814', // Fast Food Restaurants
    '7538', // Auto Service Shops
    '4131', // Bus Lines
    '7311', // Advertising Services
    '5311', // Department Stores
    '5912', // Drug Stores and Pharmacies
    '5300', // Wholesale Clubs
    '5200', // Home Supply Warehouse Stores
    '5651', // Family Clothing Stores
    '5310', // Discount Stores
    '5661', // Shoe Stores
    '5533', // Automotive Parts and Accessories Stores
    '5699', // Miscellaneous Apparel and Accessory Shops
    '5732', // Electronics Stores
    '5942', // Book Stores
    '5944', // Jewelry Stores
    '5999', // Miscellaneous and Specialty Retail Stores
    '7011', // Hotels, Motels, Resorts
    '7230', // Beauty and Barber Shops
    '7299', // Miscellaneous Personal Services
    '8011', // Doctors and Physicians
    '8021', // Dentists and Orthodontists
    '8041', // Chiropractors
    '8062', // Hospitals
    '8099', // Medical Services and Health Practitioners
    '4111', // Local/Suburban Commuter Passenger Transportation
    '4121', // Taxicabs and Limousines
    '4784', // Bridge and Road Fees, Tolls
    '4900', // Utilities
    '5511', // Car and Truck Dealers
    '5521', // Used Car Dealers
    '5542', // Automated Fuel Dispensers
    '5813', // Bars, Cocktail Lounges, Discotheques, Nightclubs and Taverns
    '6300', // Insurance Sales, Underwriting, and Premiums,
    '7311'
  ]);


