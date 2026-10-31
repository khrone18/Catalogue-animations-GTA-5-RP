import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Emote } from '../lib/pose';
import type { PoseState } from './emoteTypes';
import { easeOutCubic, poseFor, type PoseId } from './emotePoses';

interface Props {
  emote: Emote;
  index: number;
  interactive?: boolean;
  className?: string;
}

/* Palettes du site (styles.css) */
const ACCENTS = ['#d7ff3e', '#6ee7ff', '#b69cff', '#ff7a45', '#ff6b9d'];
const SKIN_DI = '#4a4e57';

function mat(color: string, emissive = '0x000000'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.08,
    emissive,
    emissiveIntensity: 0.5,
  });
}

function capsule(r: number, len: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), material);
  mesh.position.y = -(len / 2 + r);
  return mesh;
}

function sphere(r: number, material: THREE.Material, y = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), material);
  mesh.position.y = y;
  return mesh;
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function limbGroup(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

/* --------------------------- Tenues / archétypes ---------------------------
   Chaque catégorie emote une silhouette différente (vêtements, accessoires). */
interface Outfit {
  torso: string;
  overlay?: string;
  cap?: 'cap' | 'helm' | 'beanie' | 'none';
  badge?: boolean;
  apron?: boolean;
  trim?: string; // couleur bande poitrine
}

function outfitFor(emote: Emote, seed: number): Outfit {
  const cat = emote.category;
  const a = ACCENTS[seed % ACCENTS.length];
  if (cat === 'Police & secours') {
    return { torso: '#26303c', overlay: '#1d2530', cap: 'cap', badge: true, trim: '#8fb3ff' };
  }
  if (cat === 'Danses') {
    const club = ['#ff2f6d', '#00e5a0', '#7a5cff', '#ffb300'][seed % 4];
    return { torso: '#23262d', overlay: club, cap: 'beanie', trim: club };
  }
  if (cat === 'Métiers & atelier') {
    return { torso: '#3a3f45', overlay: '#ff7a45', cap: 'helm', apron: true, trim: '#ffd28a' };
  }
  if (cat === 'Sport & fitness') {
    return { torso: '#2c3037', overlay: a, trim: a };
  }
  if (cat === 'Boire & manger' || cat === 'Fumer') {
    return { torso: '#3b3446', overlay: '#c9b08a', trim: '#ffffff' };
  }
  if (cat === 'Musique') {
    return { torso: '#191c22', overlay: ACCENTS[(seed + 2) % ACCENTS.length], cap: 'beanie' };
  }
  if (cat === 'Animaux') {
    return { torso: SKIN_DI };
  }
  return { torso: '#2c3037', overlay: ['#5c6470', '#7a5c50', '#4a5c5a'][seed % 3], trim: a };
}

interface Joints {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Mesh[];
  chest: THREE.Mesh;
  propGroup: THREE.Group | null;
  armLU: THREE.Group;
  armLF: THREE.Group;
  armRU: THREE.Group;
  armRF: THREE.Group;
  legLU: THREE.Group;
  legLL: THREE.Group;
  legRU: THREE.Group;
  legRL: THREE.Group;
}

function buildHuman(
  body: THREE.MeshStandardMaterial,
  accent: THREE.MeshStandardMaterial,
  outfit: Outfit,
): Joints {
  const root = new THREE.Group();

  const hips = limbGroup(0, 0.98, 0);
  root.add(hips);
  hips.add(sphere(0.165, body, 0));

  const torso = limbGroup(0, 0.06, 0);
  hips.add(torso);

  const torsoMat = outfit.overlay ? mat(outfit.overlay) : mat(outfit.torso);
  const spine = capsule(0.2, 0.34, torsoMat);
  spine.position.y = 0.24;
  torso.add(spine);
  const chest = sphere(0.21, torsoMat, 0.5);
  chest.scale.set(1.18, 0.92, 0.86);
  torso.add(chest);

  // Bande de couleur sur la poitrine (style veste)
  if (outfit.trim) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 22), mat(outfit.trim));
    band.rotation.set(Math.PI / 2, 0, 0.25);
    band.position.y = 0.44;
    torso.add(band);
  }
  if (outfit.badge) {
    const badgeMesh = box(0.05, 0.07, 0.015, mat('#dfe6f2'));
    badgeMesh.position.set(-0.12, 0.52, 0.17);
    torso.add(badgeMesh);
  }
  if (outfit.apron) {
    const apron = box(0.34, 0.4, 0.02, mat(outfit.overlay ?? '#ff7a45'));
    apron.position.set(0, 0.12, 0.16);
    torso.add(apron);
  }

  const head = limbGroup(0, 0.68, 0);
  torso.add(head);
  head.add(sphere(0.155, mat('#e8c9a8'), 0.1));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.017, 8, 24), accent);
  halo.rotation.x = Math.PI / 2.6;
  halo.position.y = 0.15;
  head.add(halo);
  const eyes: THREE.Mesh[] = [];
  for (const dx of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.017, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x101014 }),
    );
    eye.position.set(dx, 0.12, 0.14);
    head.add(eye);
    eyes.push(eye);
  }
  if (outfit.cap && outfit.cap !== 'none') {
    if (outfit.cap === 'cap') {
      const dome = sphere(0.145, mat(outfit.overlay ?? '#1d2530'), 0.18);
      dome.scale.set(1.02, 0.7, 1.02);
      const visor = box(0.2, 0.025, 0.14, mat(outfit.overlay ?? '#1d2530'));
      visor.position.set(0, 0.2, 0.16);
      head.add(dome, visor);
    } else if (outfit.cap === 'helm') {
      const helm = sphere(0.175, mat('#ffb340', '#3a2a00'), 0.16);
      helm.scale.set(1.05, 0.8, 1.05);
      head.add(helm);
    } else {
      const beanie = sphere(0.16, mat(outfit.overlay ?? '#7a5cff'), 0.17);
      beanie.scale.set(1.03, 0.62, 1.03);
      const pomp = sphere(0.035, mat('#ffffff'), 0.26);
      head.add(beanie, pomp);
    }
  }

  const makeArm = (side: number, upperMat: THREE.Material) => {
    const upper = limbGroup(side * 0.27, 0.5, 0);
    torso.add(upper);
    upper.add(capsule(0.052, 0.2, upperMat));
    const fore = limbGroup(0, -0.26, 0);
    upper.add(fore);
    fore.add(capsule(0.045, 0.18, body));
    fore.add(sphere(0.058, accent, -0.27));
    return { upper, fore };
  };
  const L = makeArm(-1, torsoMat);
  const R = makeArm(1, torsoMat);

  const makeLeg = (side: number) => {
    const upper = limbGroup(side * 0.115, -0.08, 0);
    hips.add(upper);
    upper.add(capsule(0.07, 0.26, body));
    const lower = limbGroup(0, -0.38, 0);
    upper.add(lower);
    lower.add(capsule(0.058, 0.24, body));
    const foot = box(0.11, 0.06, 0.24, mat('#171a1f'));
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
    eyes,
    chest,
    propGroup: null,
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
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 18), accent);
  collar.position.set(0.32, 0.56, 0);
  collar.rotation.y = Math.PI / 2;
  root.add(collar);
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
  head.add(sphere(0.17, mat('#e8c9a8'), 0.04));

  const browL = box(0.09, 0.02, 0.02, accent);
  browL.position.set(-0.06, 0.11, 0.15);
  const browR = box(0.09, 0.02, 0.02, accent);
  browR.position.set(0.06, 0.11, 0.15);
  const mouth = box(0.08, 0.015, 0.02, accent);
  mouth.position.set(0, -0.02, 0.16);
  head.add(browL, browR, mouth);

  return { root, head, browL, browR, mouth };
}

