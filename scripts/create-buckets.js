// Script para criar buckets via API REST do Supabase
// Requer: SUPABASE_URL (ex: https://<ref>.supabase.co) e SUPABASE_SERVICE_ROLE (service_role key)
// Uso: node scripts/create-buckets.js

const fetch = global.fetch || require('node-fetch');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !key) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente.');
    process.exit(1);
}

const buckets = [
    { id: 'videos', public: false },
    { id: 'thumbnails', public: true },
    { id: 'avatars', public: true },
    { id: 'attachments', public: false },
    { id: 'processing-temp', public: false },
    { id: 'assets', public: true },
    { id: 'backups', public: false }
];

async function createBucket(b) {
    const res = await fetch(`${url.replace(/\/$/, '')}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ id: b.id, name: b.id, public: b.public })
    });
    const data = await res.text();
    if (!res.ok) {
        console.error('Erro criando bucket', b.id, res.status, data);
    } else {
        console.log('Criado/confirmado bucket', b.id);
    }
}

(async () => {
    for (const b of buckets) {
        await createBucket(b);
    }
})();
