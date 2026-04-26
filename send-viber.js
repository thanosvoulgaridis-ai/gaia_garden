const https = require('https');

const API_KEY = '597a0f6b';
const API_SECRET = '7Ruhq(!Y!Y^ng0ri!22O0';
const TO_NUMBER = '306906259244';

const data = JSON.stringify({
  from: "14157386102",
  to: TO_NUMBER,
  message_type: "text",
  text: "⚠️ GAIA GARDEN: Δοκιμαστικό μήνυμα από ShiftKos! Το σύστημα λειτουργεί! ✅",
  channel: "viber_service"
});

const options = {
  hostname: 'messages-sandbox.nexmo.com',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(API_KEY + ':' + API_SECRET).toString('base64')
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
