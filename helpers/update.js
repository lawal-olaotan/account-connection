

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

const storage = ()=> {

    const {MongoClient} = require("mongodb");
    const client = new MongoClient(URI,options).connect()
    return client

}


const scheduleTransactionUpdate = async(requistionId) => {
    // TODO: get user plan to determine scheduler rate
    // set scheduler to update every 24 hours or every 7 days
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

// UPDATE REQUISTION
    // when users get new link
    // create a new endpoint called update
    // check if requistion is previously saved and check last day of access

// New Update UI 
// when there is new transactions