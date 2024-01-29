import {MongoClient} from "mongodb"
import dotenv from "dotenv"

dotenv.config();

let DB_URI = process.env.DB_URI;
let PORT = process.env.PORT

let client
let ClientPromise

if(!DB_URI){
    throw new Error('Please add your mongo DB_URI')
}

if(!PORT){
    client = new MongoClient(DB_URI)
    ClientPromise = client.connect(); 
}else{

   if(!global._MongoClientPromise){
       client = new MongoClient(DB_URI); 
       global._mongoClientPromise = client.connect(); 
   }
   ClientPromise = global._mongoClientPromise
}

export const dbPromise = ClientPromise




