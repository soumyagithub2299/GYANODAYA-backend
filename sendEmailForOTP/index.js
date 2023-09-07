const nodemailer = require('nodemailer');
const azure = require('azure-storage');

// Function to generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

module.exports = async function (context, req) {
    const Email = req.query.Email;

    // Check if Email parameter is provided
    if (!Email) {
        context.res = {
            status: 400,
            body: "Please provide a user email in the query parameter."
        };
        return;
    }

    try {
        // Create a Nodemailer transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'YOUR_SMTP_GMAIL_EMAIL', // SMTP Gmail email address
                pass: 'YOUR_SMTP_PASSWORD' // SMTP Gmail password
            }
        });

        // Generate a random 6-digit OTP
        const otp = generateOTP();

        // Save the OTP in Azure Table Storage (with hard-coded connection details)
        const tableService = azure.createTableService('PRIVATE_NAME', 'PRIVATE_KEY');

        const entity = {
            PartitionKey: 'OTP',
            RowKey: Email,
            OTP: otp.toString()
        };

        // Function to insert or replace an entity in Azure Table Storage
        const insertOrReplaceEntityAsync = () => {
            return new Promise((resolve, reject) => {
                tableService.insertOrReplaceEntity('soumyaGyanodayaTableForEmailAndOtp', entity, (error, result, response) => {
                    if (!error) {
                        resolve();
                    } else {
                        reject(error);
                    }
                });
            });
        };

        await insertOrReplaceEntityAsync();

        // Define email content and options
        const mailOptions = {
            from: 'The Gyanodaya Team',
            to: Email,
            subject: 'Your OTP Code for Gyanodaya',
            text: `
            Dear Gyanodaya User,
            
            We hope this message finds you well.
            We are writing to provide you with your One-Time Password (OTP) code for Gyanodaya: 

            OTP Code : ${otp} 

            This OTP code is essential for accessing your Gyanodaya account or completing the verification process.
            If you did not request this OTP or require any assistance, please do not hesitate to contact our dedicated support team. You can reach us by sending an email to SMTP_GMAIL. Our team is always ready to assist you promptly and professionally.

            Thank you for choosing Gyanodaya, and we appreciate your trust in our services.

            Best regards,
            The Gyanodaya Team.
            `
        };

        // Function to send the email
        const sendMailAsync = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (!error) {
                        resolve();
                    } else {
                        reject(error);
                    }
                });
            });
        };

        await sendMailAsync();

        context.res = {
            status: 200,
            body: `OTP sent to ${Email}.`
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};





//    imp ............. below will only send email and otp, it will not store it to the azure table


// const nodemailer = require('nodemailer');

// // Function to generate a random 6-digit OTP
// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000);
// }

// module.exports = async function (context, req) {
//     const Email = req.query.Email;

//     if (!Email) {
//         context.res = {
//             status: 400,
//             body: "Please provide a user email in the query parameter."
//         };
//         return;
//     }

//     try {
//         const transporter = nodemailer.createTransport({
//             service: 'Gmail',
//             auth: {
//                 user: 'SMTP_GMAIL', 
//                 pass: 'SMTP_PASSWORD' 
//             }
//         });

//         // Generate a random 6-digit OTP
//         const otp = generateOTP();

//         const mailOptions = {
//             from: 'The Gyanodaya Team',
//             to: Email,
//             subject: 'Your OTP Code for Gyanodaya',
//             text: `
//             Dear Gyanodaya User,
            
//             We hope this message finds you well.
//             We are writing to provide you with your One-Time Password (OTP) code for Gyanodaya: 

//             OTP Code : ${otp} 

//             This OTP code is essential for accessing your Gyanodaya account or completing the verification process.
//             If you did not request this OTP or require any assistance, please do not hesitate to contact our dedicated support team.You can reach us by sending an email to SMTP_GMAIL. Our team is always ready to assist you promptly and professionally.

//             Thank you for choosing Gyanodaya, and we appreciate your trust in our services.

//             Best regards,
//             The Gyanodaya Team `
//         };

//         const info = await transporter.sendMail(mailOptions);

//         context.res = {
//             status: 200,
//             body: `OTP sent to ${Email}.`
//         };
//     } catch (error) {
//         context.res = {
//             status: 500,
//             body: `An error occurred: ${error.message}`
//         };
//     }
// };