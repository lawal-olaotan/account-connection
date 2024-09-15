import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});




export const checkSaaSMerchants = async (transactions) => {

  const results = [];

  for (const transaction of transactions) {

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert in identifying SaaS and subscription-based businesses and browse the internet to inform your decisions. Exclude traditional retail, food services, insurance services, transportation, entertainment services, rents, local councils and vehicle-related services from SaaS classifications." },
          {
            role: "user", content: `Is ${transaction.creditorName} a SaaS or subscription-based service provider? Consider the following details:
              Creditor Name: ${transaction.creditorName}
              Merchant Category Code: ${transaction.merchantCategoryCode}
              Amount: ${transaction.amount}
              Currency: ${transaction.currency}
              
              Respond with a JSON object containing 'isSaaS' (boolean) and 'confidence' (number between 0 and 1).` }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      console.log(result, transaction.creditorName)

      if (!result.isSaaS) continue

      const saasExpenses = {
        ...transaction,
        isSaaS: true
      }

      results.push(saasExpenses)

    } catch (error) {
      console.error(`Error checking ${transaction.creditorName}:`, error);
    }

  }

  return results;
}
