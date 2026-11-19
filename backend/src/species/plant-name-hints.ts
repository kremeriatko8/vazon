import type { WaterNeed } from '../generated/prisma/enums.js';

/**
 * Hints from the names people type, in Ukrainian and English.
 *
 * The catalog has English and Latin names only, so "кактус" found nothing and
 * the plant was saved without a species, with a generic watering schedule.
 * Data status: TO VERIFY (see docs/care-rules.md).
 *
 * A keyword matches a word that starts with it ("кактус" matches "кактуси"),
 * or the whole word when it ends with "=" ("rose=" matches "rose" and "roses"
 * but not "rosemary"). Keywords with a space match as a phrase.
 */

/** Ukrainian name -> Latin or English terms to search the catalog for. */
const UK_TO_CATALOG: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['кактус', ['cactus', 'opuntia', 'epiphyllum', 'rhipsalis']],
  ['опунці', ['opuntia']],
  ['алое', ['aloe']],
  ['монстер', ['monstera']],
  ['фікус', ['ficus']],
  ['заміокулькас', ['zamioculcas']],
  ['доларове дерево', ['zamioculcas']],
  ['сансевієр', ['sansevieria']],
  ['сансев', ['sansevieria']],
  ['щучий хвіст', ['sansevieria']],
  ['тещин язик', ['sansevieria']],
  ['спатифілум', ['spathiphyllum']],
  ['жіноче щастя', ['spathiphyllum']],
  ['калате', ['calathea']],
  ['марант', ['maranta']],
  ['строманте', ['stromanthe']],
  [
    'папор',
    [
      'nephrolepis',
      'asplenium',
      'davallia',
      'microsorum',
      'adiantum',
      'platycerium',
    ],
  ],
  ['нефролеп', ['nephrolepis']],
  ['адіантум', ['adiantum']],
  ['драцен', ['dracaena']],
  ['пальм', ['palm']],
  ['хамедоре', ['chamaedorea']],
  ['епіпремнум', ['epipremnum']],
  ['потос', ['epipremnum', 'scindapsus']],
  ['сциндапсус', ['scindapsus']],
  ['філодендрон', ['philodendron']],
  ['аглаонем', ['aglaonema']],
  ['діффенбахі', ['dieffenbachia']],
  ['дифенбахі', ['dieffenbachia']],
  ['кротон', ['codiaeum']],
  ['кодієум', ['codiaeum']],
  ['пеперомі', ['peperomia']],
  ['пілея', ['pilea']],
  ['хлорофітум', ['chlorophytum']],
  ['традесканці', ['tradescantia']],
  ['хойя', ['hoya']],
  ['восковий плющ', ['hoya']],
  ['бегоні', ['begonia']],
  ['стреліці', ['strelitzia']],
  ['шефлер', ['schefflera']],
  ['юка', ['yucca']],
  ['товстянк', ['crassula']],
  ['грошове дерево', ['crassula']],
  ['крассул', ['crassula']],
  ['аспідистр', ['aspidistra']],
  ['араукар', ['araucaria']],
  ['гібіскус', ['hibiscus']],
  ['китайська троянда', ['hibiscus']],
  ['пахіподіум', ['pachypodium']],
  ['бокарне', ['beaucarnea']],
  ['пляшкове дерево', ['beaucarnea']],
  ['сукулент', ['crassula', 'aloe', 'senecio', 'ceropegia']],
  ['оксаліс', ['oxalis']],
  ['кислиц', ['oxalis']],
];

/** Words that point to a water need when no catalog species is linked. */
const WATER_NEED_WORDS: Readonly<Record<'LOW' | 'HIGH', readonly string[]>> = {
  LOW: [
    'кактус',
    'cactus',
    'cacti',
    'сукулент',
    'succulent',
    'алое',
    'aloe',
    'опунці',
    'opuntia',
    'агав',
    'agave',
    'ехевері',
    'echeveria',
    'хаворті',
    'haworthia',
    'літопс',
    'lithops',
    'товстянк',
    'грошове дерево',
    'crassula',
    'money tree',
    'заміокулькас',
    'доларове дерево',
    'zamioculcas',
    'zz=',
    'сансев',
    'sansevier',
    'щучий хвіст',
    'тещин язик',
    'snake plant',
    'юка',
    'yucca',
    'молочай',
    'euphorbia',
    'каланхое',
    'kalanchoe',
    'очиток',
    'sedum',
    'молодило',
    'sempervivum',
    'пахіподіум',
    'pachypodium',
    'бокарне',
    'beaucarnea',
    'нолін',
    'гастері',
    'gasteria',
  ],
  HIGH: [
    'папор',
    'fern',
    'нефролеп',
    'nephrolepis',
    'адіантум',
    'adiantum',
    'калате',
    'calathea',
    'марант',
    'maranta',
    'строманте',
    'stromanthe',
    'спатифілум',
    'spathiphyllum',
    'peace lily',
    'жіноче щастя',
    'троянд',
    'rose=',
    'roses=',
    'азалі',
    'azalea',
    'гортенз',
    'hydrangea',
    'циперус',
    'cyperus',
    'папірус',
    'фітоні',
    'фіттоні',
    'fittonia',
    'базилік',
    'basil',
    "м'ят",
    'мʼят',
    'mint=',
  ],
};

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’ʼ']/g, "'")
    .split(/[^a-zа-яіїєґ']+/u)
    .filter(Boolean);
}

function matches(text: string, keyword: string): boolean {
  const normalized = text.toLowerCase().replace(/[’ʼ']/g, "'");
  const key = keyword.replace(/[’ʼ']/g, "'");
  if (key.includes(' ')) return normalized.includes(key);
  if (key.endsWith('=')) {
    const exact = key.slice(0, -1);
    return words(normalized).includes(exact);
  }
  return words(normalized).some((word) => word.startsWith(key));
}

/** Catalog search terms for a Ukrainian query, e.g. "кактус" -> opuntia, ... */
export function catalogTermsFor(query: string): string[] {
  const terms = new Set<string>();
  for (const [keyword, latin] of UK_TO_CATALOG) {
    if (matches(query, keyword)) latin.forEach((t) => terms.add(t));
  }
  return [...terms];
}

/**
 * Water need guessed from a free-text species or plant name, or null when
 * nothing matches. A catalog species, when linked, always wins over this.
 */
export function guessWaterNeed(text: string): WaterNeed | null {
  if (WATER_NEED_WORDS.LOW.some((k) => matches(text, k))) return 'LOW';
  if (WATER_NEED_WORDS.HIGH.some((k) => matches(text, k))) return 'HIGH';
  return null;
}
