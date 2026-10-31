import forgePreviews from '../data/forge-previews.json';
import type { Emote } from './pose';

export const FORGE_BASE = 'https://assets-gta.plebmasters.de/animations/';
const MAP = forgePreviews as Record<string, string>;

/** Rendu 3D statique du ped jouant exactement cette animation (Plebmasters Forge). */
export function previewFor(emote: Emote): string | null {
  const { dict, anim } = emote;
  if (typeof dict !== 'string' || typeof anim !== 'string' || !dict || !anim) return null;
  const rel = MAP[`${dict}@${anim}`];
  return rel ? `${FORGE_BASE}${rel}` : null;
}

export { FORGE_BASE as forgeSourcePage };
