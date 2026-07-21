import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const recommended = [
  'VITE_STRIPE_PUBLIC_KEY',
  'VITE_STRIPE_STARTER_PRICE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_TEMPLATE_ID',
  'VITE_EMAILJS_MEMBER_TEMPLATE_ID',
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return env;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = value;
      return env;
    }, {});
}

const fileEnv = parseEnvFile(envPath);
const mergedEnv = { ...fileEnv, ...process.env };

const missingRequired = required.filter((key) => !mergedEnv[key]);
const missingRecommended = recommended.filter((key) => !mergedEnv[key]);

if (missingRequired.length > 0) {
  console.error(`Variables obligatoires manquantes: ${missingRequired.join(', ')}`);
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`Variables recommandees absentes: ${missingRecommended.join(', ')}`);
}

console.log('Configuration environnement OK.');
