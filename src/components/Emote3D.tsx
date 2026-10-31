import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Emote, PoseId } from '../lib/pose';

interface Props {
  emote: Emote;
  index: number;
  interactive?: boolean;
  className?: string;
}

/* Palettes du site (styles.css) — choisie via le seed de l'emote. */
const ACCENTS = ['#d7ff3e', '#6ee7ff', '#b69cff', '#ff7a45', '#ff6b9d'];

interface Joints {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armLU: THREE.Group;
  armLF: THREE.Group;
  armRU: THREE.Group;
  armRF: THREE.Group;
  legLU: THREE.Group;
  legLL: THREE.Group;
  legRU: THREE.Group;
  legRL: THREE.Group;
}

interface Built {
  group: THREE.Group;
  joints: Joints | null;
  kind: 'human' | 'animal' | 'bust';
  accent: THREE.MeshStandardMaterial;
  accentProp: THREE.MeshStandardMaterial;
  body: THREE.MeshStandardMaterial;
}

function mat(color: string, emissive = '0x000000'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.08,
    emissive,
    emissiveIntensity: 0.55,
  });
}

function capsule(r: number, len: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), material);
  mesh.position.y = -(len / 2 + r);
  mesh.castShadow = false;
  return mesh;
}

function sphere(r: number, material: THREE.Material, y = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), material);
  mesh.position.y = y;
  return mesh;
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  return mesh;
}

/* Arm segment orienté vers -Y : on positionne le pivot en haut du segment. */
function limbGroup(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

function buildHuman(body: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): Joints {
  const root = new THREE.Group();

  const hips = limbGroup(0, 0.98, 0);
  root.add(hips);
  hips.add(sphere(0.17, body, 0));

  const torso = limbGroup(0, 0.06, 0);
  hips.add(torso);
  const spine = capsule(0.19, 0.34, body);
  spine.position.y = 0.24;
  torso.add(spine);
  const chest = sphere(0.2, body, 0.5);
  chest.scale.set(1.15, 0.9, 0.85);
  torso.add(chest);

  const head = limbGroup(0, 0.68, 0);
  torso.add(head);
  head.add(sphere(0.155, body, 0.1));
  // Repère accent sur le crâne (casque-style) pour lire l'orientation.
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.018, 8, 24),
    accent,
  );
  halo.rotation.x = Math.PI / 2.6;
  halo.position.y = 0.16;
  head.add(halo);
  // Yeux (lisent la direction du regard)
  const eyeGeo = new THREE.SphereGeometry(0.017, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101014 });
  for (const dx of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(dx, 0.12, 0.14);
    head.add(eye);
  }

  const makeArm = (side: number) => {
    const upper = limbGroup(side * 0.27, 0.5, 0);
    torso.add(upper);
    upper.add(capsule(0.052, 0.2, body));
    const fore = limbGroup(0, -0.26, 0);
    upper.add(fore);
    fore.add(capsule(0.045, 0.18, body));
    const hand = sphere(0.058, accent, -0.25);
    fore.add(hand);
    return { upper, fore };
  };
  const L = makeArm(-1);
  const R = makeArm(1);

  const makeLeg = (side: number) => {
    const upper = limbGroup(side * 0.115, -0.08, 0);
    hips.add(upper);
    upper.add(capsule(0.07, 0.26, body));
    const lower = limbGroup(0, -0.38, 0);
    upper.add(lower);
    lower.add(capsule(0.058, 0.24, body));
    const foot = box(0.11, 0.06, 0.24, body);
    foot.position.set(0, -0.36, 0.05);
    lower.add(foot);
    return { upper, lower };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  return {
    root,
    hips,
    torso,
    head,
    armLU: L.upper,
    armLF: L.fore,
    armRU: R.upper,
    armRF: R.fore,
    legLU: legL.upper,
    legLL: legL.lower,
    legRU: legR.upper,
    legRL: legR.lower,
  };
}

