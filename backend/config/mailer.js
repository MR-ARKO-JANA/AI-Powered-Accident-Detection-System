const nodemailer = require("nodemailer");

// Create transporter once and reuse (connection pooling)
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail', // Or use your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            pool: true, // Use connection pooling
            maxConnections: 3,
        });
    }
    return transporter;
};

const sendEmail = async (to, subject, text, html) => {
    try {
        const transport = getTransporter();

        const mailOptions = {
            from: `"APADS Emergency System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transport.sendMail(mailOptions);
        console.log("✅ Email sent: " + info.response);
        return info;
    } catch (error) {
        console.error("❌ Email error: ", error);
        throw error;
    }
};

module.exports = sendEmail;
