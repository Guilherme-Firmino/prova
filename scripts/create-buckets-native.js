// Script que usa fetch nativo (Node 18+) para criar buckets e fazer upload de teste
// Requer definir SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;
if (!url || !key) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE como variáveis de ambiente.');
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
    const resp = await fetch(`${url.replace(/\/$/, '')}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ id: b.id, name: b.id, public: b.public }),
    });
    const text = await resp.text();
    console.log(`create ${b.id}:`, resp.status, text);
}

async function uploadTest() {
    const path = 'test-upload.txt';
    const resp = await fetch(`${url.replace(/\/$/, '')}/storage/v1/object/videos/${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${key}`,
        },
        body: 'memeflow-test',
    });
    const text = await resp.text();
    console.log('upload test:', resp.status, text);
}

(async () => {
    for (const b of buckets) {
        try {
            await createBucket(b);
        } catch (err) {
            console.error('erro createBucket', b.id, err);
        }
    }
    try {
        await uploadTest();
    } catch (err) {
        console.error('erro uploadTest', err);
    }
})();
