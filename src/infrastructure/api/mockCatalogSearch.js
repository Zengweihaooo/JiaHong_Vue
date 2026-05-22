import { fetchJson } from "./httpClient.js";
import { pinyinMap } from "./mockPinyinIndex.js";

const localClinicalCatalogUrl = new URL("../mocks/local-clinical-catalog.json", import.meta.url);
const prescriptionCatalogUrl = new URL("../mocks/prescription-catalog.json", import.meta.url);

function delay(ms = 60) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function compareByPinyin(left, right) {
  return new Intl.Collator("zh-Hans-u-co-pinyin").compare(left, right);
}

function normalizeKeyword(keyword = "") {
  return normalizeSearchText(keyword);
}

function normalizeExcluded(exclude = []) {
  return new Set((Array.isArray(exclude) ? exclude : []).filter(Boolean));
}

function normalizeSearchText(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function getPinyinParts(value = "") {
  const syllables = [];
  for (const char of String(value)) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      const syllable = pinyinMap[char];
      if (syllable) syllables.push(syllable);
    } else if (/[a-zA-Z0-9]/.test(char)) {
      syllables.push(char.toLowerCase());
    }
  }
  return syllables;
}

function getSearchVariants(values = []) {
  const sourceValues = values.filter(Boolean).map(String);
  const compactText = sourceValues.map(normalizeSearchText).join("");
  const syllables = sourceValues.flatMap(getPinyinParts);
  const pinyin = syllables.join("");
  const initials = syllables.map((part) => part[0]).join("");
  return [compactText, pinyin, initials, syllables.join(" ")].filter(Boolean);
}

function matchesSearch(values = [], normalizedKeyword = "") {
  if (!normalizedKeyword) return true;
  return getSearchVariants(values).some((variant) => variant.includes(normalizedKeyword));
}

function mergeDiagnosisCatalogs(primaryDiagnoses = [], fallbackDiagnoses = []) {
  return Array.from(new Set([...primaryDiagnoses, ...fallbackDiagnoses].filter(Boolean)));
}

function mergeMedicineCatalogs(primaryMedicines = [], fallbackMedicines = []) {
  const seen = new Set();
  return [...primaryMedicines, ...fallbackMedicines].filter((medicine) => {
    const key = `${medicine.name}-${medicine.spec}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchDiagnosisCatalog({ keyword = "", exclude = [] } = {}) {
  await delay(60);
  const clinicalCatalog = await fetchJson(localClinicalCatalogUrl);
  const catalog = await fetchJson(prescriptionCatalogUrl);
  const normalizedKeyword = normalizeKeyword(keyword);
  const excluded = normalizeExcluded(exclude);
  const diagnoses = mergeDiagnosisCatalogs(clinicalCatalog.diagnoses || [], catalog.diagnoses || []);
  const items = diagnoses
    .filter((diagnosis) => !excluded.has(diagnosis))
    .filter((diagnosis) => matchesSearch([diagnosis], normalizedKeyword))
    .sort(compareByPinyin);

  return {
    items,
    total: items.length,
    keyword
  };
}

export async function searchMedicineCatalog({ keyword = "", exclude = [] } = {}) {
  await delay(60);
  const clinicalCatalog = await fetchJson(localClinicalCatalogUrl);
  const catalog = await fetchJson(prescriptionCatalogUrl);
  const normalizedKeyword = normalizeKeyword(keyword);
  const excluded = normalizeExcluded(exclude);
  const medicines = mergeMedicineCatalogs(clinicalCatalog.medicines || [], catalog.medicines || []);
  const items = medicines
    .filter((medicine) => !excluded.has(medicine.name))
    .filter((medicine) => matchesSearch([
      medicine.name,
      medicine.spec,
      medicine.category,
      ...(medicine.aliases || []),
      ...(medicine.indications || [])
    ], normalizedKeyword))
    .sort((left, right) => compareByPinyin(left.name, right.name));

  return {
    items,
    total: items.length,
    keyword
  };
}
