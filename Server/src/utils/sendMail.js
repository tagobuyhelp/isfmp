import transporter from '../mail/mail.connect.js';

/**
 * Utility function to send emails.
 *
 * @param {string} to - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text body of the email (optional).
 * @param {string} html - The HTML body of the email (optional).
 * @param {Array} attachments - List of file attachments (optional).
 * @returns {Promise} - A promise that resolves if the email was sent successfully or rejects if there was an error.
 */
const sendMail = async ({ to, subject, text = '', html = '', attachments = [] }) => {
    console.log('Recipient: ', to);
    try {
        const mailOptions = {
            from: `"ISF" <${process.env.EMAIL_USER}>`, // Sender name and address
            to,                            // Recipient(s)
            subject,                       // Subject line
            text,                          // Plain text body
            html,                          // HTML body (if any)
            attachments,                   // Attachments (if any)
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
    }
};

export { sendMail };
