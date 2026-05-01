import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const APIFON_TOKEN = process.env.APIFON_TOKEN;

async function sendSMS(phone, message) {
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
  return response.json();
}

export default async function handler(req, res) {
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  const { data: hotels } = await supabase.from('hotels').select('*');
  const alerts = [];

  for (const hotel of hotels) {
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('hotel_id', hotel.id);

    if (!employees) continue;

    for (const emp of employees) {
      const startPlus10 = addMinutes(emp.shift_start, 10);
      const endPlus10 = addMinutes(emp.shift_end, 10);

      if (currentTime === startPlus10 && emp.status === 'missing') {
        const msg = emp.name + ' (' + emp.department + ') δεν δήλωσε ΕΝΑΡΞΗ βάρδιας ' + emp.shift_start + '. — ShiftKos';
        if (hotel.master_phone) {
          await sendSMS(hotel.master_phone, msg);
          alerts.push(msg);
        }
      }

      if (currentTime === endPlus10 && emp.status === 'ok') {
        const msg = emp.name + ' (' + emp.department + ') δεν δήλωσε ΛΗΞΗ βάρδιας ' + emp.shift_end + '. — ShiftKos';
        if (hotel.master_phone) {
          await sendSMS(hotel.master_phone, msg);
          alerts.push(msg);
        }
      }
    }
  }

  return res.status(200).json({ 
    time: currentTime,
    alerts: alerts.length,
    messages: alerts
  });
}

function addMinutes(time, mins) {
  const parts = time.split(':');
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return newH.toString().padStart(2,'0') + ':' + newM.toString().padStart(2,'0');
}