/* Silhouette translucide pour les emotes de duo : le partenaire face à nous. */
function buildPartner(partnerMat: THREE.MeshStandardMaterial) {
  const root = new THREE.Group();
  const hips = limbGroup(0, 0.98, 0);
  root.add(hips);
  hips.add(sphere(0.15, partnerMat, 0));
  const torso = limbGroup(0, 0.12, 0);
  hips.add(torso);
  torso.add(capsule(0.16, 0.26, partnerMat));
  const chest = sphere(0.19, partnerMat, 0.35);
  torso.add(chest);
  const head = sphere(0.14, partnerMat, 0.72);
  torso.add(head);
  // Bras tendus vers notre figure (poignée de main / câlin)
  const armR = limbGroup(-0.22, 0.34, 0);
  torso.add(armR);
  armR.add(capsule(0.045, 0.2, partnerMat));
  armR.rotation.x = -1.15;
  const armL = limbGroup(0.22, 0.34, 0);
  torso.add(armL);
  armL.add(capsule(0.045, 0.2, partnerMat));
  armL.rotation.x = -1.35;
  return { root };
}

/* ------------------------------ Props ---------------------------------- */
function buildProp(kind: string | undefined, accent: THREE.MeshStandardMaterial, dark: string): THREE.Group | null {
  if (!kind) return null;
  const g = new THREE.Group();
  const d = mat(dark);
  const k = kind.toLowerCase();
  if (/beer|bottle|wine|champ|whisk|vodka|booze/.test(k)) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.17, 12), accent);
    bottle.position.y = -0.3;
    g.add(bottle);
  } else if (/cup|coffee|tea|mug|soda|juice|water|latte/.test(k)) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.033, 0.09, 12), accent);
    cup.position.y = -0.3;
    g.add(cup);
  } else if (/cig|cigar|vape|joint|blunt/.test(k)) {
    const cig = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), accent);
    cig.rotation.x = Math.PI / 2;
    cig.position.set(0, -0.3, 0.04);
    g.add(cig);
  } else if (/phone|text|sms/.test(k)) {
    const phone = box(0.06, 0.12, 0.008, accent);
    phone.position.y = -0.32;
    g.add(phone);
  } else if (/guitar|bass|violin/.test(k)) {
    const bodyG = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20), accent);
    bodyG.rotation.x = Math.PI / 2.2;
    bodyG.position.set(0, -0.3, 0.08);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.02), d);
    neck.position.set(0, -0.12, 0.16);
    neck.rotation.x = 0.4;
    g.add(bodyG, neck);
  } else if (/mic|microphone/.test(k)) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), accent);
    m.position.y = -0.28;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 8), d);
    stick.position.y = -0.34;
    g.add(m, stick);
  } else if (/umbrella|brolly/.test(k)) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), accent);
    dome.position.y = -0.16;
    const stickU = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), d);
    stickU.position.y = -0.28;
    g.add(dome, stickU);
  } else if (/bag|suitcase|briefcase/.test(k)) {
    const bag = box(0.14, 0.17, 0.07, accent);
    bag.position.y = -0.34;
    g.add(bag);
  } else if (/dumbbell|weight/.test(k)) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), d);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = -0.3;
    for (const dx of [-0.12, 0.12]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 14), accent);
      disc.rotation.z = Math.PI / 2;
      disc.position.set(dx, -0.3, 0);
      g.add(disc);
    }
    g.add(bar);
  } else if (/shovel|axe/.test(k)) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.4, 8), d);
    handle.position.y = -0.32;
    const blade = box(0.09, 0.05, 0.015, accent);
    blade.position.y = -0.54;
    g.add(handle, blade);
  } else if (/rod|fishing/.test(k)) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.55, 8), accent);
    rod.rotation.x = 0.6;
    rod.position.set(0, -0.36, 0.1);
    g.add(rod);
  } else if (/wrench|tool/.test(k)) {
    const w = box(0.03, 0.2, 0.02, accent);
    w.position.y = -0.32;
    g.add(w);
  } else if (/camera|photo/.test(k)) {
    const cam = box(0.11, 0.08, 0.05, accent);
    cam.position.set(0.02, -0.28, 0.08);
    g.add(cam);
  }
  return g;
}

