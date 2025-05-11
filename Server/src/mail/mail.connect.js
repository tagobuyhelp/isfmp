import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, // true for port 465, false for other ports
    auth: {
        user: "info@tagobuy.net",
        pass: "tarikAziz@703330",
    },
});

export default transporter;
