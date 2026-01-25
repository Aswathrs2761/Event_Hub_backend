import nodemailer from "nodemailer";
import dotenv from "dotenv";


dotenv.config()

    const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.PASS_MAIL,
        pass:process.env.PASS_KEY
    },
})


    const sendmail = async(to, subject, text) =>{
        const mailoptions = {
            from: process.env.PASS_MAIL,
            to,
            subject,
            text
        }

        try {
            await transporter.sendMail(mailoptions)
            console.log(" Email sent Successfully ");
            
        } catch (error) {
            console.error("Error send Email", error)
            throw error
        }
    };
    
    export default sendmail

