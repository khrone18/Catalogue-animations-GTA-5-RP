export type Kind =
  | 'animation'
  | 'scenario'
  | 'prop'
  | 'animal'
  | 'synchronized'
  | 'expression'
  | 'walk';

export type PoseId =
  | 'idle'
  | 'wave'
  | 'salute'
  | 'point'
  | 'clap'
  | 'cheer'
  | 'dance'
  | 'sit'
  | 'kneel'
  | 'lie'
  | 'drink'
  | 'smoke'
  | 'eat'
  | 'phone'
  | 'text'
  | 'camera'
  | 'music'
  | 'dj'
  | 'workout'
  | 'fight'
  | 'mechanic'
  | 'dig'
  | 'fish'
  | 'police'
  | 'umbrella'
  | 'shopping'
  | 'typing'
  | 'lean'
  | 'crouch'
  | 'handshake'
  | 'hug'
  | 'injured'
  | 'walk'
  | 'expression'
  | 'animal'
  | 'think'
  | 'facepalm'
  | 'crossarms'
  | 'thumbs'
  | 'middlefinger'
  | 'pose';

export type PropKind =
  | 'bottle'
  | 'cup'
  | 'cig'
  | 'food'
  | 'phone'
  | 'camera'
  | 'guitar'
  | 'mic'
  | 'wrench'
  | 'shovel'
  | 'rod'
  | 'umbrella'
  | 'bag'
  | 'ball'
  | 'badge'
  | 'dumbbell'
  | 'book'
  | 'dog';

export interface RawEmote {
  id: string;
  label: string;
  command: string;
  category: string;
  kind: Kind;
  dict?: string;
  anim?: string;
  prop?: string;
  scenario?: string;
  other?: string;
  expression?: string;
  walk?: string;
  sources: string[];
}

