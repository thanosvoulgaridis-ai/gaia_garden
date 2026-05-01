export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message required' });
  }

  const APIFON_TOKEN = process.env.APIFON_TOKEN;

  const response = await fetch('https://api.apifon.com/v1/sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + APIFON_TOKEN
    },
    body: JSON.stringify({
      recipients: [{ phone: phone }],
      text: message,
      sender: 'ShiftKos'
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}
