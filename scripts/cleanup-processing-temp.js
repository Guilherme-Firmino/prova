// Limpa arquivos antigos do bucket 'processing-temp'.
// Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE no .env
// Instalar dependência: npm install @supabase/supabase-js
// Uso: node scripts/cleanup-processing-temp.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE no .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const bucket = 'processing-temp';
const maxAgeHours = parseInt(process.env.CLEANUP_MAX_AGE_HOURS || '48', 10);

async function run() {
    const { data: objects, error } = await supabase.storage.from(bucket).list('', { limit: 1000, sortBy: { column: 'updated_at', order: 'asc' } });
    if (error) {
        console.error('Erro ao listar objetos:', error);
        return;
    }
    const toDelete = objects.filter(o => {
        if (!o.updated_at) return false;
        const updated = new Date(o.updated_at).getTime();
        return (Date.now() - updated) > maxAgeHours * 3600 * 1000;
    }).map(o => o.name);

    if (toDelete.length === 0) {
        console.log('Nenhum arquivo antigo para deletar.');
        return;
    }

    console.log('Removendo', toDelete.length, 'arquivos...');
    const { error: delError } = await supabase.storage.from(bucket).remove(toDelete);
    if (delError) console.error('Erro ao remover arquivos:', delError);
    else console.log('Remoção concluída.');
}

run().catch(console.error);
