import type { Emote, Kind } from './pose';

export type Syntax = 'e' | 'emote' | 'eplay';
export type ResourceFilter = 'all' | 'rpemotes' | 'scully';

export const KIND_LABEL: Record<Kind, string> = {
  animation: 'Animation',
  scenario: 'Scénario',
  prop: 'Objet',
  animal: 'Animal',
  synchronized: 'Duo',
  expression: 'Expression',
  walk: 'Démarche',
};

export const KIND_HINT: Record<Kind, string> = {
  animation: 'Animation de personnage jouée en boucle ou one-shot.',
  scenario: 'Scénario natif GTA V (le pédestal / l’ambiance est fourni par le jeu).',
  prop: 'Animation avec un objet attaché à une bone du personnage.',
  animal: 'Animation conçue pour un animal (chien, etc.).',
  synchronized: 'Emote à deux : les deux joueurs jouent des animations complémentaires.',
  expression: 'Mood / expression faciale persistante.',
  walk: 'Style de démarche (movement clipset).',
};

export function sourceLabel(emote: Emote): string {
  if (emote.sources.length > 1) return 'rpemotes + Scully';
  return emote.sources[0] === 'scully' ? 'scully_emotemenu' : 'rpemotes-reborn';
}

export function primaryResource(emote: Emote, filter: ResourceFilter): 'rpemotes' | 'scully' {
  if (filter !== 'all') return filter;
  return emote.sources.includes('scully') ? 'scully' : 'rpemotes';
}

export interface CommandInfo {
  command: string;
  hint: string;
}

export function commandFor(emote: Emote, syntax: Syntax, resource: ResourceFilter): CommandInfo {
  const res = primaryResource(emote, resource);
  if (emote.kind === 'walk') {
    return res === 'scully'
      ? { command: `/w ${emote.command}`, hint: 'scully_emotemenu · /w ou /walk' }
      : { command: `/walk ${emote.command}`, hint: 'rpemotes-reborn · /walk <style>' };
  }
  if (emote.kind === 'expression') {
    return res === 'scully'
      ? { command: `/f ${emote.command}`, hint: 'scully_emotemenu · /f ou /face' }
      : { command: `/mood ${emote.command}`, hint: 'rpemotes-reborn · /mood <nom>' };
  }
  return { command: `/${syntax} ${emote.command}`, hint: 'commande chat de la ressource' };
}

export function altCommand(emote: Emote, syntax: Syntax): string | null {
  if (emote.kind === 'walk') {
    return emote.sources.includes('rpemotes') ? `/walk ${emote.command}` : `/w ${emote.command}`;
  }
  if (emote.kind === 'expression') {
    return emote.sources.includes('rpemotes') ? `/mood ${emote.command}` : `/f ${emote.command}`;
  }
  return `/${syntax} ${emote.command}`;
}
