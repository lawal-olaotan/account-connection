/**
 * TODO:still incomplete
 * lambda function Js sends schedules messages using AWS eventBridge scheduler see eventbridge.js file.
 */
require("dotenv").config();
const AWS = require('aws-sdk');

// dynamoDB config
AWS.config.update({region:process.env.AWS_REGION});


/**
 * 
 * DB SECTION
 */



/**
 * 
 * GOCARDLESS SECTION
 */




// save information and send message to client 
exports.handler = async(event)=> {
    try{

            // Check if access days is not execeeded 
            // If accesdays is due : 
            // Request new link 
            // Send email & update requisition as not connected false
                
            // if no new transactions are found from last day of access 
            // return no update

            // if there is a transaction update

            // check if recorded recurring expenses is charged again
            // update billing data and time 

            // check if new merchants are contained in expenses from last month
            // add to recurring expenses

            // check if it's a free trial period or subscription

        // return{
        //     statusCode: 200,
        //     body: JSON.stringify({
        //         message: 'success'
        //     })
        // }

    }catch(error){
        console.log(error)
    }
}