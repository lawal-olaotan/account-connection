/**
 * @file Defines go cardless client.
 */
 
import NordigenClient from "nordigen-node";
import dotenv from "dotenv"



dotenv.config();

// sets gocardless client
export const cardlessClient = new NordigenClient({
    secretId: process.env.SECRET_ID,
    secretKey: process.env.SECRET_KEY
});