function buildAnimal(body: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial) {
  const root = new THREE.Group();
  const joints = { head: new THREE.Group(), tail: new THREE.Group(), legs: [] as THREE.Group[] };

  const trunk = capsule(0.24, 0.5, body);
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 0.52;
  root.add(trunk);

  const head = limbGroup(0.42, 0.62, 0);
  root.add(head);
  head.add(sphere(0.16, body, 0.04));
  const snout = box(0.12, 0.08, 0.1, body);
  snout.position.set(0.14, 0.02, 0);
  head.add(snout);
  joints.head = head;

  const tail = limbGroup(-0.42, 0.56, 0);
  root.add(tail);
  const taper = capsule(0.03, 0.22, accent);
  taper.rotation.z = Math.PI / 2;
  taper.position.x = -0.13;
  tail.add(taper);
  joints.tail = tail;

  for (const [x, z] of [
    [0.26, 0.11],
    [0.26, -0.11],
    [-0.26, 0.11],
    [-0.26, -0.11],
  ]) {
    const leg = limbGroup(x, 0.32, z);
    root.add(leg);
    leg.add(capsule(0.045, 0.18, body));
    joints.legs.push(leg);
  }

  return { root, joints };
}

function buildBust(body: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial) {
  const root = new THREE.Group();
  const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 24), accent);
  socle.position.y = 0.05;
  root.add(socle);
  const neck = capsule(0.07, 0.14, body);
  neck.position.y = 0.18;
  root.add(neck);
  const torso = capsule(0.2, 0.24, body);
  torso.position.y = 0.45;
  root.add(torso);
  const head = limbGroup(0, 0.74, 0);
  root.add(head);
  head.add(sphere(0.17, body, 0.04));

  const brow = new THREE.Group();
  head.add(brow);
  // Expression : sourcils + bouche, modifiés par l'anim.
  const browL = box(0.09, 0.02, 0.02, accent);
  browL.position.set(-0.06, 0.11, 0.15);
  const browR = box(0.09, 0.02, 0.02, accent);
  browR.position.set(0.06, 0.11, 0.15);
  const mouth = box(0.08, 0.015, 0.02, accent);
  mouth.position.set(0, -0.02, 0.16);
  brow.add(browL, browR, mouth);

  return { root, head, brow, browL, browR, mouth };
}

/* ------------------------------- Poses -------------------------------- */
interface PoseState {
  rootY: number;
  rootRotX: number;
  hipsX: number;
  hipsZ: number;
  torsoX: number;
  torsoZ: number;
  headX: number;
  headY: number;
  armLUx: number;
  armLUz: number;
  armLFx: number;
  armRUx: number;
  armRUz: number;
  armRFx: number;
  legLUx: number;
  legLUz: number;
  legLLx: number;
  legRUx: number;
  legRUz: number;
  legRLx: number;
}

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
};

const sw = (t: number, f = 2.2) => Math.sin(t * f);
const cw = (t: number, f = 2.2) => Math.cos(t * f);
const TAU360 = Math.PI * 2;