/* --------------------------- Particules & décors ---------------------------
   Petits systèmes génériques : fumée麒麟, confettis, notes de musique. */
interface ParticleSystem {
  points: THREE.Points;
  update: (dt: number) => void;
}

function makeParticles(
  count: number,
  color: string,
  size: number,
  origin: [number, number, number],
  spread: [number, number, number],
  riseSpeed: number,
  opacity = 0.5,
): ParticleSystem {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = origin[0] + (Math.random() - 0.5) * spread[0];
    positions[i * 3 + 1] = origin[1] + Math.random() * spread[1];
    positions[i * 3 + 2] = origin[2] + (Math.random() - 0.5) * spread[2];
    speeds[i] = riseSpeed * (0.6 + Math.random() * 0.8);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const baseY = origin[1];
  const height = spread[1];
  return {
    points,
    update: (dt: number) => {
      const attr = geo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        let y = attr.getY(i) + speeds[i] * dt;
        if (y > baseY + height) y = baseY;
        attr.setY(i, y);
      }
      attr.needsUpdate = true;
    },
  };
}

interface SceneDecor {
  group: THREE.Group;
  update: (t: number, dt: number) => void;
  explode: () => void; // dispose
}

function decorate(category: string, pose: PoseId, accentHex: string): SceneDecor | null {
  const group = new THREE.Group();
  const systems: ParticleSystem[] = [];
  const extras: Array<{ obj: THREE.Object3D; spin?: number }> = [];

  if (category === 'Danses' || pose === 'dance') {
    // Spotlight double + confettis
    const coneMat = new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (const sx of [-1, 1]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.2, 20, 1, true), coneMat);
      cone.position.set(sx * 1.15, 2.6, -0.4);
      cone.rotation.x = Math.PI / 9;
      cone.rotation.z = sx * 0.3;
      group.add(cone);
    }
    systems.push(makeParticles(60, accentHex, 0.05, [0, 0.05, 0.6], [2.4, 1.6, 1.2], 0.55, 0.55));
  } else if (category === 'Fumer' || pose === 'smoke') {
    systems.push(makeParticles(34, '#9aa1ac', 0.075, [0.3, 1.5, 0.2], [0.16, 0.9, 0.16], 0.22, 0.35));
  } else if (category === 'Musique') {
    systems.push(makeParticles(22, accentHex, 0.05, [-0.35, 1.3, 0.15], [0.2, 1.0, 0.2], 0.4, 0.6));
    // Égalisateur lumineux au sol
    const eqMat = new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.22 });
    const bars = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.07), eqMat);
      bar.position.set(-1.4 + i * 0.22, 0.5, -0.9);
      bars.add(bar);
      extras.push({ obj: bar });
    }
    group.add(bars);
  } else if (category === 'Boire & manger' || pose === 'drink' || pose === 'eat') {
    const small = makeParticles(14, '#cfd4dc', 0.055, [0.28, 1.6, 0.2], [0.08, 0.35, 0.08], 0.16, 0.3);
    systems.push(small);
  } else if (category === 'Assis & repos' || pose === 'lie') {
    systems.push(makeParticles(16, '#b8c2cf', 0.05, [0, 0.25, 0.7], [0.6, 0.3, 0.4], 0.05, 0.2));
  }

  if (!group.children.length && !systems.length) return null;
  for (const s of systems) group.add(s.points);
  const baseScales = extras.map(() => 1);

  return {
    group,
    update: (t, dt) => {
      for (const s of systems) s.update(dt);
      extras.forEach((e, i) => {
        const w = 0.5 + i * 0.13;
        e.obj.scale.y = 0.25 + Math.abs(Math.sin(t * w + i)) * 0.75 * (baseScales[i] || 1);
      });
    },
    explode: () => {
      group.traverse((o) => {
        if (o instanceof THREE.Points) o.geometry.dispose();
      });
    },
  };
}

