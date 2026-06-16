/*
 Apply DB policies from files in db/ to the Supabase Postgres database.
 Usage: node scripts/apply-policies.js
 Requirements: Node 18+, install dependencies: npm install pg dotenv
 The script reads SUPABASE_DB_URL from environment or from .env.
*/

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
    console.error('SUPABASE_DB_URL not set in environment or .env');
    process.exit(1);
}

const sqlFiles = ['db/policies.sql', 'db/storage_policies.sql'];

async function run() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    try {
        for (const f of sqlFiles) {
            const filePath = path.resolve(f);
            if (!fs.existsSync(filePath)) {
                console.warn('SQL file not found, skipping:', f);
                continue;
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            console.log('Executing', f);
            // Execute as-is; files already use DROP POLICY where necessary.
            await client.query(sql);
            console.log('Executed', f);
        }
        console.log('All policies applied.');
    } catch (err) {
        console.error('Error applying policies:', err.message || err);
    } finally {
        await client.end();
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
