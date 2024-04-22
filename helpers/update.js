import { generateLink} from './link.js';
import {  getUserById } from '../db/queries/user.js'
import { brevoUtil } from '../middleware/brevo.js';
import { updateExistingTransactions} from '../db/queries/requistion.js';


const cloudProvider = () => {
  const AWS = require('aws-sdk');

  AWS.config.update({
      region:'eu-west-2',
      accessKeyId:process.env.AWS_ACCESS_KEY,
      secretAccessKey:process.env.AWS_SECRET_KEY
  });

  const scheduler = new AWS.Scheduler();
 
  return scheduler
}


export const utils = () => {

  const checkRequisitionStatus = (itemDate)=> {
          const currentDate = new Date(); 
          const daysInSeconds = (1000 * 3600 * 24)
          const  differenceInDays = Math.round((currentDate.getTime() - itemDate.getTime())/daysInSeconds)

          if(differenceInDays >= 90) return false
          console.log(differenceInDays)
          return true;

  }

  const manageRequistionUpdate = async(id,userId,institutionId)=> {
      const brevo = brevoUtil();
      const {email,name} = await getUserById(userId); 
      // generate new information and save it
      // const newReq = await generateLink();
      
      // TODO: query institutionId to get institution name and country
      // Pass the resulting object as a paramter to sendAlert method 
      // 
      await brevo.sendAlert(email,name)
      // await saveRequistion(newReq.id,userId,institutionId,newReq.link)
      // await removeRequisitionsById(id)
      return true;
  }

  const updateRequistionTrans = async(id,transactions)=> {

    transactions.forEach(async(transaction)=> {
        await updateExistingTransactions(id,transaction)
    })

  }


  return {
      checkRequisitionStatus,
      manageRequistionUpdate,
  }
}


const scheduleTransactionUpdate = async(requistionId) => {
    // set scheduler to update every 24 hours or every 7 days

    const data = {
        userId,requistionId
    }

    const payload = {
        FlexibleTimeWindow: {
          Mode: "OFF",
        },
        Name: data.bus,
        ScheduleExpression: data.rate,
        Target: {
          Arn: `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:reminder`,
          RoleArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/scheduler_role`,
          Input: JSON.stringify(data),
          RetryPolicy: {
            MaximumEventAgeInSeconds: 300,
            MaximumRetryAttempts: 1,
          },
        },
        ScheduleExpressionTimezone: "Europe/London",
      };

      return scheduler.createSchedule(payload, async (err) => {
        if (err) {
          console.trace("error creating scheduler", err.message);
            return res.status(409).json({ message: err.message });
        }
        // save reminder
        await saveReminderItem(data, "reminders");
        // calculate reminders usage
        saveReminderUsage(data, "reminders");
        return res.status(200).json({ ok: true });
      });

}
