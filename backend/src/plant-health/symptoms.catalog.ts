/**
 * Symptoms an owner can report and the causes they point to.
 *
 * Data status: TO VERIFY. Texts and weights are a first draft by the team,
 * not checked against a horticultural source yet (see docs/care-rules.md).
 * Every text has an English and a Ukrainian version.
 */

export interface LocalizedText {
  en: string;
  uk: string;
}

export const SYMPTOM_CODES = [
  'YELLOW_LEAVES',
  'BROWN_TIPS',
  'WILTING',
  'SOFT_STEM_OR_ROT',
  'LEAF_DROP',
  'PALE_OR_LEGGY',
  'BURN_SPOTS',
  'CURLING_LEAVES',
  'PESTS_VISIBLE',
  'MOLD_ON_SOIL',
  'SLOW_GROWTH',
  'ROOTS_OUT_OF_POT',
] as const;
export type SymptomCode = (typeof SYMPTOM_CODES)[number];

export const CAUSE_CODES = [
  'OVERWATERING',
  'UNDERWATERING',
  'LOW_LIGHT',
  'TOO_MUCH_SUN',
  'DRY_AIR',
  'ROOT_BOUND',
  'NUTRIENT_DEFICIENCY',
  'PESTS',
  'COLD_OR_DRAFT',
] as const;
export type CauseCode = (typeof CAUSE_CODES)[number];

export const SYMPTOMS: Readonly<Record<SymptomCode, LocalizedText>> = {
  YELLOW_LEAVES: { en: 'Yellow leaves', uk: 'Жовтіє листя' },
  BROWN_TIPS: {
    en: 'Brown, dry leaf tips or edges',
    uk: 'Коричневі сухі кінчики або краї листя',
  },
  WILTING: { en: 'Drooping, limp leaves', uk: 'Листя обвисло, мʼяке' },
  SOFT_STEM_OR_ROT: {
    en: 'Soft, dark stem base or rotten smell',
    uk: 'Мʼяка темна основа стебла або запах гнилі',
  },
  LEAF_DROP: { en: 'Leaves are falling off', uk: 'Опадає листя' },
  PALE_OR_LEGGY: {
    en: 'Pale leaves, long thin stems leaning to the light',
    uk: 'Бліде листя, довгі тонкі стебла тягнуться до світла',
  },
  BURN_SPOTS: {
    en: 'Bleached or brown burnt patches',
    uk: 'Вицвілі або коричневі плями-опіки',
  },
  CURLING_LEAVES: { en: 'Leaves curl or crisp', uk: 'Листя скручується' },
  PESTS_VISIBLE: {
    en: 'Tiny insects, webs or sticky leaves',
    uk: 'Дрібні комахи, павутинка або липке листя',
  },
  MOLD_ON_SOIL: {
    en: 'White mould or small flies on the soil',
    uk: 'Біла цвіль або мушки на ґрунті',
  },
  SLOW_GROWTH: {
    en: 'No new growth for a long time',
    uk: 'Довго немає нового росту',
  },
  ROOTS_OUT_OF_POT: {
    en: 'Roots come out of the drainage holes',
    uk: 'Коріння вилазить з дренажних отворів',
  },
};

/** Points a symptom adds to each cause it points to. */
export const SYMPTOM_WEIGHTS: Readonly<
  Record<SymptomCode, Partial<Record<CauseCode, number>>>
> = {
  YELLOW_LEAVES: { OVERWATERING: 2, NUTRIENT_DEFICIENCY: 1, LOW_LIGHT: 1 },
  BROWN_TIPS: { DRY_AIR: 2, UNDERWATERING: 1 },
  WILTING: { UNDERWATERING: 2, OVERWATERING: 1, COLD_OR_DRAFT: 1 },
  SOFT_STEM_OR_ROT: { OVERWATERING: 3 },
  LEAF_DROP: {
    COLD_OR_DRAFT: 2,
    OVERWATERING: 1,
    UNDERWATERING: 1,
    LOW_LIGHT: 1,
  },
  PALE_OR_LEGGY: { LOW_LIGHT: 3 },
  BURN_SPOTS: { TOO_MUCH_SUN: 3 },
  CURLING_LEAVES: { UNDERWATERING: 1, TOO_MUCH_SUN: 1, DRY_AIR: 1, PESTS: 1 },
  PESTS_VISIBLE: { PESTS: 3 },
  MOLD_ON_SOIL: { OVERWATERING: 2 },
  SLOW_GROWTH: { LOW_LIGHT: 1, NUTRIENT_DEFICIENCY: 1, ROOT_BOUND: 1 },
  ROOTS_OUT_OF_POT: { ROOT_BOUND: 3 },
};

