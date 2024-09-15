

export const scheduler = () => {

    /**
     * function set reminders for services from the account service
     * @param {*} method can be 'POST', 'GET', 'PUT', 'DELETE'
     * @param {*} route  can be '/schedule', '/verify'
     * @param {*} data  can be data produced in createObject function
     * @returns 
     */
    const setReminder = async(method,route,data,) => {
        const reminderEndpoint  = process.env.REMINDER_URL
        try {
            const response = await fetch(`${reminderEndpoint}${route}`,{
                  method: method,
                  body: JSON.stringify(data),
                  headers: {
                    "Content-Type": "application/json",
            }})
            const apifetchResponse = await response.json();
            return apifetchResponse;
        } catch (error) {
          console.log(`Error ${error}`);
        }
    }

    /**
     * function creates scheduler object
     * @param {*} data 
     * @param {*} userData 
     * @returns 
     */
    const createObject = (data,userData) => {

        const { creditorName, bookingDate, pattern } = data
        const { name, number, _id } = userData

        const reminderDate = getReminderDateISO(bookingDate, 28)

        const reminderObject = {
            name:creditorName,
            icon:'',
            domain:'',
            rate: `at(${reminderDate})`,
            bus:`${ _id.toString()}-${name}`,
            postedBy:name.split(" ")[0], 
            number:number,
            sid: "",
            userId: _id?.toString(),
            days: `unknown number of days`,
            serviceType:pattern,
            ends:null,
            starts:bookingDate
          };

          return reminderObject

    }

    function getReminderDateISO(transactionDate, daysToAdd = 28) {
        const reminderDate = new Date(transactionDate);
        reminderDate.setDate(reminderDate.getDate() + daysToAdd);
        return reminderDate.toISOString().split(".")[0];
      }

    return {setReminder, createObject}
}