export interface Emote extends RawEmote {
  search: string;
  pose: PoseId;
  propKind: PropKind | null;
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Rule {
  pose: PoseId;
  prop?: PropKind;
  pattern: RegExp;
}

// Ordered from the most specific gesture to the most generic one.
// These rules only choose an illustration archetype; they never create emotes.
const RULES: Rule[] = [
  { pose: 'umbrella', prop: 'umbrella', pattern: /\b(umbrella|brolly|parasol)\b/ },
  { pose: 'injured', pattern: /\b(injur|wound|hurt|pain|unconscious|dead|dying|die|corpse|coma|bleed|broken|limp|crawl)\b/ },
  { pose: 'handshake', pattern: /\b(handshake|shake hands|hand shake|dap|fist ?bump|bro shake)\b/ },
  { pose: 'hug', pattern: /\b(hug|embrace|cuddle|kiss|peck|smooch)\b/ },
  { pose: 'camera', prop: 'camera', pattern: /\b(selfie|camera|photo|picture|film|record|vlog|binocular|telescope)\b/ },
  { pose: 'music', prop: 'guitar', pattern: /\b(guitar|bass|violin|cello|harp|banjo|ukulele)\b/ },
  { pose: 'music', prop: 'mic', pattern: /\b(sing|microphone|mic|karaoke|rapper|rockstar)\b/ },
  { pose: 'music', pattern: /\b(piano|drum|sax|trumpet|flute|band|concert|music|air guitar)\b/ },
  { pose: 'dj', pattern: /\b(dj|deejay|turn ?table|mixer|scratch)\b/ },
  { pose: 'drink', prop: 'bottle', pattern: /\b(beer|bottle|wine|champagne|whisky|whiskey|vodka|tequila|booze|drink|drunk|toast|cheers|bartend|flair)\b/ },
  { pose: 'drink', prop: 'cup', pattern: /\b(coffee|tea|cup|mug|soda|juice|water|espresso|latte|cappuccino)\b/ },
  { pose: 'smoke', prop: 'cig', pattern: /\b(smoke|smoking|cigarette|cigar|vape|bong|weed|joint|blunt)\b/ },
  { pose: 'eat', prop: 'food', pattern: /\b(eat|eating|food|burger|taco|donut|doughnut|sandwich|hotdog|hot dog|pizza|fries|snack|marshmallow|meat|noodle|sushi|cookie|apple|banana|ice ?cream)\b/ },
  { pose: 'phone', prop: 'phone', pattern: /\b(phone|call|voicemail|answering)\b/ },
  { pose: 'text', prop: 'phone', pattern: /\b(text|typing|sms|message|scroll|swipe)\b/ },
  { pose: 'typing', pattern: /\b(type|typing|laptop|keyboard|computer|hack|code|write|notepad|clipboard)\b/ },
  { pose: 'dance', pattern: /\b(dance|dancing|twerk|groove|boogie|shuffle|bachata|salsa|ballet|breakdance|floss|robot|krump|vogue|twist|swing|club)\b/ },
  { pose: 'workout', prop: 'dumbbell', pattern: /\b(gym|workout|push ?up|sit ?up|plank|squat|weight|lift|pull ?up|bicep|muscle|flex|bodybuild)\b/ },
  { pose: 'workout', pattern: /\b(yoga|stretch|tai chi|meditate|exercise|jog|run|jumping jack|burpee)\b/ },
  { pose: 'fight', pattern: /\b(box|boxing|fight|fighting|martial|karate|kung ?fu|punch|kick|slap|wrestle|taunt|combat|muay)\b/ },
  { pose: 'mechanic', prop: 'wrench', pattern: /\b(mechanic|repair|wrench|fix|engine|garage|tow|tyre|tire|car wash|welding|weld)\b/ },
  { pose: 'dig', prop: 'shovel', pattern: /\b(shovel|dig|digging|grave|mine|mining|garden|gardening|plant|harvest|farm|rake|hoe)\b/ },
  { pose: 'fish', prop: 'rod', pattern: /\b(fish|fishing|rod|angling|cast)\b/ },
  { pose: 'police', prop: 'badge', pattern: /\b(cop|police|sheriff|swat|army|military|soldier|guard|security|medic|ems|paramedic|firefighter|fireman|handcuff|arrest|ticket|patrol|ranger|marshal|officer)\b/ },
  { pose: 'salute', pattern: /\b(salute|saluting|attention|at ease|officer salute)\b/ },
  { pose: 'wave', pattern: /\b(wave|waving|hello|hi|hey|bye|goodbye|greet|greeting|beckon|come here)\b/ },
  { pose: 'point', pattern: /\b(point|pointing|indicate|direction|look there|over there)\b/ },
  { pose: 'clap', pattern: /\b(clap|clapping|applaud|applause|slow clap)\b/ },
  { pose: 'cheer', pattern: /\b(cheer|cheering|celebrate|celebration|victory|win|winner|hooray|yeah|excited|pump|raise the roof|throw money)\b/ },
  { pose: 'crossarms', pattern: /\b(cross ?arm|crossed arms|arms folded|fold arms|arms crossed)\b/ },
  { pose: 'think', pattern: /\b(think|thinking|ponder|hmm|shrug|confus|doubt|suspicious)\b/ },
  { pose: 'facepalm', pattern: /\b(facepalm|face palm|doh|disappoint|exasperat)\b/ },
  { pose: 'thumbs', pattern: /\b(thumb|thumbs up|thumbs down|like|approve|disapprove)\b/ },
  { pose: 'middlefinger', pattern: /\b(middle ?finger|finger|fuck you|flip off|flipping)\b/ },
  { pose: 'kneel', pattern: /\b(kneel|kneeling|pray|praying|propose|beg|worship)\b/ },
  { pose: 'crouch', pattern: /\b(crouch|crouching|sneak|stealth|duck)\b/ },
  { pose: 'lean', pattern: /\b(lean|leaning|wall|bar|railing)\b/ },
  { pose: 'sit', pattern: /\b(sit|sitting|chair|bench|seat|stool|throne|ledge|picnic|campfire|log)\b/ },
  { pose: 'lie', pattern: /\b(lay|laying|lying|sleep|sleeping|nap|bed|sunbathe|prone|stomach|back|floor)\b/ },
  { pose: 'shopping', prop: 'bag', pattern: /\b(bag|shopping|suitcase|briefcase|luggage|box|package|carry|delivery|trash|garbage|bin)\b/ },
  { pose: 'pose', pattern: /\b(pose|posing|model|photoshoot|stance|idle|stand|standing|wait|waiting)\b/ },
];

export function inferPose(emote: RawEmote): { pose: PoseId; propKind: PropKind | null } {
  if (emote.kind === 'animal') return { pose: 'animal', propKind: 'dog' };
  if (emote.kind === 'expression') return { pose: 'expression', propKind: null };
  if (emote.kind === 'walk') return { pose: 'walk', propKind: null };
  if (emote.kind === 'synchronized') return { pose: 'handshake', propKind: null };

  const text = normalize(`${emote.label} ${emote.command}`);
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return { pose: rule.pose, propKind: rule.prop ?? null };
  }

  const fallback = normalize(`${emote.dict ?? ''} ${emote.anim ?? ''}`);
  for (const rule of RULES) {
    if (rule.pattern.test(fallback)) return { pose: rule.pose, propKind: rule.prop ?? null };
  }

  if (emote.kind === 'prop') return { pose: 'pose', propKind: null };
  if (emote.kind === 'scenario') return { pose: 'pose', propKind: null };
  return { pose: 'idle', propKind: null };
}

export function enrich(raw: RawEmote): Emote {
  const { pose, propKind } = inferPose(raw);
  const search = normalize(
    [
      raw.label,
      raw.command,
      raw.category,
      raw.dict,
      raw.anim,
      raw.prop,
      raw.scenario,
      raw.expression,
      raw.walk,
      raw.kind,
    ]
      .filter(Boolean)
      .join(' '),
  );
  return { ...raw, search, pose, propKind };
}