export interface CauseInfo {
  title: LocalizedText;
  actions: readonly LocalizedText[];
}

export const CAUSES: Readonly<Record<CauseCode, CauseInfo>> = {
  OVERWATERING: {
    title: { en: 'Too much water', uk: 'Перелив' },
    actions: [
      {
        en: 'Skip watering until the top 2–3 cm of soil are dry.',
        uk: 'Не поливайте, доки верхні 2–3 см ґрунту не просохнуть.',
      },
      {
        en: 'Empty the saucer and check that the pot has drainage holes.',
        uk: 'Злийте воду з піддону й перевірте, що в горщику є дренажні отвори.',
      },
      {
        en: 'If the stem base is soft, take the plant out, cut off dark, mushy roots and repot into fresh dry soil.',
        uk: 'Якщо основа стебла мʼяка, вийміть рослину, обріжте темне мʼяке коріння й пересадіть у свіжий сухий ґрунт.',
      },
    ],
  },
  UNDERWATERING: {
    title: { en: 'Not enough water', uk: 'Нестача води' },
    actions: [
      {
        en: 'Water slowly until water runs out of the drainage holes.',
        uk: 'Повільно полийте, доки вода не почне витікати з дренажних отворів.',
      },
      {
        en: 'If the soil has shrunk from the pot walls, soak the pot in water for 15–20 minutes.',
        uk: 'Якщо ґрунт відстав від стінок, поставте горщик у воду на 15–20 хвилин.',
      },
    ],
  },
  LOW_LIGHT: {
    title: { en: 'Too little light', uk: 'Мало світла' },
    actions: [
      {
        en: 'Move the plant closer to a window, out of direct midday sun.',
        uk: 'Перенесіть рослину ближче до вікна, але без прямого полуденного сонця.',
      },
      {
        en: 'In low light, water less often: the soil dries more slowly.',
        uk: 'У тіні поливайте рідше: ґрунт просихає повільніше.',
      },
    ],
  },
  TOO_MUCH_SUN: {
    title: { en: 'Too much direct sun', uk: 'Забагато прямого сонця' },
    actions: [
      {
        en: 'Move the plant a little away from the window or shade it with a light curtain.',
        uk: 'Відсуньте рослину від вікна або притіньте легкою шторою.',
      },
      {
        en: 'Burnt patches do not recover; trim them only if they bother you.',
        uk: 'Опіки не зникнуть; обріжте їх, лише якщо вони заважають.',
      },
    ],
  },
  DRY_AIR: {
    title: { en: 'Dry air', uk: 'Сухе повітря' },
    actions: [
      {
        en: 'Move the plant away from the radiator.',
        uk: 'Відсуньте рослину від батареї.',
      },
      {
        en: 'Raise humidity: a tray with wet pebbles or a humidifier nearby.',
        uk: 'Підвищіть вологість: піддон з мокрою галькою або зволожувач поруч.',
      },
    ],
  },
  ROOT_BOUND: {
    title: { en: 'Pot is too small', uk: 'Тісний горщик' },
    actions: [
      {
        en: 'Repot into a pot 2–3 cm wider, best in spring.',
        uk: 'Пересадіть у горщик на 2–3 см ширший, краще навесні.',
      },
    ],
  },
  NUTRIENT_DEFICIENCY: {
    title: { en: 'Lack of nutrients', uk: 'Нестача поживних речовин' },
    actions: [
      {
        en: 'Feed with a houseplant fertiliser at half strength in spring and summer.',
        uk: 'Підживлюйте добривом для кімнатних рослин у половинній дозі навесні та влітку.',
      },
      {
        en: 'Do not feed a plant that is drying out or rotting: fix watering first.',
        uk: 'Не підживлюйте пересохлу або загниваючу рослину: спершу налагодьте полив.',
      },
    ],
  },
  PESTS: {
    title: { en: 'Pests', uk: 'Шкідники' },
    actions: [
      {
        en: 'Keep the plant away from other plants.',
        uk: 'Відставте рослину від інших.',
      },
      {
        en: 'Wipe leaves on both sides with warm soapy water; repeat weekly for 3 weeks.',
        uk: 'Протріть листя з обох боків теплою мильною водою; повторюйте щотижня 3 тижні.',
      },
    ],
  },
  COLD_OR_DRAFT: {
    title: { en: 'Cold or a draught', uk: 'Холод або протяг' },
    actions: [
      {
        en: 'Keep the plant away from open windows and doors in cold weather.',
        uk: 'У холод тримайте рослину подалі від відчинених вікон і дверей.',
      },
      {
        en: 'Do not stand it on a cold windowsill; put a board or cork mat under the pot.',
        uk: 'Не ставте на холодне підвіконня; підкладіть під горщик дощечку або корок.',
      },
    ],
  },
};
