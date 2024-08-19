const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
console.log(process.env);
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, APS_APP_NAME, SERVER_SESSION_SECRET } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL || !APS_APP_NAME || !SERVER_SESSION_SECRET) {
    console.error('Missing some of the environment variables.');
    process.exit(1);
}
const PORT = process.env.PORT || 9090;
const APS_BUCKET_KEY = process.env.APS_BUCKET_KEY || APS_CLIENT_ID.toLowerCase() + '-shares';

module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    APS_APP_NAME,
    APS_BUCKET_KEY,
    SERVER_SESSION_SECRET,
    PORT
};
