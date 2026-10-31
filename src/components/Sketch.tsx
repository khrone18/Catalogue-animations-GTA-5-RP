import type { CSSProperties } from 'react';
import type { Emote, PoseId, PropKind } from '../lib/pose';

type Pt = [number, number];

interface Spec {
  head: Pt;
  headR: number;
  neck: Pt;
  hip: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  hipL: Pt;
  hipR: Pt;
  handL: Pt;
  elbowL: Pt;
  handR: Pt;
  elbowR: Pt;
  kneeL: Pt;
  footL: Pt;
  kneeR: Pt;
  footR: Pt;
  face: 'neutral' | 'smile' | 'sad' | 'angry' | 'wow' | 'none';
  prop: PropKind | null;
  propAt: Pt;
  propRot: number;
  ground: number;
  block?: boolean;
  wall?: boolean;
  desk?: boolean;
  tail?: boolean;
  table?: boolean;
  trail?: string;
  duo?: boolean;
}

const BASE: Spec = {
  head: [110, 50],
  headR: 13,
  neck: [110, 66],
  hip: [110, 124],
  shoulderL: [94, 80],
  shoulderR: [126, 80],
  hipL: [100, 124],
  hipR: [120, 124],
  elbowL: [86, 104],
  handL: [82, 128],
  elbowR: [134, 104],
  handR: [138, 128],
  kneeL: [98, 154],
  footL: [96, 184],
  kneeR: [122, 154],
  footR: [124, 184],
  face: 'neutral',
  prop: null,
  propAt: [110, 110],
  propRot: 0,
  ground: 184,
};

const make = (overrides: Partial<Spec>): Spec => ({ ...BASE, ...overrides });

