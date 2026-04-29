// scripts/hash-password.js — Util CLI: genera hash bcrypt para ADMIN_PASSWORD_HASH.
// Uso: node scripts/hash-password.js
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const rl = readline.createInterface({ input: stdin, output: stdout });
const password = await rl.question('Password (mínimo 8 chars): ');
rl.close();

if (!password || password.length < 8) {
  console.error('Password debe tener al menos 8 caracteres.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nADMIN_PASSWORD_HASH=' + hash);
console.log('\nPegá esa línea en Vercel → Settings → Environment Variables (o en .env.local para dev).');
