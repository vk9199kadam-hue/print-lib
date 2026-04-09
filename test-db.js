import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env manually for this test script
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('Testing connection to:', url);

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('librarians').select('count', { count: 'exact', head: true });
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "librarians" does not exist')) {
      console.log('✅ Connection Successful!');
      console.log('⚠️  But the "librarians" table does not exist yet. Please run schema.sql.');
    } else {
      console.error('❌ Connection Failed:', error.message);
    }
  } else {
    console.log('✅ Connection Successful and tables exist!');
  }
}

test();
