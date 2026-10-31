import type { PoseId } from '../lib/pose';
import type { PoseState } from './emoteTypes';

export type { PoseId };

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

const sw = (t: number, f = 2.2) => Math.sin(t * f);
const cw = (t: number, f = 2.2) => Math.cos(t * f);

/*beat : quantifie le temps en doubles-croches pour les gestes « staccato » */

const REST: PoseState = {
  rootY: 0,
  rootRotX: 0,
  hipsX: 0,
  hipsZ: 0,
  torsoX: 0,
  torsoZ: 0,
  headX: 0.05,
  headY: 0,
  armLUx: 0.12,
  armLUz: 0.22,
  armLFx: -0.28,
  armRUx: 0.12,
  armRUz: -0.22,
  armRFx: -0.28,
  legLUx: 0.04,
  legLUz: 0.06,
  legLLx: -0.04,
  legRUx: 0.04,
  legRUz: -0.06,
  legRLx: -0.04,
  chestPop: 0,
};

/* ------------------------- Chorégraphies de danse -------------------------
   8 routines distinctes : chaque style a sa signature (pieds, hanches, bras). */
function danceStyle(style: number, t: number, p: PoseState): void {
  const f = 2.4;
  switch (style) {
    case 0: {
      // Shuffle : pieds qui glissent alternés, bras bas battants
      p.rootY = Math.abs(sw(t, f)) * 0.09;
      p.hipsZ = sw(t, f / 2) * 0.2;
      p.legLUx = -Math.max(0, sw(t, f)) * 0.85;
      p.legRUx = -Math.max(0, -sw(t, f)) * 0.85;
      p.legLLx = 1.1;
      p.legRLx = 1.1;
      p.legLUz = sw(t, f / 2) * 0.3;
      p.legRUz = -sw(t, f / 2) * 0.3;
      p.armLUx = 0.6 + sw(t, f) * 0.35;
      p.armRUx = 0.6 - sw(t, f) * 0.35;
      p.armLFx = -0.9;
      p.armRFx = -0.9;
      break;
    }
    case 1: {
      // Twist : bassin en rotation, coudes qui pompent
      p.hipsZ = sw(t, f * 2) * 0.34;
      p.torsoZ = -sw(t, f * 2) * 0.2;
      p.rootY = Math.abs(sw(t, f * 2)) * 0.05;
      p.armLUx = -1.05 + Math.abs(sw(t, f * 2)) * 0.35;
      p.armRUx = -1.05 - Math.abs(sw(t, f * 2)) * 0.35;
      p.armLUz = 0.45;
      p.armRUz = -0.45;
      p.armLFx = -1.5;
      p.armRFx = -1.5;
      p.legLLx = Math.max(0, sw(t, f * 2)) * 0.55;
      break;
    }
    case 2: {
      // Wave bras : ondulations alternées au-dessus de la tête
      p.armLUx = -2.75 + sw(t, f) * 0.5;
      p.armRUx = -2.75 + sw(t, f + Math.PI) * 0.5;
      p.armLUz = 0.3 + cw(t, f) * 0.25;
      p.armRUz = -0.3 - cw(t, f + Math.PI) * 0.25;
      p.armLFx = -0.3 + sw(t, f * 1.5) * 0.3;
      p.armRFx = -0.3 - sw(t, f * 1.5) * 0.3;
      p.hipsZ = sw(t, f / 2) * 0.16;
      p.rootY = Math.abs(sw(t, f)) * 0.07;
      break;
    }
    case 3: {
      // Krump : staccato ! chests pops sur le beat, coup de pied
      const b = Math.floor(t * 3);
      const on = b % 2 === 0;
      const pop = Math.max(0, Math.sin(t * 3 * Math.PI));
      p.chestPop = pop;
      p.torsoX = 0.12 + (on ? 0.16 : -0.1);
      p.armRUx = on ? -1.9 : -0.35;
      p.armRUz = on ? -0.5 : -0.15;
      p.armLUx = -2.5 + (b % 4) * 0.5;
      p.legRUx = on ? -0.75 : -0.1;
      p.legRLx = on ? 1.2 : 0.15;
      p.rootY = pop * 0.05;
      p.hipsZ = sw(t, 1.5) * 0.12;
      break;
    }
    case 4: {
      // Bachata : déhanché en 8, un bras au ciel, l'autre souple
      p.hipsZ = sw(t, f) * 0.36;
      p.hipsX = cw(t, f) * 0.14;
      p.rootY = Math.abs(sw(t, f)) * 0.08;
      p.armLUx = -2.8 + cw(t, f) * 0.25;
      p.armLUz = 0.35;
      p.armRUx = 0.25;
      p.armRUz = -0.85;
      p.armRFx = -1.2;
      p.armLFx = -0.35;
      p.legLUz = sw(t, f) * 0.22;
      p.legRUz = sw(t, f) * 0.22;
      break;
    }
    case 5: {
      // Robot : poses figées en étapes (aucune interpolation douce)
      const q = Math.floor(t * 2.2) % 4;
      const[angA, angB] = [
        [-2.2, -1.1],
        [-1.2, -2.2],
        [-2.8, -0.8],
        [-0.9, -2.6],
      ][q % 4];
      p.armLUx = angA;
      p.armRUx = angB;
      p.armLUz = q % 2 ? 0.75 : 0.2;
      p.armRUz = q % 2 ? -0.2 : -0.75;
      p.armLFx = -0.15;
      p.armRFx = -0.15;
      p.torsoZ = (q % 2 ? -1 : 1) * 0.12;
      p.headY = (q < 2 ? -0.4 : 0.4);
      p.hipsZ = (q % 2 ? 1 : -1) * 0.14;
      break;
    }
    case 6: {
      // Floss : bras balayent d'un côté pendant que les hanches vont à l'opposé
      const d = sw(t, f);
      p.hipsZ = d * 0.3;
      p.armLUx = -1.35;
      p.armRUx = -1.35;
      p.armLUz = 0.55 + d * 1.1;
      p.armRUz = -0.55 + d * 1.1;
      p.armLFx = -1.35 + d * 0.35;
      p.armRFx = -1.35 + d * 0.35;
      p.rootY = Math.abs(sw(t, f * 2)) * 0.05;
      break;
    }
    default: {
      // Jump : deux pieds qui sautent, genoux rentrés, bras au ciel
      const hop = Math.max(0, Math.sin(t * f));
      p.rootY = hop * 0.16;
      p.legLUx = hop * 1.35;
      p.legRUx = hop * 1.35;
      p.legLLx = hop * 1.7;
      p.legRLx = hop * 1.7;
      p.armLUx = -2.6 + (1 - hop) * 0.7;
      p.armRUx = -2.6 + (1 - hop) * 0.7;
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.headX = -0.1 - hop * 0.15;
      break;
    }
  }
}

