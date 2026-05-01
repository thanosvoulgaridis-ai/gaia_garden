import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('employees')
    .update({ status: 'missing' })
    .neq('name', '');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    success: true, 
    message: 'Status reset to missing for all employees',
    time: new Date().toISOString()
  });
}
