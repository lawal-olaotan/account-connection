import { Novu } from "@novu/node";

// Insert your Novu API Key here
const novu = new Novu(process.env.NOVU_SECRET_KEY);

/**
 * 
 */
export const novuWebActions = () => {

    // TODO in upcomimg sprints
    // send email when user connect has expired
    // send notifications when new free trials is captured
    const trigger = async(trigger,payload)=>{

        await novu.trigger(trigger, {
            to:payload.userId,
            payload,
          });
    } 

    return { trigger }
}