/* ------------------------------- Caméra ---------------------------------
   Cadrage différent selon le geste : danse = caméra basse, assis = plus près... */
interface CamPreset {
  pos: [number, number, number];
  target: [number, number, number];
  spin: number;
}

function camFor(pose: PoseId, category: string): CamPreset {
  if (pose === 'dance') return { pos: [1.5, 0.72, 2.5], target: [0, 0.78, 0], spin: 1.7 };
  if (pose === 'sit' || pose === 'crouch' || pose === 'kneel')
    return { pos: [1.35, 1.05, 2.2], target: [0, 0.68, 0], spin: 0.8 };
  if (pose === 'lie') return { pos: [2.1, 1.9, 2.2], target: [0, 0.42, 0], spin: 0.55 };
  if (pose === 'workout' || pose === 'fight') return { pos: [1.75, 1.15, 2.55], target: [0, 0.9, 0], spin: 0.5 };
  if (pose === 'smoke' || pose === 'phone' || pose === 'text')
    return { pos: [1.25, 1.35, 1.95], target: [0, 1.05, 0], spin: 0.65 };
  if (category === 'Animaux') return { pos: [1.7, 0.95, 2.7], target: [0, 0.45, 0], spin: 1.0 };
  if (category === 'Danses') return { pos: [1.5, 0.72, 2.5], target: [0, 0.78, 0], spin: 1.5 };
  return { pos: [1.7, 1.45, 3.0], target: [0, 0.95, 0], spin: 1.1 };
}