function specFor(pose: PoseId, prop: PropKind | null, seed: number): Spec {
  switch (pose) {
    case 'wave':
      return make({
        elbowR: [140, 66],
        handR: [150, 44],
        face: 'smile',
        trail: 'M132 76 Q150 58 154 34',
      });
    case 'salute':
      return make({ elbowR: [138, 70], handR: [122, 58], face: 'neutral' });
    case 'point':
      return make({ elbowR: [150, 80], handR: [172, 76], face: 'neutral' });
    case 'clap':
      return make({
        elbowL: [100, 102],
        handL: [108, 96],
        elbowR: [120, 102],
        handR: [112, 96],
        face: 'smile',
        trail: 'M100 104 Q110 90 120 104',
      });
    case 'cheer':
      return make({
        elbowL: [82, 62],
        handL: [76, 38],
        elbowR: [138, 62],
        handR: [144, 38],
        face: 'wow',
      });
    case 'dance': {
      const variant = seed % 3;
      if (variant === 1) {
        return make({
          head: [106, 50],
          neck: [108, 66],
          hip: [112, 124],
          shoulderL: [90, 80],
          shoulderR: [126, 80],
          hipL: [102, 124],
          hipR: [122, 124],
          elbowL: [78, 96],
          handL: [68, 112],
          elbowR: [142, 62],
          handR: [150, 38],
          kneeL: [104, 152],
          footL: [110, 182],
          kneeR: [126, 150],
          footR: [116, 182],
          face: 'smile',
        });
      }
      if (variant === 2) {
        return make({
          head: [116, 52],
          neck: [114, 68],
          hip: [110, 124],
          shoulderL: [96, 82],
          shoulderR: [130, 82],
          hipL: [100, 124],
          hipR: [120, 124],
          elbowL: [78, 70],
          handL: [66, 60],
          elbowR: [148, 70],
          handR: [160, 60],
          kneeL: [88, 150],
          footL: [74, 178],
          kneeR: [136, 148],
          footR: [152, 176],
          face: 'wow',
        });
      }
      return make({
        head: [114, 50],
        neck: [114, 66],
        hip: [116, 124],
        shoulderL: [98, 80],
        shoulderR: [130, 80],
        hipL: [106, 124],
        hipR: [126, 124],
        elbowL: [84, 66],
        handL: [72, 42],
        elbowR: [146, 64],
        handR: [158, 40],
        kneeL: [96, 152],
        footL: [88, 182],
        kneeR: [142, 150],
        footR: [148, 180],
        face: 'smile',
      });
    }
    case 'sit':
      return make({
        head: [106, 62],
        neck: [106, 78],
        hip: [106, 140],
        shoulderL: [90, 92],
        shoulderR: [122, 92],
        hipL: [96, 140],
        hipR: [116, 140],
        elbowL: [82, 112],
        handL: [86, 132],
        elbowR: [130, 112],
        handR: [126, 132],
        kneeL: [126, 148],
        footL: [130, 176],
        kneeR: [140, 144],
        footR: [144, 174],
        face: 'smile',
        ground: 184,
        block: true,
      });
    case 'kneel':
      return make({
        head: [110, 68],
        neck: [110, 84],
        hip: [110, 140],
        shoulderL: [96, 96],
        shoulderR: [124, 96],
        hipL: [102, 140],
        hipR: [118, 140],
        elbowL: [90, 118],
        handL: [100, 134],
        elbowR: [130, 118],
        handR: [122, 134],
        kneeL: [86, 160],
        footL: [108, 172],
        kneeR: [134, 160],
        footR: [114, 172],
        face: 'neutral',
        ground: 176,
      });
    case 'lie':
      return make({
        head: [64, 150],
        neck: [80, 154],
        hip: [146, 158],
        shoulderL: [86, 146],
        shoulderR: [88, 162],
        hipL: [142, 152],
        hipR: [142, 164],
        elbowL: [86, 130],
        handL: [102, 122],
        elbowR: [96, 172],
        handR: [116, 174],
        kneeL: [172, 150],
        footL: [196, 154],
        kneeR: [174, 168],
        footR: [198, 166],
        face: 'neutral',
        ground: 176,
        trail: 'M58 136 Q70 128 78 136',
      });
    case 'drink':
      return make({
        elbowR: [136, 90],
        handR: [120, 64],
        face: 'smile',
        prop: prop ?? 'bottle',
        propAt: [118, 56],
        propRot: -18,
      });
    case 'smoke':
      return make({
        elbowR: [136, 92],
        handR: [120, 68],
        face: 'neutral',
        prop: prop ?? 'cig',
        propAt: [118, 62],
        propRot: 32,
      });
    case 'eat':
      return make({
        elbowR: [132, 94],
        handR: [116, 70],
        face: 'smile',
        prop: prop ?? 'food',
        propAt: [112, 64],
      });
    case 'phone':
      return make({
        elbowR: [138, 76],
        handR: [126, 58],
        face: 'neutral',
        prop: prop ?? 'phone',
        propAt: [130, 54],
        propRot: -12,
      });
    case 'text':
      return make({
        head: [110, 56],
        elbowL: [102, 100],
        handL: [108, 88],
        elbowR: [118, 100],
        handR: [112, 88],
        face: 'smile',
        prop: prop ?? 'phone',
        propAt: [110, 84],
        propRot: -4,
      });
    case 'typing':
      return make({
        elbowL: [102, 102],
        handL: [112, 100],
        elbowR: [118, 102],
        handR: [108, 100],
        face: 'neutral',
        desk: true,
      });
    case 'camera':
      return make({
        elbowL: [106, 72],
        handL: [100, 60],
        elbowR: [114, 72],
        handR: [120, 60],
        face: 'smile',
        prop: prop ?? 'camera',
        propAt: [110, 58],
      });
    case 'music':
      return make({
        elbowL: [102, 96],
        handL: [130, 104],
        elbowR: [132, 100],
        handR: [110, 110],
        face: 'smile',
        prop: prop ?? 'guitar',
        propAt: [110, 108],
        propRot: -18,
      });
    case 'dj':
      return make({
        elbowL: [102, 104],
        handL: [96, 122],
        elbowR: [132, 104],
        handR: [140, 122],
        face: 'smile',
        table: true,
      });
    case 'workout':
      return make({
        elbowL: [82, 70],
        handL: [88, 52],
        elbowR: [138, 70],
        handR: [132, 52],
        face: 'angry',
        prop: prop ?? 'dumbbell',
        propAt: [132, 48],
      });
    case 'fight':
      return make({
        elbowL: [86, 92],
        handL: [98, 74],
        elbowR: [134, 92],
        handR: [122, 74],
        face: 'angry',
      });
    case 'mechanic':
      return make({
        head: [110, 76],
        neck: [110, 92],
        hip: [110, 146],
        shoulderL: [96, 104],
        shoulderR: [124, 104],
        hipL: [102, 146],
        hipR: [118, 146],
        elbowL: [84, 124],
        handL: [96, 140],
        elbowR: [136, 124],
        handR: [144, 148],
        kneeL: [88, 162],
        footL: [108, 172],
        kneeR: [138, 160],
        footR: [116, 172],
        face: 'neutral',
        ground: 176,
        prop: prop ?? 'wrench',
        propAt: [146, 154],
        propRot: 20,
      });
    case 'dig':
      return make({
        elbowL: [108, 98],
        handL: [138, 116],
        elbowR: [140, 98],
        handR: [150, 132],
        face: 'neutral',
        prop: prop ?? 'shovel',
        propAt: [150, 136],
        propRot: 15,
      });
    case 'fish':
      return make({
        elbowL: [118, 92],
        handL: [148, 84],
        elbowR: [146, 86],
        handR: [166, 74],
        face: 'neutral',
        prop: prop ?? 'rod',
        propAt: [166, 70],
        propRot: -35,
        trail: 'M164 66 Q174 40 190 30',
      });
    case 'police':
      return make({
        elbowR: [148, 82],
        handR: [166, 70],
        elbowL: [88, 104],
        handL: [96, 122],
        face: 'neutral',
        prop: prop ?? 'badge',
        propAt: [98, 96],
      });
    case 'umbrella':
      return make({
        elbowR: [138, 62],
        handR: [140, 36],
        face: 'smile',
        prop: prop ?? 'umbrella',
        propAt: [140, 34],
      });
    case 'shopping':
      return make({
        elbowR: [134, 106],
        handR: [132, 132],
        face: 'neutral',
        prop: prop ?? 'bag',
        propAt: [132, 140],
      });
    case 'lean':
      return make({
        head: [122, 50],
        neck: [120, 66],
        hip: [114, 124],
        shoulderL: [104, 80],
        shoulderR: [136, 80],
        elbowL: [118, 98],
        handL: [132, 92],
        elbowR: [144, 98],
        handR: [132, 94],
        face: 'neutral',
        wall: true,
      });
    case 'crouch':
      return make({
        head: [110, 78],
        neck: [110, 94],
        hip: [110, 142],
        shoulderL: [96, 106],
        shoulderR: [124, 106],
        hipL: [100, 142],
        hipR: [120, 142],
        elbowL: [88, 124],
        handL: [98, 138],
        elbowR: [132, 124],
        handR: [122, 138],
        kneeL: [84, 158],
        footL: [104, 172],
        kneeR: [138, 156],
        footR: [116, 172],
        face: 'neutral',
        ground: 176,
      });
    case 'handshake':
      return make({
        elbowR: [150, 82],
        handR: [170, 78],
        face: 'smile',
        duo: true,
      });
    case 'hug':
      return make({
        elbowL: [82, 88],
        handL: [98, 92],
        elbowR: [152, 88],
        handR: [140, 92],
        face: 'smile',
        duo: true,
      });
    case 'injured':
      return make({
        head: [70, 148],
        neck: [86, 152],
        hip: [150, 156],
        shoulderL: [92, 144],
        shoulderR: [94, 160],
        hipL: [146, 150],
        hipR: [146, 162],
        elbowL: [104, 134],
        handL: [112, 116],
        elbowR: [118, 170],
        handR: [124, 176],
        kneeL: [176, 150],
        footL: [198, 156],
        kneeR: [178, 168],
        footR: [198, 164],
        face: 'sad',
        ground: 176,
        trail: 'M54 158 Q44 150 48 138',
      });
    case 'walk':
      return make({
        elbowL: [88, 106],
        handL: [82, 132],
        elbowR: [132, 100],
        handR: [140, 122],
        kneeL: [112, 152],
        footL: [126, 180],
        kneeR: [126, 150],
        footR: [106, 180],
        face: 'neutral',
      });
    case 'expression':
      return make({
        head: [110, 104],
        headR: 42,
        face: 'smile',
        ground: 0,
      });
    case 'animal':
      return make({ tail: true, ground: 176 });
    case 'think':
      return make({
        elbowR: [132, 96],
        handR: [120, 74],
        face: 'neutral',
        trail: 'M134 66 Q140 58 134 52',
      });
    case 'facepalm':
      return make({
        elbowR: [138, 68],
        handR: [116, 56],
        face: 'sad',
      });
    case 'crossarms':
      return make({
        elbowL: [102, 98],
        handL: [126, 92],
        elbowR: [118, 98],
        handR: [94, 92],
        face: 'neutral',
      });
    case 'thumbs':
      return make({
        elbowR: [132, 96],
        handR: [118, 84],
        face: 'smile',
      });
    case 'middlefinger':
      return make({
        elbowR: [148, 88],
        handR: [166, 96],
        face: 'angry',
      });
    case 'pose':
      return make({
        head: [104, 50],
        neck: [104, 66],
        hip: [110, 124],
        hipL: [102, 124],
        hipR: [122, 124],
        elbowL: [82, 100],
        handL: [90, 82],
        elbowR: [138, 104],
        handR: [142, 128],
        kneeL: [96, 154],
        footL: [90, 184],
        kneeR: [128, 152],
        footR: [138, 184],
        face: 'neutral',
      });
    default:
      return make({ face: 'neutral' });
  }
}

