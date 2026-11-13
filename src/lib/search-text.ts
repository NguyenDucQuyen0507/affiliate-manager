// Diacritic-insensitive search helpers (pure; used by the app and the seed script).

/** Lowercases and strips Vietnamese diacritics so "binh sua" matches "Bình sữa". */
export function normalizeSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/** Value stored in Deal.searchText. Must be recomputed on every deal write. */
export function buildDealSearchText(title: string, searchCode: string | null) {
  return normalizeSearch([title, searchCode ?? ""].join(" "));
}
