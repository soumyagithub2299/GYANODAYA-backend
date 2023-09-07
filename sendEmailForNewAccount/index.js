const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    // Extract email and name from query parameters
    const Email = req.query.Email;
    const Name = req.query.Name;

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

        // Define email content and options
        const mailOptions = {
            from: 'The Gyanodaya Team',
            to: Email,
            subject: 'Welcome to Gyanodaya - Your Account Details',
            text: `
            Dear ${Name},

            We trust this message finds you in good health and high spirits.
            
            We are delighted to welcome you to Gyanodaya, where your pursuit of knowledge and growth begins. Your new Gyanodaya account has been successfully created, and we are thrilled to have you on board.
            
            Here are your account details:
            
            Username: ${Name}
            Email Address: ${Email} 

            To ensure the security of your account, we recommend that you take the following steps:
            
            1. - Password Update: We have already taken the liberty of updating your password for added security. Your new password is a randomly generated string of characters. You will need to use this password to log in for the first time. Please make sure to change it to a personalized password of your choice after your initial login.

            2. - Login Credentials: Please keep your login credentials confidential. Do not share your username and password with anyone. Gyanodaya will never ask you for your password through email or any other communication channel.
            
            3. - Account Verification: If you encounter any suspicious activity or did not create this account, please contact our support team immediately at SMTP_GMAIL. We take your security seriously and will assist you promptly.
            
            We believe in fostering an environment where knowledge thrives, and our dedicated team is here to support you on your educational journey. If you have any questions, feedback, or require assistance with your account, please do not hesitate to reach out to us at SMTP_GMAIL.
            Thank you for choosing Gyanodaya as your educational partner. We appreciate your trust in our services and look forward to helping you achieve your learning goals.

            Best regards,

            The Gyanodaya Team.

            `
        };

        // Send the email and capture information about the sent email
        const info = await transporter.sendMail(mailOptions);

        // Send a success response
        context.res = {
            status: 200,
            body: "Mail sent for successfully created a new account."
        };
    } catch (error) {
        // Handle errors and send an error response
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};
