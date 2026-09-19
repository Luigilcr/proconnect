const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function cleanAll() {
  console.log('--- Cleaning Supabase database ---');
  
  // 1. Delete whatsapp_leads
  const { error: wErr } = await supabase.from('whatsapp_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Delete whatsapp_leads:', wErr);

  // 2. Delete card_links
  const { error: lErr } = await supabase.from('card_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Delete card_links:', lErr);

  // 3. Delete cards
  const { error: cErr } = await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Delete cards:', cErr);

  // 4. Delete organizations
  const { error: oErr } = await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Delete organizations:', oErr);

  // 5. Get all users and delete those that are not Luigi or Admin
  const { data: users } = await supabase.from('users').select('*');
  if (users && users.length > 0) {
    for (const u of users) {
      const email = (u.email || '').toLowerCase().trim();
      if (email !== 'luigicolonico@gmail.com' && email !== 'admin@proconnect.app') {
        const { error: delErr } = await supabase.from('users').delete().eq('id', u.id);
        console.log(`Deleted user ${email} (${u.id}):`, delErr);
      } else {
        // Ensure Luigi is superadmin
        await supabase.from('users').update({ role: 'superadmin' }).eq('id', u.id);
        console.log(`Kept admin user ${email}`);
      }
    }
  }

  // 6. Verify what users remain
  const { data: remainingUsers } = await supabase.from('users').select('*');
  console.log('Remaining users in Supabase:', remainingUsers);

  // 7. Verify cards count
  const { data: remainingCards } = await supabase.from('cards').select('*');
  console.log('Remaining cards count in Supabase:', remainingCards?.length);

  // 8. Clean data/cards.json file
  if (fs.existsSync('data/cards.json')) {
    fs.writeFileSync('data/cards.json', '[]', 'utf8');
    console.log('data/cards.json emptied.');
  }
}

cleanAll();