const motionOf = (pose: PoseId) => `m-${pose}`;

interface SketchProps {
  emote: Emote;
  index: number;
  variant?: 'card' | 'hero' | 'detail';
  frame?: number;
  className?: string;
}

function origin(p: Pt): CSSProperties {
  return { transformOrigin: `${p[0]}px ${p[1]}px`, transformBox: 'view-box' };
}

const line = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');

const ACCENTS = ['#d9552b', '#2b7a8c', '#6b4cff', '#b23a78'];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nudge(point: Pt, seed: number, shift: number): Pt {
  const dx = ((seed >> shift) % 5) - 2;
  const dy = ((seed >> (shift + 3)) % 5) - 2;
  return [point[0] + dx * 0.6, point[1] + dy * 0.45];
}

export function Sketch({ emote, index, variant = 'card', frame, className = '' }: SketchProps) {
  const seed = hash(emote.id);
  const base = specFor(emote.pose, emote.propKind, seed);
  const spec: Spec = {
    ...base,
    handL: nudge(base.handL, seed, 2),
    handR: nudge(base.handR, seed, 6),
    footL: nudge(base.footL, seed, 10),
    footR: nudge(base.footR, seed, 14),
  };
  const flip = seed % 2 === 1;
  const accent = ACCENTS[seed % ACCENTS.length];
  const figNo = String(index + 1).padStart(3, '0');
  const caption = emote.label.length > 30 ? `${emote.label.slice(0, 29)}…` : emote.label;
  const isAnimal = emote.pose === 'animal';
  const isExpression = emote.pose === 'expression';

  return (
    <svg
      className={`sketch sketch--${variant} ${motionOf(emote.pose)} ${className}`}
      viewBox="0 0 220 220"
      role="img"
      aria-label={`Croquis animé : ${emote.label}`}
      data-frame={frame}
      style={{ '--sketch-accent': accent } as CSSProperties}
    >
      <defs>
        <radialGradient id={`stage-${seed}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--sketch-accent)" stopOpacity="0.34" />
          <stop offset="55%" stopColor="var(--sketch-accent)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--sketch-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="paper">
        <rect x="0" y="0" width="220" height="220" className="paper-fill" />
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={22 * (i + 1)} y1="0" x2={22 * (i + 1)} y2="220" className="grid-line" />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={22 * (i + 1)} x2="220" y2={22 * (i + 1)} className="grid-line" />
        ))}
        <path d="M14 14h10M14 14v10M206 14h-10M206 14v10M14 206h10M14 206v-10M206 206h-10M206 206v-10" className="reg-mark" />
      </g>

      <ellipse cx="110" cy="118" rx="92" ry="80" fill={`url(#stage-${seed})`} className="stage-glow" />
      <circle cx="110" cy="112" r="88" fill="none" className="stage-ring" />

      <text x="16" y="30" className="fig-label">FIG. {figNo}</text>
      <text x="204" y="30" textAnchor="end" className="fig-meta">
        {emote.kind.toUpperCase()}
      </text>

      <g transform={flip ? 'translate(220 0) scale(-1 1)' : undefined}>
      {spec.ground > 0 && (
        <>
          <line x1="14" y1={spec.ground} x2="206" y2={spec.ground} className="ground" />
          <ellipse cx="112" cy={spec.ground + 1} rx="34" ry="4" className="shadow" />
        </>
      )}

      {spec.wall && <line x1="196" y1="24" x2="196" y2="190" className="ground" />}
      {spec.desk && (
        <>
          <line x1="58" y1="116" x2="162" y2="116" className="ground" />
          <line x1="70" y1="116" x2="70" y2="176" className="ground" />
          <line x1="150" y1="116" x2="150" y2="176" className="ground" />
        </>
      )}
      {spec.table && (
        <>
          <line x1="52" y1="126" x2="168" y2="126" className="ground" />
          <line x1="64" y1="126" x2="64" y2="176" className="ground" />
          <line x1="156" y1="126" x2="156" y2="176" className="ground" />
        </>
      )}
      {spec.block && (
        <>
          <rect x="78" y="158" width="74" height="20" rx="3" className="block" />
          <line x1="84" y1="178" x2="84" y2="184" className="ground" />
          <line x1="146" y1="178" x2="146" y2="184" className="ground" />
        </>
      )}

      {isAnimal ? (
        <g className="figure animal-figure">
          <path d="M58 156 Q56 132 82 130 L142 130 Q166 130 168 152 L168 166" className="ink body" />
          <path d="M166 138 Q186 128 188 112" className="ink tail" />
          <circle cx="58" cy="126" r="17" className="ink head" />
          <path d="M48 112 L42 98 L58 108" className="ink ear" />
          <path d="M66 112 L72 98 L58 108" className="ink ear" />
          <circle cx="52" cy="122" r="1.9" className="fill-ink" />
          <path d="M44 132 Q50 136 56 132" className="ink mouth" />
          <path d="M86 168 L86 178M104 168 L104 178M144 168 L144 178M156 166 L156 178" className="ink legs" />
          <path d="M76 136 Q88 148 100 136" className="ink collar" />
        </g>
      ) : isExpression ? (
        <g className="figure expression-figure">
          <circle cx={spec.head[0]} cy={spec.head[1]} r={spec.headR} className="ink head" />
          <path d="M78 118 Q92 126 110 126 Q128 126 142 118" className="ink jaw" />
          <g className="eyes" style={origin(spec.head)}>
            <circle cx="94" cy="96" r="2.6" className="fill-ink" />
            <circle cx="126" cy="96" r="2.6" className="fill-ink" />
          </g>
          <path d="M84 84 Q94 76 103 82" className="ink brow" />
          <path d="M117 82 Q126 76 136 84" className="ink brow" />
          <path d="M94 120 Q110 134 126 120" className="ink mouth" />
          <path d="M150 70 Q158 60 154 48" className="trail" />
        </g>
      ) : (
        <g className="figure fig-body" style={origin([110, 184])}>
          {spec.duo && (
            <g className="partner" aria-hidden="true">
              <path d="M176 78 Q196 76 204 70" className="partner-arm" />
              <circle cx="206" cy="68" r="5" className="partner-hand" />
              <path d="M172 92 Q190 92 198 100" className="partner-arm" />
            </g>
          )}

          <g className="limb leg-l" style={origin(spec.hipL)}>
            <path d={line([spec.hipL, spec.kneeL, spec.footL])} className="ink leg" />
            <path d={line([spec.footL, [spec.footL[0] + 8, spec.footL[1]]])} className="ink foot" />
          </g>
          <g className="limb leg-r" style={origin(spec.hipR)}>
            <path d={line([spec.hipR, spec.kneeR, spec.footR])} className="ink leg" />
            <path d={line([spec.footR, [spec.footR[0] + 8, spec.footR[1]]])} className="ink foot" />
          </g>

          <path d={line([spec.neck, spec.hip])} className="ink spine" />
          <path d={line([spec.shoulderL, [110, 78], spec.shoulderR])} className="ink shoulders" />
          <path d={line([spec.hipL, spec.hipR])} className="ink hips" />

          <g className="limb arm-l" style={origin(spec.shoulderL)}>
            <path d={line([spec.shoulderL, spec.elbowL, spec.handL])} className="ink arm" />
            <circle cx={spec.handL[0]} cy={spec.handL[1]} r="2.9" className="fill-ink hand-dot" />
          </g>
          <g className="limb arm-r" style={origin(spec.shoulderR)}>
            <path d={line([spec.shoulderR, spec.elbowR, spec.handR])} className="ink arm" />
            <circle cx={spec.handR[0]} cy={spec.handR[1]} r="2.9" className="fill-ink hand-dot" />
          </g>

          <g className="neck-head" style={origin(spec.neck)}>
            <circle cx={spec.head[0]} cy={spec.head[1]} r={spec.headR} className="ink head" />
            <Face face={spec.face} head={spec.head} />
          </g>
        </g>
      )}

      {spec.trail && (
        <g className="motion-trail">
          <path d={spec.trail} className="trail" />
        </g>
      )}

      {spec.prop && !isAnimal && !isExpression && (
        <Prop kind={spec.prop} at={spec.propAt} rot={spec.propRot} />
      )}

      </g>

      <text x="16" y="212" className="caption">{caption}</text>
      <text x="204" y="212" textAnchor="end" className="caption caption--dim">
        {emote.sources.map((s) => (s === 'scully' ? 'SC' : 'RP')).join('·')}
      </text>
    </svg>
  );
}

function Face({ face, head }: { face: Spec['face']; head: Pt }) {
  if (face === 'none') return null;
  const [hx, hy] = head;
  const eyeY = hy - 3;
  return (
    <g className="face">
      <circle cx={hx - 4.4} cy={eyeY} r="1.5" className="fill-ink" />
      <circle cx={hx + 4.4} cy={eyeY} r="1.5" className="fill-ink" />
      {face === 'smile' && <path d={`M${hx - 4} ${hy + 5} Q${hx} ${hy + 8} ${hx + 4} ${hy + 5}`} className="ink mouth" />}
      {face === 'neutral' && <path d={`M${hx - 3.4} ${hy + 6} L${hx + 3.4} ${hy + 6}`} className="ink mouth" />}
      {face === 'sad' && <path d={`M${hx - 4} ${hy + 7} Q${hx} ${hy + 4} ${hx + 4} ${hy + 7}`} className="ink mouth" />}
      {face === 'angry' && (
        <>
          <path d={`M${hx - 7} ${hy - 7} L${hx - 2} ${hy - 6}`} className="ink brow" />
          <path d={`M${hx + 2} ${hy - 6} L${hx + 7} ${hy - 7}`} className="ink brow" />
          <path d={`M${hx - 3.4} ${hy + 6} L${hx + 3.4} ${hy + 6}`} className="ink mouth" />
        </>
      )}
      {face === 'wow' && <circle cx={hx} cy={hy + 6} r="2.4" className="ink mouth" />}
    </g>
  );
}

function Prop({ kind, at, rot }: { kind: PropKind; at: Pt; rot: number }) {
  return (
    <g className="prop" transform={`translate(${at[0]} ${at[1]}) rotate(${rot})`}>
      {kind === 'bottle' && (
        <>
          <path d="M-3 0 h6 v11 a3 3 0 0 1 -6 0 Z" className="prop-fill" />
          <path d="M-1.5 0 v-5 h3 v5" className="prop-fill" />
        </>
      )}
      {kind === 'cup' && (
        <>
          <path d="M-5 -6 h10 l-1.5 12 h-7 Z" className="prop-fill" />
          <path d="M5 -3 q4 0 3 4 q-1 3 -4 2" className="prop-line" />
          <path d="M-2 -10 q2 -3 0 -5 M2 -9 q2 -3 0 -5" className="steam" />
        </>
      )}
      {kind === 'cig' && (
        <>
          <path d="M0 0 h12" className="prop-line" />
          <circle cx="12" cy="0" r="1.6" className="ember" />
          <path d="M13 -3 q3 -4 7 -5" className="smoke-wisp" />
        </>
      )}
      {kind === 'food' && (
        <>
          <path d="M-7 -3 a7 5 0 0 1 14 0 Z" className="prop-fill" />
          <path d="M-7 0 h14" className="prop-line" />
          <path d="M-7 3 h14" className="prop-line" />
        </>
      )}
      {kind === 'phone' && (
        <>
          <rect x="-3.5" y="-7" width="7" height="13" rx="1.5" className="prop-fill" />
          <path d="M-1.5 -5 h3" className="prop-line" />
        </>
      )}
      {kind === 'camera' && (
        <>
          <rect x="-8" y="-5" width="16" height="11" rx="2" className="prop-fill" />
          <circle cx="0" cy="1" r="3.2" className="prop-line" />
          <path d="M-4 -5 v-2 h5 v2" className="prop-line" />
        </>
      )}
      {kind === 'guitar' && (
        <>
          <ellipse cx="-8" cy="6" rx="10" ry="8" className="prop-fill" />
          <circle cx="-8" cy="6" r="3" className="prop-line" />
          <path d="M-2 0 L18 -16" className="prop-line" />
          <path d="M14 -18 l5 -4 M16 -15 l5 -4" className="prop-line" />
        </>
      )}
      {kind === 'mic' && (
        <>
          <circle cx="0" cy="-4" r="3.5" className="prop-fill" />
          <path d="M0 0 v10" className="prop-line" />
        </>
      )}
      {kind === 'wrench' && (
        <>
          <path d="M-8 8 L6 -6" className="prop-line" />
          <path d="M6 -6 a4 4 0 1 0 5 -3 a4 4 0 0 0 -5 3 Z" className="prop-fill" />
        </>
      )}
      {kind === 'shovel' && (
        <>
          <path d="M0 12 L0 -14" className="prop-line" />
          <path d="M-5 -14 h10 M-4 10 h8 l-4 7 Z" className="prop-fill" />
        </>
      )}
      {kind === 'rod' && (
        <>
          <path d="M0 8 L4 -26" className="prop-line" />
          <path d="M4 -26 q8 6 12 2" className="prop-line" />
          <path d="M16 -24 q0 8 4 14" className="string" />
        </>
      )}
      {kind === 'umbrella' && (
        <>
          <path d="M-18 2 a18 12 0 0 1 36 0 Z" className="prop-fill" />
          <path d="M0 2 v14 a3 3 0 0 0 6 0" className="prop-line" />
          <path d="M-18 2 q4 -4 9 0 q4 -4 9 0 q4 -4 9 0 q4 -4 9 0" className="prop-line" />
        </>
      )}
      {kind === 'bag' && (
        <>
          <rect x="-7" y="2" width="14" height="12" rx="2" className="prop-fill" />
          <path d="M-4 2 v-2 a4 4 0 0 1 8 0 v2" className="prop-line" />
        </>
      )}
      {kind === 'ball' && <circle cx="0" cy="4" r="7" className="prop-fill" />}
      {kind === 'badge' && (
        <path d="M0 -6 L7 -3 V3 L0 8 L-7 3 V-3 Z" className="prop-fill" />
      )}
      {kind === 'dumbbell' && (
        <>
          <path d="M-10 0 h20" className="prop-line" />
          <rect x="-14" y="-4" width="4" height="8" rx="1" className="prop-fill" />
          <rect x="10" y="-4" width="4" height="8" rx="1" className="prop-fill" />
        </>
      )}
      {kind === 'book' && (
        <>
          <rect x="-7" y="-9" width="14" height="18" rx="1" className="prop-fill" />
          <path d="M0 -9 v18 M-4 -4 h3 M1 -4 h3" className="prop-line" />
        </>
      )}
    </g>
  );
}
