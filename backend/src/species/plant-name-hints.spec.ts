import { catalogTermsFor, guessWaterNeed } from './plant-name-hints.js';

describe('guessWaterNeed', () => {
  it.each([
    ['кактус', 'LOW'],
    ['Мій кактусик', 'LOW'],
    ['Кактуси на кухні', 'LOW'],
    ['Aloe vera', 'LOW'],
    ['сукулент', 'LOW'],
    ['грошове дерево', 'LOW'],
    ['ZZ plant', 'LOW'],
    ['троянда', 'HIGH'],
    ['Троянди', 'HIGH'],
    ['mini rose', 'HIGH'],
    ['Бостонська папороть', 'HIGH'],
    ['жіноче щастя', 'HIGH'],
    ['Calathea orbifolia', 'HIGH'],
  ])('%s -> %s', (text, need) => {
    expect(guessWaterNeed(text)).toBe(need);
  });

  it.each(['Монстера', 'Fiddle Leaf Fig', 'rosemary', 'tulip', ''])(
    '%s -> null (no hint)',
    (text) => {
      expect(guessWaterNeed(text)).toBeNull();
    },
  );
});

describe('catalogTermsFor', () => {
  it('maps Ukrainian names to catalog names', () => {
    expect(catalogTermsFor('кактус')).toContain('opuntia');
    expect(catalogTermsFor('Монстера')).toEqual(['monstera']);
    expect(catalogTermsFor('папороть')).toContain('nephrolepis');
    expect(catalogTermsFor('жіноче щастя')).toEqual(['spathiphyllum']);
  });

  it('adds nothing for Latin or unknown names', () => {
    expect(catalogTermsFor('monst')).toEqual([]);
    expect(catalogTermsFor('тюльпан')).toEqual([]);
  });
});
