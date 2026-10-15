#!/usr/bin/env npx tsx
/**
 * Removes DARE principle labels from GitLab that don't belong to the selected language.
 *
 * Usage:  npx tsx scripts/clean-dare-labels.ts
 *
 * Reads GITLAB_API_URL, GITLAB_ACCESS_TOKEN, and GITLAB_PROJECT_PATH from .env
 */

import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

import en from '../src/locales/en';
import de from '../src/locales/de';
import fr from '../src/locales/fr';
import it from '../src/locales/it';

// ── Locale map ───────────────────────────────────────────────────────────────

type LocaleCode = 'en' | 'de' | 'fr' | 'it';

const LOCALES: Record<LocaleCode, { label: string; data: Record<string, { name: string }> }> = {
  en: { label: 'English',  data: en },
  de: { label: 'Deutsch',  data: de },
  fr: { label: 'Français', data: fr },
  it: { label: 'Italiano', data: it },
};

const PRINCIPLE_IDS = ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008', 'P009'];

function getLabelNames(locale: LocaleCode): Set<string> {
  const names = new Set<string>();
  for (const id of PRINCIPLE_IDS) {
    const name = LOCALES[locale].data[id]?.name;
    if (name) names.add(name);
  }
  return names;
}

function getAllDareLabelNames(): Set<string> {
  const all = new Set<string>();
  for (const code of Object.keys(LOCALES) as LocaleCode[]) {
    for (const name of getLabelNames(code)) {
      all.add(name);
    }
  }
  return all;
}

// ── .env loader (minimal, no dependency) ─────────────────────────────────────

function loadEnv(): void {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── GitLab helpers ───────────────────────────────────────────────────────────

interface GitLabLabel {
  id: number;
  name: string;
  color: string;
}

async function fetchLabels(apiUrl: string, projectPath: string, token: string): Promise<GitLabLabel[]> {
  const all: GitLabLabel[] = [];
  let page = 1;
  while (true) {
    const url = `${apiUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/labels?per_page=100&page=${page}`;
    const res = await fetch(url, { headers: { 'PRIVATE-TOKEN': token } });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
    const batch = (await res.json()) as GitLabLabel[];
    if (batch.length === 0) break;
    all.push(...batch);
    page++;
  }
  return all;
}

async function deleteLabel(apiUrl: string, projectPath: string, token: string, labelId: number): Promise<void> {
  const url = `${apiUrl}/api/v4/projects/${encodeURIComponent(projectPath)}/labels/${labelId}`;
  const res = await fetch(url, { method: 'DELETE', headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) throw new Error(`DELETE ${url} → ${res.status} ${res.statusText}`);
}

// ── Interactive prompt ───────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();

  const apiUrl = process.env.GITLAB_API_URL;
  const token = process.env.GITLAB_ACCESS_TOKEN;
  const projectPath = process.env.GITLAB_PROJECT_PATH;

  if (!apiUrl || !token || !projectPath) {
    console.error('Missing env vars. Set GITLAB_API_URL, GITLAB_ACCESS_TOKEN, GITLAB_PROJECT_PATH in .env');
    process.exit(1);
  }

  // ── Language selection ───────────────────────────────────────────────────

  const codes = Object.keys(LOCALES) as LocaleCode[];

  console.log('\n  Welche Sprache soll beibehalten werden?\n');
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const names = [...getLabelNames(code)].join(', ');
    console.log(`  [${i + 1}] ${LOCALES[code].label}  (${code})  →  ${names}`);
  }
  console.log();

  const answer = await prompt('  Auswahl (1-4): ');
  const idx = parseInt(answer, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= codes.length) {
    console.error('Ungültige Auswahl.');
    process.exit(1);
  }

  const keepLocale = codes[idx];
  const keepNames = getLabelNames(keepLocale);
  const allDareNames = getAllDareLabelNames();

  console.log(`\n  Behalte Labels für: ${LOCALES[keepLocale].label} (${keepLocale})`);
  console.log(`  Labels: ${[...keepNames].join(', ')}\n`);

  // ── Fetch existing labels from GitLab ──────────────────────────────────

  console.log('  Labels aus GitLab laden...');
  const labels = await fetchLabels(apiUrl, projectPath, token);

  // Find DARE labels that are NOT in the keep set
  const toDelete = labels.filter((l) => allDareNames.has(l.name) && !keepNames.has(l.name));

  if (toDelete.length === 0) {
    console.log('  Keine Labels zum Entfernen gefunden. Fertig.\n');
    return;
  }

  console.log(`\n  Folgende ${toDelete.length} Labels werden entfernt:\n`);
  for (const l of toDelete) {
    console.log(`    - ${l.name}`);
  }
  console.log();

  const confirm = await prompt('  Fortfahren? (j/n): ');
  if (confirm.toLowerCase() !== 'j' && confirm.toLowerCase() !== 'y') {
    console.log('  Abgebrochen.\n');
    return;
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  for (const l of toDelete) {
    process.stdout.write(`  Lösche "${l.name}"...`);
    await deleteLabel(apiUrl, projectPath, token, l.id);
    console.log(' OK');
  }

  console.log(`\n  Fertig. ${toDelete.length} Labels entfernt.\n`);
}

main().catch((err) => {
  console.error('Fehler:', err);
  process.exit(1);
});
