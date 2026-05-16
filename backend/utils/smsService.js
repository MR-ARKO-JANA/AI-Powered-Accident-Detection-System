const twilio = require('twilio');

const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendEmergencySMS = async (to, accidentDetails) => {
    // Only send if Twilio is configured
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn("⚠️ Twilio SID/Auth Token not set. Skipping SMS.");
        return;
    }

    try {
        await client.messages.create({
            body: `🚨 EMERGENCY: Accident detected at ${accidentDetails.location}. Severity: ${accidentDetails.severity}. Vehicle: ${accidentDetails.licensePlate || 'Unknown'}. View Map: ${accidentDetails.url}`,
            from: process.env.TWILIO_PHONE,
            to: to
        });
        console.log(`✅ SMS Sent Successfully to ${to}`);
    } catch (error) {
        console.error(`❌ SMS Failed for ${to}:`, error.message);
    }
};

module.exports = { sendEmergencySMS };
