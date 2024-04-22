import dotenv from "dotenv"; 
import brevo from '@getbrevo/brevo';


dotenv.config();

export const brevoUtil = ()=> {

    const setup = ()=> {
        let defaultClient = brevo.ApiClient.instance;
        let apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_URI;

        let apiInstance = new brevo.TransactionalEmailsApi();
        let sendSmtpEmail = new brevo.SendSmtpEmail();
        return {apiInstance,sendSmtpEmail}
    }


    const sendAlert = async(email,name)=> {

        const sender = {name: "Econome",email: "support@joineconome.com"}
        const {apiInstance, sendSmtpEmail} = setup()
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.replyTo = sender;
        sendSmtpEmail.params ={NAME:name};
        sendSmtpEmail.templateId = 6;
        sendSmtpEmail.to = [{email,name}];

        const transacEmail = await apiInstance.sendTransacEmail(sendSmtpEmail); 
        const response = JSON.stringify(transacEmail);
        console.log(response);
    }

    return {
        sendAlert
    }


}