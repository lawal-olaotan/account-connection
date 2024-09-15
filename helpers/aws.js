import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";


export const aws = () => {

    const config = () => {
        return {
            region: 'eu-west-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY
            }
        };
    };

    const schedule = async(requistionData) => {

        const awsConfig = config();
        const scheduler = new SchedulerClient(awsConfig);
    
        const payload = {
            FlexibleTimeWindow: {
              Mode: "OFF",
            },
            Name:`${requistionData.id}-${requistionData.userId}`,
            ScheduleExpression: "cron(0 */3 * * ? *)",
            Target: {
              Arn: `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:update`,
              RoleArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/scheduler_role`,
              Input: JSON.stringify(requistionData),
              RetryPolicy: {
                MaximumEventAgeInSeconds: 300,
                MaximumRetryAttempts: 1,
              },
            },
            ScheduleExpressionTimezone: "Europe/London",
          };
    
        try {
            const command = new CreateScheduleCommand(payload);
            const response = await scheduler.send(command);
            return response;
        } catch (error) {
            console.error("Error creating scheduler:", error);
            throw error;
        }
    
    }

    return { schedule }
}