function poseFor(pose: PoseId, t: number, seed: number): PoseState {
  const p: PoseState = { ...REST };
  const v = (seed % 3) - 1; // petite variante par emote
  const f = 2 + (seed % 4) * 0.35;
  switch (pose) {
    case 'wave':
      p.armRUx = -2.5 + sw(t, 3 + v) * 0.32;
      p.armRUz = -0.42;
      p.armRFx = -0.5 + sw(t, 3.2) * 0.5;
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
      p.armLFx = -1.05 + sw(t, 6) * 0.22;
      p.armRFx = -1.05 - sw(t, 6) * 0.22;
      p.armLUz = 0.38;
      p.armRUz = -0.38;
      break;
    case 'cheer':
      p.armLUx = -2.7 + sw(t, 4) * 0.25;
      p.armRUx = -2.7 - sw(t, 4) * 0.25;
      p.armLUz = 0.35;
      p.armRUz = -0.35;
      p.rootY = Math.abs(sw(t, 4)) * 0.07;
      p.headX = -0.18;
      break;
    case 'dance': {
      const mode = seed % 4;
      p.rootY = Math.abs(sw(t, f)) * 0.12;
      p.hipsZ = sw(t, f / 2) * 0.22;
      p.torsoZ = -sw(t, f / 2) * 0.14;

      p.headY = sw(t, f / 2) * 0.3;
      if (mode === 0) {
        p.armLUx = -1.9 + sw(t, f) * 0.6;
        p.armRUx = -1.4 - sw(t, f) * 0.6;
        p.armLUz = 0.7;
        p.armRUz = -0.6;
      } else if (mode === 1) {
        p.armLUx = -2.6;
        p.armRUx = -2.6;
        p.armLUz = 0.5 + sw(t, f) * 0.4;
        p.armRUz = -0.5 - sw(t, f) * 0.4;
        p.legLLx = sw(t, f) * 0.7;
        p.legRLx = -sw(t, f) * 0.7;
      } else if (mode === 2) {
        p.armLUx = -0.6;
        p.armRUx = -0.6;
        p.armLUz = 1.1 + sw(t, f) * 0.2;
        p.armRUz = -1.1 - sw(t, f) * 0.2;
        p.armLFx = -1.6;
        p.armRFx = -1.6;

      } else {
        p.armLUx = -2.9;
        p.armRUz = -2.9;
        p.armRUx = 0.3;
        p.armLUz = 0.25;
        p.hipsZ = sw(t, f * 2) * 0.3;
      }
      break;
    }
    case 'sit':
      p.rootY = -0.42;
      p.torsoX = 0.12;
      p.legLUx = -1.55;
      p.legRUx = -1.55;
      p.legLLx = 1.5;
      p.legRLx = 1.5;
      p.armLUz = 0.45;
      p.armRUz = -0.45;
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
      p.armRFx = -0.12 + sw(t, 1.4) * 0.12;
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
      p.armRFx = -0.85 + sw(t, 1.1) * 0.35;
      p.headX = -0.08;
      break;
    case 'smoke':
      p.armRUx = -1.45;
      p.armRUz = -0.35;
      p.armRFx = -1.15 + Math.max(0, sw(t, 0.65)) * 0.75;
      p.headX = sw(t, 0.5) * 0.05;
      break;
    case 'eat':
      p.armRUx = -1.6;
      p.armRUz = -0.2;
      p.armRFx = -0.8 + Math.abs(sw(t, 2)) * -0.55;
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
      p.armLUx = -1.35 + sw(t, 2.6) * 0.35;
      p.armRUx = -1.35 - sw(t, 2.6) * 0.35;
      p.armLUz = 0.5;
      p.armRUz = -0.5;
      p.hipsZ = sw(t, 1.3) * 0.12;
      p.rootY = Math.abs(sw(t, 2.6)) * 0.05;
      break;
    case 'dj':
      p.armRUx = -1.2 + sw(t, 5) * 0.55;
      p.armLUx = -1.2 - sw(t, 4) * 0.5;
      p.armLUz = 0.55;
      p.armRUz = -0.55;
      p.headX = 0.25;
      p.torsoX = 0.12;
      break;
    case 'workout':
      p.armLUx = -2.4 + sw(t, 3.4) * 0.5;
      p.armRUx = -2.4 + sw(t, 3.4) * 0.5;
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.rootY = sw(t, 3.4) * 0.05 - 0.05;
      p.torsoX = 0.14;
      break;
    case 'fight':
      p.armLUx = -1.5;
      p.armRUx = -1.15 + Math.max(0, sw(t, 3.6)) * -0.9;
      p.armLFx = -1.35;
      p.armRFx = -1.0;
      p.armLUz = 0.35;
      p.armRUz = -0.35;
      p.legLUx = -0.25;
      p.legRUx = 0.25;
      p.hipsZ = sw(t, 3.6) * 0.05;
      break;
    case 'mechanic':
      p.armRUx = -1.1 + sw(t, 3.8) * 0.4;
      p.armRUz = -0.45;
      p.armLUz = 0.6;
      p.armLUx = -0.7;
      p.torsoX = 0.22;
      break;
    case 'dig':
      p.armLUx = -1.9 + sw(t, 2.4) * 0.7;
      p.armRUx = -1.9 + sw(t, 2.4) * 0.7;
      p.armLUz = 0.3;
      p.armRUz = -0.3;
      p.torsoX = 0.32 + sw(t, 2.4) * 0.12;
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
      p.hipsZ = sw(t, 2) * 0.08;
      break;
    case 'typing':
      p.armLUx = -1.05;
      p.armRUx = -1.05;
      p.armLFx = -0.75 + sw(t, 7) * 0.12;
      p.armRFx = -0.75 - sw(t, 6) * 0.12;
      p.headX = 0.32;
      break;
    case 'walk': {
      const w = 3.4 + (seed % 3) * 0.4;
      p.legLUx = sw(t, w) * 0.55;
      p.legRUx = -sw(t, w) * 0.55;
      p.legLLx = Math.max(0, -sw(t, w)) * 0.75;
      p.legRLx = Math.max(0, sw(t, w)) * 0.75;
      p.armLUx = -sw(t, w) * 0.45;
      p.armRUx = sw(t, w) * 0.45;
      p.rootY = Math.abs(sw(t, w * 2)) * 0.035;
      p.torsoX = 0.06;
      break;
    }
    case 'pose':
      p.hipsZ = 0.1;
      p.armLUz = 0.5;
      p.armRUz = -0.2;
      p.armLFx = -1.4;
      p.headY = v * 0.2;
      break;
    case 'idle':
    default:
      p.rootY = sw(t, 1.1) * 0.018;
      p.torsoX = sw(t, 1.1) * 0.02;
      p.armRUx += sw(t, 1.3) * 0.05;
      p.armLUx -= sw(t, 1.3) * 0.05;
      break;
  }
  if (pose !== 'idle') {
    // Micro-respiration commune à toutes les poses debout.
    p.torsoX += sw(t, 1.05) * 0.012;
  }
  return p;
}

