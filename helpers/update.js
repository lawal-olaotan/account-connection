import { novuWebActions } from '../lib/novu.js'


export const utils = () => {

  const checkRequisitionStatus = (itemDate)=> {
          const currentDate = new Date(); 
          const daysInSeconds = (1000 * 3600 * 24)
          const  differenceInDays = Math.round((currentDate.getTime() - itemDate.getTime())/daysInSeconds)
          if(differenceInDays >= 90) return false
          return true;

  }

  const manageRequistionUpdate = async(id,userId,bank)=> {
      //TODO: Add whatsapp reminder here
      await removeRequisitionsById(id)
      const novu = novuWebActions(); 
      await novu.trigger('connection',{bank,userId});
      return true;
  }

  return {
      checkRequisitionStatus,
      manageRequistionUpdate,
  }
}



