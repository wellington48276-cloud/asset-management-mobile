export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function buildRange(startValue, endValue, limit = 5000) {
  const startText = onlyDigits(startValue);
  const endText = onlyDigits(endValue);
  if (!startText || !endText) return [];

  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start) return [];

  const amount = end - start + 1;
  if (amount > limit) return [];

  const width = Math.max(startText.length, endText.length);
  return Array.from({ length: amount }, (_, index) => String(start + index).padStart(width, '0'));
}

export function folderFromPlates(plates) {
  const clean = Array.isArray(plates) ? plates.map(onlyDigits).filter(Boolean) : [];
  if (!clean.length) return '';
  return clean.length === 1 ? clean[0] : `${clean[0]} a ${clean[clean.length - 1]}`;
}

export function replacePlate(plates, index, nextPlate) {
  const clean = onlyDigits(nextPlate);
  if (!clean || !Array.isArray(plates) || index < 0 || index >= plates.length) return plates;
  if (plates.some((plate, currentIndex) => currentIndex !== index && plate === clean)) return plates;
  return plates.map((plate, currentIndex) => (currentIndex === index ? clean : plate));
}