/* Props accentués simples attachés à la main droite. */
function buildProp(kind: string | undefined): THREE.Group | null {
  if (!kind) return null;
  const g = new THREE.Group();
  const a = mat('#d7ff3e', '#2a3a00');
  const d = mat('#20232a');
  const k = kind.toLowerCase();
  if (/beer|bottle|wine|champ|whisk|vodka|booze/.test(k)) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.17, 12), a);
    bottle.position.y = -0.25;
    g.add(bottle);
  } else if (/cup|coffee|tea|mug|soda|juice|water|latte/.test(k)) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.033, 0.09, 12), a);
    cup.position.y = -0.25;
    g.add(cup);
  } else if (/cig|cigar|vape|joint|blunt/.test(k)) {
    const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), a);
    cig.rotation.x = Math.PI / 2;
    cig.position.set(0, -0.25, 0.04);
    g.add(cig);
  } else if (/phone|text|sms/.test(k)) {
    const phone = box(0.06, 0.12, 0.008, a);
    phone.position.y = -0.26;
    g.add(phone);
  } else if (/guitar|bass|violin/.test(k)) {
    const bodyG = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), a);
    bodyG.rotation.x = Math.PI / 2.2;
    bodyG.position.set(0, -0.3, 0.08);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.02), d);
    neck.position.set(0, -0.12, 0.16);
    neck.rotation.x = 0.4;
    g.add(bodyG, neck);
  } else if (/mic|microphone/.test(k)) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), a);
    m.position.y = -0.24;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 8), d);
    stick.position.y = -0.3;
    g.add(m, stick);
  } else if (/umbrella|brolly/.test(k)) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, TAU360, 0, Math.PI / 2.6), a);
    dome.position.y = -0.12;
    const stickU = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), d);
    stickU.position.y = -0.24;
    g.add(dome, stickU);
  } else if (/bag|suitcase|briefcase/.test(k)) {
    const bag = box(0.14, 0.17, 0.07, a);
    bag.position.y = -0.3;
    g.add(bag);
  } else if (/dumbbell|weight/.test(k)) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), d);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = -0.25;
    for (const dx of [-0.12, 0.12]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 14), a);
      disc.rotation.z = Math.PI / 2;
      disc.position.set(dx, -0.25, 0);
      g.add(disc);
    }
    g.add(bar);
  } else if (/shovel|axe/.test(k)) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.4, 8), d);
    handle.position.y = -0.28;
    const blade = box(0.09, 0.05, 0.015, a);
    blade.position.y = -0.5;
    g.add(handle, blade);
  } else if (/rod|fishing/.test(k)) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.55, 8), a);
    rod.rotation.x = 0.6;
    rod.position.set(0, -0.32, 0.1);
    g.add(rod);
  } else if (/wrench|tool/.test(k)) {
    const w = box(0.03, 0.2, 0.02, a);
    w.position.y = -0.28;
    g.add(w);
  } else if (/camera|photo/.test(k)) {
    const cam = box(0.11, 0.08, 0.05, a);
    cam.position.set(0.02, -0.24, 0.08);
    g.add(cam);
  }
  return g;
}

