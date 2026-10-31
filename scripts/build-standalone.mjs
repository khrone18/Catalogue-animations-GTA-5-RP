#!/usr/bin/env node
/**
 * Builds a single, fully offline HTML file containing the CSS and JS bundles.
 * Usage: npm run standalone
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'generated-artifacts');

let html = await readFile(path.join(dist, 'index.html'), 'utf8');

const styles = html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/gi) ?? [];
if (styles.length === 0) throw new Error('Aucune feuille de style trouvée dans dist/index.html');

for (const tag of styles) {
  const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
  if (!href || /^https?:/i.test(href)) throw new Error(`Référence CSS inattendue : ${tag}`);
  const css = await readFile(path.join(dist, href.replace(/^\/+/, '')), 'utf8');
  html = html.replace(tag, () => `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`);
}

const scripts = html.match(/<script\b[^>]*type="module"[^>]*src="[^"]+"[^>]*>\s*<\/script>/gi) ?? [];
if (scripts.length === 0) throw new Error('Aucun module JS trouvé dans dist/index.html');

for (const tag of scripts) {
  const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
  if (!src || /^https?:/i.test(src)) throw new Error(`Référence JS inattendue : ${tag}`);
  const js = await readFile(path.join(dist, src.replace(/^\/+/, '')), 'utf8');
  html = html.replace(tag, () => `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
}

html = html
  .replace(/<link\b[^>]*rel="icon"[^>]*>/gi, '')
  .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi, '')
  .replace(/\s+crossorigin(=("|')[^"']*\2)?/gi, '');

await mkdir(outDir, { recursive: true });
const target = path.join(outDir, 'terrain-emotes-offline.html');
await writeFile(target, html, 'utf8');
console.log(`✓ Fichier autonome : ${path.relative(root, target)} (${(html.length / 1024).toFixed(0)} Ko)`);
