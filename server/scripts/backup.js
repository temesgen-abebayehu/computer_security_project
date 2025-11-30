import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const backupDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const date = new Date().toISOString().replace(/:/g, '-');
const backupPath = path.join(backupDir, `backup-${date}`);

// MongoDB URI parsing to get host/port/db
// Assuming standard URI format: mongodb://host:port/db
// For simplicity, we'll just use the URI if mongodump supports it, or parse it.
// mongodump --uri="mongodb://..."

const cmd = `mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`;

console.log(`Starting backup to ${backupPath}...`);

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`Backup stderr: ${stderr}`);
  }
  console.log(`Backup successful!`);
});