/* ------------------------------ Composant ------------------------------
   Une seule instance WebGL active à la fois (le canvas est démonté quand
   la fiche se ferme ou quand on repasse sur le croquis). */
export function Emote3D({ emote, index, interactive = true, className = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dark = document.documentElement.dataset.theme !== 'light';
    const seed = [...emote.id].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0) | 0, 7) >>> 0;
    const accentHex = ACCENTS[seed % ACCENTS.length];
    const accent = mat(accentHex, accentHex);
    const body = mat(dark ? '#2c3037' : '#33373e');
    const accentProp = mat(accentHex, dark ? accentHex : '#000000');
    (accentProp as THREE.MeshStandardMaterial).emissiveIntensity = dark ? 0.35 : 0;

    let built: Built;
    if (emote.pose === 'animal') {
      const { root, joints } = buildAnimal(body, accent);
      built = { group: root, joints: null, kind: 'animal', accent, body, accentProp };
      (built as unknown as { animal: typeof joints }).animal = joints;
    } else if (emote.pose === 'expression') {
      const bust = buildBust(body, accent);
      built = { group: bust.root, joints: null, kind: 'bust', accent, body, accentProp };
      (built as unknown as { bust: typeof bust }).bust = bust;
    } else {
      const joints = buildHuman(body, accentProp);
      built = { group: joints.root, joints, kind: 'human', accent, body, accentProp };
      const prop = buildProp(emote.prop ?? (emote.kind === 'prop' ? emote.dict : undefined));
      if (prop) {
        prop.position.set(0, -0.23, 0);
        joints.armRF.add(prop);
      }
    }

    /* --- Scène ------------------------------------------------------------ */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(dark ? 0x0b0d10 : 0xdfd8c6, 5.5, 11);

    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    cam.position.set(1.7, 1.45, 3.1);
    cam.lookAt(0, 0.95, 0);

    scene.add(new THREE.HemisphereLight(dark ? 0x8f98a8 : 0xffffff, dark ? 0x14161a : 0x8a8578, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, dark ? 1.9 : 1.6);
    key.position.set(2.4, 3.6, 2.2);
    scene.add(key);
    const rim = new THREE.PointLight(accentHex, dark ? 14 : 8, 7);
    rim.position.set(-2, 1.6, -1.4);
    scene.add(rim);

    const grid = new THREE.GridHelper(9, 18, new THREE.Color(accentHex), new THREE.Color(dark ? 0x2a2e35 : 0xb9b2a2));
    (grid.material as THREE.Material).opacity = dark ? 0.3 : 0.4;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: dark ? 0.4 : 0.22 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    scene.add(shadow);
    scene.add(built.group);

    /* --- Contrôles --------------------------------------------------------- */
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.target.set(0, 0.95, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.autoRotate = !interactive || !reduced ? !reduced : false;
    controls.autoRotateSpeed = 1.1;
    controls.enablePan = false;

    /* --- Boucle ------------------------------------------------------------ */
    let raf = 0;
    let stop = false;
    const start = performance.now();
    const joints = built.joints;
    const animal = (built as unknown as { animal?: ReturnType<typeof buildAnimal> }).animal;
    const bust = (built as unknown as { bust?: ReturnType<typeof buildBust> }).bust;

    const resize = () => {
      const w = host.clientWidth || 320;
      const h = host.clientHeight || 280;
      renderer.setSize(w, h, false);
      cam.aspect = w / Math.max(h, 1);
      cam.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const ease = 0.16;
    const cur: PoseState = { ...REST };

    const tick = () => {
      if (stop) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const t = reduced ? 1.4 : (performance.now() - start) / 1000 + (seed % 97) * 0.037;

      if (built.kind === 'human' && joints) {
        const target = poseFor(emote.pose, t, seed);
        for (const key of Object.keys(target) as (keyof PoseState)[]) {
          cur[key] += (target[key] - cur[key]) * ease;
        }
        joints.root.position.y = cur.rootY;
        joints.root.rotation.x = cur.rootRotX;
        joints.hips.rotation.x = cur.hipsX;
        joints.hips.rotation.z = cur.hipsZ;
        joints.torso.rotation.x = cur.torsoX;
        joints.torso.rotation.z = cur.torsoZ;
        joints.head.rotation.x = cur.headX;
        joints.head.rotation.y = cur.headY;
        joints.armLU.rotation.x = cur.armLUx;
        joints.armLU.rotation.z = cur.armLUz;
        joints.armLF.rotation.x = cur.armLFx;
        joints.armRU.rotation.x = cur.armRUx;
        joints.armRU.rotation.z = cur.armRUz;
        joints.armRF.rotation.x = cur.armRFx;
        joints.legLU.rotation.x = cur.legLUx;
        joints.legLU.rotation.z = cur.legLUz;
        joints.legLL.rotation.x = cur.legLLx;
        joints.legRU.rotation.x = cur.legRUx;
        joints.legRU.rotation.z = cur.legRUz;
        joints.legRL.rotation.x = cur.legRLx;
      } else if (built.kind === 'animal' && animal) {
        const w = 2.4;
        animal.root.position.y = Math.abs(Math.sin(t * w)) * 0.03;
        animal.joints.head.rotation.x = Math.sin(t * 1.1) * 0.15;
        animal.joints.head.rotation.z = Math.sin(t * 0.7) * 0.2;
        animal.joints.tail.rotation.x = Math.sin(t * 2.6) * 0.35;
        animal.joints.tail.rotation.y = Math.sin(t * 1.8) * 0.3;
        animal.joints.legs.forEach((leg, i) => {
          const phase = i % 2 === 0 ? t * w : t * w + Math.PI;
          leg.rotation.x = Math.sin(phase) * 0.38;
        });
      } else if (built.kind === 'bust' && bust) {
        bust.root.rotation.y = Math.sin(t * 0.5) * 0.35;
        bust.root.position.y = Math.sin(t * 1.2) * 0.012;
        const tilt = Math.sin(t * 1.2) * 0.1;
        bust.browL.rotation.z = tilt;
        bust.browR.rotation.z = -tilt;
        bust.mouth.scale.y = 1 + Math.max(0, Math.sin(t * 2.4)) * 1.6;
      }

      shadow.scale.setScalar(1 - cur.rootY * 0.25);
      controls.update();
      renderer.render(scene, cam);
    };
    tick();

    /* --- Nettoyage ---------------------------------------------------------- */
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
        }
      });
      accent.dispose();
      body.dispose();
      accentProp.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emote.id, emote.pose, emote.prop, interactive]);

  return <div ref={hostRef} className={`emote3d ${className}`} data-index={index} aria-hidden="true" />;
}
