export const CHARACTER_EXTRAS = [
  { id: 'headphones', name: 'Studio headphones', slot: 'accessory', price: 20, color: '#8574ef' },
  { id: 'crown', name: 'Crystal crown', slot: 'accessory', price: 45, color: '#e6b750' },
  { id: 'wings', name: 'Holographic wings', slot: 'effect', price: 70, color: '#6bcbd1' },
  { id: 'orbit', name: 'Your own orbit', slot: 'effect', price: 90, color: '#bda1f3' },
];
export const CHARACTER_OPTIONS = {
  kind: ['person', 'monster'], shape: ['rounded', 'slim', 'square'],
  eyes: ['bright', 'sleepy', 'stars', 'cyclops'], hair: ['short', 'curly', 'long', 'none'],
  outfit: ['tee', 'hoodie', 'overalls', 'blazer'], feature: ['none', 'horns', 'antennae'],
};
const defaults = { created: false, kind: 'person', shape: 'rounded', eyes: 'bright', hair: 'curly',
  outfit: 'hoodie', feature: 'none', skin: '#bc805f', hairColor: '#332d43', outfitColor: '#6e8bea',
  accessory: '', effect: '', owned: [], spent: 0, portrait: 'character' };
export function normalizeCharacter(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const result = { ...defaults, created: raw.created === true, portrait: raw.portrait === 'buddy' ? 'buddy' : 'character' };
  for (const [key, options] of Object.entries(CHARACTER_OPTIONS)) result[key] = options.includes(raw[key]) ? raw[key] : defaults[key];
  for (const key of ['skin', 'hairColor', 'outfitColor']) result[key] = /^#[0-9a-f]{6}$/i.test(raw[key]) ? raw[key] : defaults[key];
  result.owned = Array.isArray(raw.owned) ? [...new Set(raw.owned.filter(id => CHARACTER_EXTRAS.some(item => item.id === id)))] : [];
  result.spent = Number.isFinite(raw.spent) ? Math.max(0, Math.min(1e9, Math.floor(raw.spent))) : 0;
  for (const slot of ['accessory', 'effect']) result[slot] = result.owned.includes(raw[slot]) && CHARACTER_EXTRAS.some(item => item.id === raw[slot] && item.slot === slot) ? raw[slot] : '';
  return result;
}
export function buyCharacterExtra(value, id, balance) {
  const character = normalizeCharacter(value), item = CHARACTER_EXTRAS.find(extra => extra.id === id);
  if (!item) return { error: 'Item not found.' };
  if (character.owned.includes(id)) return { error: 'You already own this item.' };
  if (!Number.isFinite(balance) || balance < item.price) return { error: 'Not enough coins' };
  return { character: { ...character, created: true, spent: character.spent + item.price, owned: [...character.owned, id], [item.slot]: id }, item };
}
