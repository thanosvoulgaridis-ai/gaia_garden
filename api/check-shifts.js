import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TWILIO_FUNCTION_URL = 'https://shiftkos-whatsapp-3139.twil.io/welcome';

export default async function handler(req, res) {
  // Security check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Get all employees
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });

  const alerts = [];

  for (const emp of employees) {
    const shiftStart = emp.shift_start; // e.g. "07:00"
    const shiftEnd = emp.shift_end;     // e.g. "15:30"

    // Check if 10 minutes have passed since shift start
    const startPlus10 = addMinutes(shiftStart, 10);
    const endPlus10 = addMinutes(shiftEnd, 10);

    // Check for missing check-in
    if (currentTime === startPlus10) {
      const { data: checkin } = await supabase
        .from('checkins')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('type', 'start')
        .gte('created_at', todayStart())
        .single();

      if (!checkin) {
        alerts.push(`${emp.name} (${emp.department}) δεν δήλωσε ΕΝΑΡΞΗ βάρδιας ${shiftStart}`);
      }
    }

    // Check for missing check-out
    if (currentTime === endPlus10) {
      const { data: checkout } = await supabase
        .from('checkins')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('type', 'end')
        .gte('created_at', todayStart())
        .single();

      if (!checkout) {
        alerts.push(`${emp.name} (${emp.department}) δεν δήλωσε ΛΗΞΗ βάρδιας ${shiftEnd}`);
      }
    }
  }

  // Send WhatsApp for each alert
  for (const msg of alerts) {
    await fetch(`${TWILIO_FUNCTION_URL}?msg=${encodeURIComponent(msg)}`);
  }

  return res.status(200).json({ 
    checked: employees.length, 
    alerts: alerts.length,
    messages: alerts,
    time: currentTime
  });
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2,'0')}:${String(newM).padStart(2,'0')}`;
}

function todayStart() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString();
}
