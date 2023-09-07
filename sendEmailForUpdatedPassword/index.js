const nodemailer = require('nodemailer');

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

        // Define email content and options
        const mailOptions = {
            from: 'The Gyanodaya Team',
            to: Email,
            subject: 'Password Update Confirmation for Gyanodaya',
            text: `
            Dear Gyanodaya User,
            
            We hope this message finds you well.
            Your password has been successfully updated for your Gyanodaya account.

            If you did not make this change or have any concerns, please contact our support team immediately by sending an email to SMTP_GMAIL.

            Thank you for choosing Gyanodaya, and we appreciate your trust in our services.

            Best regards,
            The Gyanodaya Team. `
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);

        context.res = {
            status: 200,
            body: "Password update confirmation email sent."
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};
