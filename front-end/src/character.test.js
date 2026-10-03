import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCharacter } from './character.js';
import { purchase, coinBalance, adoptBuddy } from './economy.js';

test('free appearance choices persist without changing a shared coin balance', () => {
  const character = normalizeCharacter({ created: true, kind: 'monster', shape: 'square', eyes: 'cyclops', skin: '#66aaff', outfit: 'blazer' });
  assert.equal(character.kind, 'monster');
  assert.equal(character.eyes, 'cyclops');
  assert.equal(coinBalance({ gems: 50 }, { character }), 50);
});
test('character extras, buddy purchases, and arcade tickets use the same balance', () => {
  let prefs = adoptBuddy({}, 'dino').prefs;
  prefs = purchase(prefs, { gems: 32 }, 'character', 'headphones').prefs;
  assert.equal(prefs.character.accessory, 'headphones');
  assert.equal(coinBalance({ gems: 32 }, prefs), 12);
  assert.ok(purchase(prefs, { gems: 32 }, 'character', 'headphones').error);
  assert.ok(purchase(prefs, { gems: 32 }, 'character', 'orbit').error);
  prefs = purchase(prefs, { gems: 32 }, 'buddy', 'apple').prefs;
  prefs = purchase(prefs, { gems: 32 }, 'game').prefs;
  assert.equal(coinBalance({ gems: 32 }, prefs), 4);
});
test('invalid choices and unowned extras cannot be equipped', () => {
  const c = normalizeCharacter({ shape: 'bad', skin: 'url(secret)', owned: ['crown', 'crown', 'bogus'], accessory: 'wings', effect: 'orbit', spent: -100 });
  assert.equal(c.shape, 'rounded');
  assert.equal(c.skin, '#bc805f');
  assert.deepEqual(c.owned, ['crown']);
  assert.equal(c.accessory, '');
  assert.equal(c.effect, '');
  assert.equal(c.spent, 0);
  assert.equal(normalizeCharacter(null).kind, 'person');
});