/* ------------------------- Poses (41 gestes types) -------------------------
   Retourne un état cible continu à t ; lissage géré par le composant. */
export function poseFor(pose: PoseId, t: number, seed: number): PoseState {
  const p: PoseState = { ...REST };
  switch (pose) {
    case 'wave':
      p.armRUx = -2.5 + sw(t, 3 + (seed % 4) * 0.2) * 0.34;
      p.armRUz = -0.42;
      p.armRFx = -0.5 + sw(t, 3.2) * 0.55;
      p.armLUx = 0.15;
      p.headY = cw(t, 1.6) * 0.1;
      p.torsoZ = cw(t, 1.6) * 0.05;
      break;
    case 'salute':
      p.armRUx = -2.2;
      p.armRUz = -0.75;
      p.armRFx = -1.9;
      p.headX = -0.04;
      break;
    case 'point':
      p.armRUx = -1.35;
      p.armRUz = -0.35;
      p.armRFx = -0.06;
      p.torsoZ = 0.07;
      p.headY = -0.3;
      break;
    case 'clap':
      p.armLUx = -1.15;
      p.armRUx = -1.15;
      p.armLFx = -1.05 + sw(t, 6) * 0.26;
      p.armRFx = -1.05 - sw(t, 6) * 0.26;
      p.armLUz = 0.38;
      p.armRUz = -0.38;
      p.rootY = Math.abs(sw(t, 6)) * 0.02;
      break;
    case 'cheer':
      p.armLUx = -2.7 + sw(t, 4) * 0.28;
      p.armRUx = -2.7 - sw(t, 4) * 0.28;
      p.armLUz = 0.35;
      p.armRUz = -0.35;
      p.rootY = Math.abs(sw(t, 4)) * 0.08;
      p.headX = -0.18;
      break;
    case 'dance':
      danceStyle(seed % 8, t, p);
      break;
    case 'sit':
      p.rootY = -0.42;
      p.torsoX = 0.12 + sw(t, 0.9) * 0.015;
      p.legLUx = -1.55;
      p.legRUx = -1.55;
      p.legLLx = 1.5;
      p.legRLx = 1.5;
      p.armLUz = 0.45 + sw(t, 0.7) * 0.06;
      p.armRUz = -0.45 - sw(t, 0.7) * 0.06;
      p.armLFx = -0.35;
      p.armRFx = -0.35;
      break;
    case 'kneel':
      p.rootY = -0.34;
      p.legLUx = -1.2;
      p.legLLx = 2.1;
      p.legRUx = -0.4;
      p.legRLx = 0.75;
      p.torsoX = 0.1;
      p.armLFx = -0.5;
      p.armRFx = -0.5;
      break;
    case 'lie':
      p.rootRotX = -1.35;
      p.rootY = 0.58;
      p.armLUz = 0.9;
      p.armRUz = -0.9;
      p.legLUz = 0.14;
      p.legRUz = -0.14;
      p.headX = 0.2;
      break;
    case 'crouch':
      p.rootY = -0.28;
      p.legLUx = -0.95;
      p.legRUx = -0.95;
      p.legLLx = 1.55;
      p.legRLx = 1.55;
      p.torsoX = 0.3;
      break;
    case 'lean':
      p.hipsZ = 0.16;
      p.torsoZ = -0.1;
      p.legLLx = 0.14;
      p.armLUz = 0.75;
      p.armRUz = -0.28;
      p.armLFx = -1.15;
      break;
    case 'think':
      p.armLFx = -2.2;
      p.armRUx = -1.1;
      p.armRFx = -2.3;
      p.torsoX = 0.14;
      p.headX = 0.3 + sw(t, 0.9) * 0.06;
      p.headY = 0.35;
      break;
    case 'facepalm':
      p.armRUx = -2.45;
      p.armRUz = -0.2;
      p.armRFx = -1.05;
      p.headX = 0.42;
      p.torsoX = 0.18;
      break;
    case 'crossarms':
      p.armLUx = -0.85;
      p.armRUx = -0.85;
      p.armLUz = 0.55;
      p.armRUz = -0.55;
      p.armLFx = -1.45;
      p.armRFx = -1.45;
      p.headX = 0.12;
      break;
    case 'thumbs':
      p.armRUx = -1.5;
      p.armRUz = -0.15;
      p.armRFx = -0.35;
      p.torsoZ = -0.05;
      p.headY = 0.2;
      break;
    case 'middlefinger':
      p.armRUx = -1.15;
      p.armRUz = -0.5;
      p.armRFx = -0.6;
      p.headY = -0.2;
      break;
    case 'handshake':
      p.armRUx = -1.02;
      p.armRUz = -0.12;
      p.armRFx = -0.12 + sw(t, 1.4) * 0.14;
      p.torsoZ = -0.06;
      break;
    case 'hug':
      p.armLUx = -1.25;
      p.armRUx = -1.25;
      p.armLUz = 0.85;
      p.armRUz = -0.85;
      p.armLFx = -0.5;
      p.armRFx = -0.5;
      p.torsoX = 0.1;
      break;
    case 'injured':
      p.torsoX = 0.35;
      p.headX = 0.3;
      p.armLFx = -0.9;
      p.armRFx = -0.9;
      p.legLLx = -0.35;
      p.legRLx = 0.25;
      p.rootY = -0.06 + sw(t, 1) * 0.015;
      break;
    case 'drink':
      p.armRUx = -1.7;
      p.armRUz = -0.28;
      p.armRFx = -0.85 + sw(t, 1.1) * 0.4;
      p.headX = -0.08;
      break;
    case 'smoke':
      p.armRUx = -1.45;
      p.armRUz = -0.35;
      p.armRFx = -1.15 + Math.max(0, sw(t, 0.65)) * 0.8;
      p.headX = sw(t, 0.5) * 0.05;
      break;
    case 'eat':
      p.armRUx = -1.6;
      p.armRUz = -0.2;
      p.armRFx = -0.8 + Math.abs(sw(t, 2)) * -0.6;
      p.headX = 0.1;
      break;
    case 'phone':
      p.armRUx = -0.95;
      p.armRUz = -0.85;
      p.armRFx = -0.9;
      p.headY = -0.25;
      p.headX = 0.16;
      break;
    case 'text':
      p.armLUx = -1.0;
      p.armRUx = -1.0;
      p.armLFx = -0.85;
      p.armRFx = -0.85;
      p.headX = 0.35;
      break;
    case 'camera':
      p.armLUx = -1.55;
      p.armRUx = -1.5;
      p.armLUz = 0.65;
      p.armRUz = -0.75;
      p.armLFx = -0.55;
      p.armRFx = -0.9;
      p.headX = -0.12;
      break;
    case 'music':
      p.armLUx = -1.35 + sw(t, 2.6) * 0.4;
      p.armRUx = -1.35 - sw(t, 2.6) * 0.4;
      p.armLUz = 0.5;
      p.armRUz = -0.5;
      p.hipsZ = sw(t, 1.3) * 0.14;
      p.rootY = Math.abs(sw(t, 2.6)) * 0.06;
      break;
    case 'dj':
      p.armRUx = -1.2 + sw(t, 5) * 0.6;
      p.armLUx = -1.2 - sw(t, 4) * 0.55;
      p.armLUz = 0.55;
      p.armRUz = -0.55;
      p.headX = 0.25;
      p.torsoX = 0.12;
      break;
    case 'workout':
      p.armLUx = -2.4 + sw(t, 3.4) * 0.55;
      p.armRUx = -2.4 + sw(t, 3.4) * 0.55;
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.rootY = sw(t, 3.4) * 0.06 - 0.05;
      p.torsoX = 0.14;
      break;
    case 'fight':
      p.armLUx = -1.5;
      p.armRUx = -1.15 + Math.max(0, sw(t, 3.6)) * -0.95;
      p.armLFx = -1.35;
      p.armRFx = -1.0;
      p.armLUz = 0.35;
      p.armRUz = -0.35;
      p.legLUx = -0.25;
      p.legRUx = 0.25;
      p.hipsZ = sw(t, 3.6) * 0.06;
      p.chestPop = Math.max(0, sw(t, 3.6)) * 0.4;
      break;
    case 'mechanic':
      p.armRUx = -1.1 + sw(t, 3.8) * 0.45;
      p.armRUz = -0.45;
      p.armLUz = 0.6;
      p.armLUx = -0.7;
      p.torsoX = 0.22;
      break;
    case 'dig':
      p.armLUx = -1.9 + sw(t, 2.4) * 0.75;
      p.armRUx = -1.9 + sw(t, 2.4) * 0.75;
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.torsoX = 0.32 + sw(t, 2.4) * 0.13;
      break;
    case 'fish':
      p.armLUx = -1.05;
      p.armRUx = -1.2;
      p.armLUz = 0.35;
      p.armRUz = -0.3;
      p.torsoX = 0.08;
      p.headX = 0.12;
      break;
    case 'police':
      p.armLUz = 0.9;
      p.armRUx = -1.35;
      p.armRUz = -0.4;
      p.armRFx = -0.9;
      p.torsoX = 0.06;
      break;
    case 'umbrella':
      p.armLUx = -2.35;
      p.armLUz = 0.28;
      p.armRUz = 0.2;
      p.hipsZ = sw(t, 0.8) * 0.04;
      break;
    case 'shopping':
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.armLUx = 0.15;
      p.armRUx = 0.15;
      p.hipsZ = sw(t, 2) * 0.09;
      break;
    case 'typing':
      p.armLUx = -1.05;
      p.armRUx = -1.05;
      p.armLFx = -0.75 + sw(t, 7) * 0.14;
      p.armRFx = -0.75 - sw(t, 6) * 0.14;
      p.headX = 0.32;
      break;
    case 'walk': {
      const w = 3.2 + (seed % 3) * 0.45;
      p.legLUx = sw(t, w) * 0.55;
      p.legRUx = -sw(t, w) * 0.55;
      p.legLLx = Math.max(0, -sw(t, w)) * 0.75;
      p.legRLx = Math.max(0, sw(t, w)) * 0.75;
      p.armLUx = -sw(t, w) * 0.5;
      p.armRUx = sw(t, w) * 0.5;
      p.rootY = Math.abs(sw(t, w * 2)) * 0.04;
      p.torsoX = 0.06;
      p.torsoZ = sw(t, w) * 0.04;
      break;
    }
    case 'pose':
      p.hipsZ = 0.1;
      p.armLUz = 0.5;
      p.armRUz = -0.2;
      p.armLFx = -1.4;
      p.headY = ((seed % 3) - 1) * 0.2;
      break;
    case 'idle':
    default:
      p.rootY = sw(t, 1.1) * 0.018;
      p.torsoX = sw(t, 1.1) * 0.02;
      p.armRUx += sw(t, 1.3) * 0.05;
      p.armLUx -= sw(t, 1.3) * 0.05;
      break;
  }
  if (pose !== 'idle' && pose !== 'dance') {
    // Micro-respiration commune aux poses debout.
    p.torsoX += sw(t, 1.05) * 0.012;
  }
  return p;
}
