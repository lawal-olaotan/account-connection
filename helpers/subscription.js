import { scheduler  } from '../lib/scheduler.js'
import { novuWebActions } from '../lib/novu.js';
import { getUserById } from '../db/queries/user.js'

export const detectRecurringPayments = (transactions, subscriptionType) => {
  const merchantGroups = groupTransactionsByMerchant(transactions);
  let recurringPayments = [];

  for (const merchantTransactions of Object.values(merchantGroups)) {

    merchantTransactions.sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
    let recurrings = findRecurringTransactions(merchantTransactions);
    if (!recurrings) continue
    recurringPayments.push(recurrings)
  }
  return recurringPayments;
}

const findRecurringTransactions = (merchantTransactions) => {

  const patterns = [
    { type: 'annual', expectedDays: 365, dateThreshold: 60, amountThreshold: 0.2 },
    { type: 'biannual', expectedDays: 182, dateThreshold: 30, amountThreshold: 0.15 },
    { type: 'monthly', expectedDays: 30, dateThreshold: 10, amountThreshold: 0.1 }
  ];

  let bestMatch;

  merchantTransactions.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

  const mostRecentTransactions = merchantTransactions[0]
  const currentDate = new Date();


  for (const pattern of patterns) {

    // Checks for last day transaction occured
    const daysSinceLastTransaction = ( currentDate - new Date(mostRecentTransactions.bookingDate)) / (1000 * 60 * 60 * 24);
    const maxAllowedDays = pattern.expectedDays + pattern.dateThreshold;

    if(daysSinceLastTransaction > maxAllowedDays ) continue

    let result = findPotentialRecurringPayments(merchantTransactions, pattern); 

    if (!result.isRecurring) continue

    const nextExpectedDate = new Date(mostRecentTransactions.bookingDate);
    nextExpectedDate.setDate(nextExpectedDate.getDate() + pattern.expectedDays);
    const nextBillingDate = nextExpectedDate.toISOString().split('T')[0]

    if(nextExpectedDate <  currentDate) continue

    if (!bestMatch || pattern.expectedDays < bestMatch.pattern.expectedDays) {
      bestMatch = {
        ...mostRecentTransactions,
        pattern: pattern.type,
        count: merchantTransactions.length,
        ends: nextBillingDate
      };
    }
    
   

  }

  return bestMatch
}


const groupTransactionsByMerchant = (transactions) => {
  return transactions.reduce((groups, transaction) => {
    if (!groups[transaction.creditorName]) {
      groups[transaction.creditorName] = [];
    }
    groups[transaction.creditorName].push(transaction);
    return groups;
  }, {});
}


const  findPotentialRecurringPayments = (transactions, pattern) => {

  let matchCount = 0

  for (let i = 0; i < transactions.length - 1; i++) {
    const current = transactions[i];
    const next = transactions[i + 1];

    const daysBetween = ( new Date(current.bookingDate) - new Date(next.bookingDate)) / (1000 * 60 * 60 * 24);

    if (Math.abs(daysBetween - pattern.expectedDays) <= pattern.dateThreshold) {
      matchCount++
      
    }
  }

  return { isRecurring: matchCount >= 2}; // No matching pairs found
}

export const scheduleTrialReminder = async(transactions,userId) => {

    const freeTrials = transactions.filter(transaction => transaction.pattern === 'trial')
    if(!freeTrials.length) return false;

    const novu = novuWebActions()
    const novuPayload = {userId, trial: freeTrials.length}
    novu.trigger('open-banking',novuPayload)

    const schedulerWorker  = scheduler();
    const userInformation = await getUserById(userId)

    for ( const trial of freeTrials){
      const data = schedulerWorker.createObject(trial,userInformation);
      const response = await schedulerWorker.setReminder('POST', '/schedule', data)
      console.log(response);
    }

}