/* ------------------------------ Composant -------------------------------- */
export function Emote3D({ emote, index, interactive = true, className = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dark = document.documentElement.dataset.theme !== 'light';
    const seed = [...emote.id].reduce((h, c) => Math.imul(h, 31) + (c.charCodeAt(0) | 0), 7) >>> 0;
    const accentHex = ACCENTS[seed % ACCENTS.length];
    const speed = 0.85 + ((seed % 6) / 12); // chaque emote a son tempo

    /* --- Matériaux ---------------------------------------------------------- */
    const outfit = outfitFor(emote, seed);
    const accent = mat(accentHex, accentHex);
    const body = mat(dark ? '#33373e' : '#3a3e45');
    const disposables: THREE.Material[] = [accent, body];

    let root: THREE.Group;
    let joints: Joints | null = null;
    let animal: ReturnType<typeof buildAnimal> | null = null;
    let bust: ReturnType<typeof buildBust> | null = null;
    let partner: ReturnType<typeof buildPartner> | null = null;
    const isDuo = emote.kind === 'synchronized' || emote.pose === 'handshake' || emote.pose === 'hug';

    if (emote.pose === 'animal') {
      const built = buildAnimal(body, accent);
      root = built.root;
      animal = built;
    } else if (emote.pose === 'expression') {
      const built = buildBust(body, accent);
      root = built.root;
      bust = built;
      disposables.push(
        (bust.browL.material as THREE.Material),
        (bust.mouth.material as THREE.Material),
      );
    } else {
      joints = buildHuman(body, accent, outfit);
      root = joints.root;
      const prop = buildProp(emote.prop ?? (emote.kind === 'prop' ? emote.dict : undefined), accent, '#171a1f');
      if (prop) {
        prop.position.set(0, -0.28, 0);
        joints.propGroup = prop;
        joints.armRF.add(prop);
      }
      if (isDuo) {
        const partnerMat = mat(accentHex, accentHex);
        partnerMat.transparent = true;
        partnerMat.opacity = 0.4;
        disposables.push(partnerMat);
        partner = buildPartner(partnerMat);
        partner.root.position.set(0.85, 0, -0.35);
        partner.root.rotation.y = -Math.PI / 2.4;
        root.add(partner.root);
      }
    }

    /* --- Scène --------------------------------------------------------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(dark ? 0x0b0d10 : 0xdfd8c6, 5.5, 11);

    const camPreset = emote.pose === 'expression'
      ? { pos: [1.1, 1.0, 1.8] as [number, number, number], target: [0, 0.55, 0] as [number, number, number], spin: 0.7 }
      : camFor(emote.pose, emote.category);

    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    cam.position.set(...camPreset.pos);
    cam.lookAt(...camPreset.target);

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

    const decor = decorate(emote.category, emote.pose, accentHex);
    if (decor) scene.add(decor.group);
    scene.add(root);

    /* --- Contrôles ------------------------------------------------------------ */
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.target.set(...camPreset.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.3;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = camPreset.spin;
    controls.enablePan = false;

    /* --- Boucle ----------------------------------------------------------------- */
    let raf = 0;
    let stop = false;
    const start = performance.now();
    const EASE = 0.16;
    const cur: PoseState = JSON.parse(JSON.stringify({
      rootY: 0, rootRotX: 0, hipsX: 0, hipsZ: 0, torsoX: 0, torsoZ: 0,
      headX: 0.05, headY: 0, armLUx: 0.12, armLUz: 0.22, armLFx: -0.28,
      armRUx: 0.12, armRUz: -0.22, armRFx: -0.28, legLUx: 0.04, legLUz: 0.06,
      legLLx: -0.04, legRUx: 0.04, legRUz: -0.06, legRLx: -0.04, chestPop: 0,
    }));

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

    const tick = () => {
      if (stop) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const now = performance.now();
      const t = reduced ? 2 : ((now - start) / 1000) * speed + (seed % 97) * 0.037;
      const last = (tick as unknown as { last?: number }).last ?? now - 16;
      const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000);
      (tick as unknown as { last?: number }).last = now;

      /* Entrée en scène : la figure arrive de la gauche pendant ~1,1 s. */
      const entRaw = Math.min(Math.max(t / (1.15 / speed), 0), 1);
      const ent = reduced ? 1 : easeOutCubic(entRaw);
      if (joints && ent < 1) {
        root.position.x = -1.6 * (1 - ent);
        // Petits pas pendant l'entrée : jambes en cycle de marche
        joints.legLU.rotation.x = Math.sin(t * 9) * 0.5;
        joints.legRU.rotation.x = -Math.sin(t * 9) * 0.5;
        joints.legLL.rotation.x = Math.max(0, -Math.sin(t * 9)) * 0.7;
        joints.legRL.rotation.x = Math.max(0, Math.sin(t * 9)) * 0.7;
      } else if (joints) {
        root.position.x = 0;
      }

      if (joints) {
        const target = poseFor(emote.pose, t, seed);
        for (const k of Object.keys(target) as Array<keyof PoseState>) {
          cur[k] += (target[k] - cur[k]) * EASE;
        }
        const j = joints;
        j.root.position.y = cur.rootY;
        j.root.rotation.x = cur.rootRotX;
        j.hips.rotation.x = cur.hipsX;
        j.hips.rotation.z = cur.hipsZ;
        j.torso.rotation.x = cur.torsoX;
        j.torso.rotation.z = cur.torsoZ;
        j.head.rotation.x = cur.headX;
        j.head.rotation.y = cur.headY;
        j.armLU.rotation.x = cur.armLUx;
        j.armLU.rotation.z = cur.armLUz;
        j.armLF.rotation.x = cur.armLFx;
        j.armRU.rotation.x = cur.armRUx;
        j.armRU.rotation.z = cur.armRUz;
        j.armRF.rotation.x = cur.armRFx;
        j.legLU.rotation.x = cur.legLUx;
        j.legLU.rotation.z = cur.legLUz;
        j.legLL.rotation.x = cur.legLLx;
        j.legRU.rotation.x = cur.legRUx;
        j.legRU.rotation.z = cur.legRUz;
        j.legRL.rotation.x = cur.legRLx;
        if (ent >= 1) {
          j.legLU.rotation.x = cur.legLUx;
          j.legRU.rotation.x = cur.legRUx;
        }
        // Chest pop (krump) : pulsation du torse
        const pop = 1 + Math.max(0, cur.chestPop) * 0.3;
        joints.chest.scale.set(1.18 * pop, 0.92 * pop, 0.86 * pop);
        // Clignements d'yeux
        if (!reduced) {
          const blinkT = (t + (seed % 7)) % 2.7;
          const blink = blinkT < 0.12 ? Math.abs(Math.sin((blinkT / 0.12) * Math.PI)) : 0;
          const ls = blink > 0.5 ? 0.15 : 1;
          j.eyes.forEach((e) => e.scale.setY(ls));
        }
        // Prop : légère inertie (pitch en retard sur le bras)
        if (j.propGroup) j.propGroup.rotation.x = cur.armRFx * -0.12;
        // Partenaire : il "répond" légèrement
        if (partner) partner.root.position.y = Math.sin(t * 1.4) * 0.02;
      } else if (animal) {
        const w = 2.4 * speed;
        root.position.y = Math.abs(Math.sin(t * w)) * 0.03;
        animal.joints.head.rotation.x = Math.sin(t * 1.1) * 0.15;
        animal.joints.head.rotation.z = Math.sin(t * 0.7) * 0.2;
        animal.joints.tail.rotation.x = Math.sin(t * 2.6) * 0.35;
        animal.joints.tail.rotation.y = Math.sin(t * 1.8) * 0.3;
        animal.joints.legs.forEach((leg, i) => {
          const phase = i % 2 === 0 ? t * w : t * w + Math.PI;
          leg.rotation.x = Math.sin(phase) * 0.38;
        });
        shadow.position.set(root.position.x, 0.002, 0);
      } else if (bust) {
        bust.root.rotation.y = Math.sin(t * 0.5) * 0.35;
        bust.root.position.y = Math.sin(t * 1.2) * 0.012;
        const tilt = Math.sin(t * 1.2) * 0.1;
        bust.browL.rotation.z = tilt;
        bust.browR.rotation.z = -tilt;
        bust.mouth.scale.y = 1 + Math.max(0, Math.sin(t * 2.4)) * 1.6;
      }

      shadow.scale.setScalar(Math.max(0.6, 1 - cur.rootY * 0.25));
      controls.update();
      if (decor && !reduced) decor.update(t, dt);
      renderer.render(scene, cam);
    };
    tick();

    /* --- Nettoyage ------------------------------------------------------------------ */
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      decor?.explode();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const m = obj.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      disposables.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emote.id, emote.pose, emote.prop, emote.kind, emote.category, interactive]);

  return <div ref={hostRef} className={`emote3d ${className}`} data-index={index} aria-hidden="true" />;
}
