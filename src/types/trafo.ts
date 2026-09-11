export interface RawTrafoRecord {
  id: string;
  tanggal: string;
  unit: string;
  feeder: string;
  noGardu: string;
  kvaGardu: string | number;
  rateNhFuse: string | number;
  // Induk Malam (REL) - dari Sheet BEBAN PUNCAK GARDU
  rInduk: number | string;
  sInduk: number | string;
  tInduk: number | string;
  nInduk: number | string;
  // Tegangan Malam
  rs: number | string;
  rt: number | string;
  st: number | string;
  rn: number | string;
  sn: number | string;
  tn: number | string;
  // Jurusan Malam 1
  r1: number | string;
  s1: number | string;
  t1: number | string;
  n1: number | string;
  // Jurusan Malam 2
  r2: number | string;
  s2: number | string;
  t2: number | string;
  n2: number | string;
  // Jurusan Malam 3
  r3: number | string;
  s3: number | string;
  t3: number | string;
  n3: number | string;
  // Jurusan Malam 4
  r4: number | string;
  s4: number | string;
  t4: number | string;
  n4: number | string;

  // Induk Siang (REL) - dari Sheet TEMUAN GARDU TIER 1 DAN TIER 1&
  siangRInduk?: number | string;
  siangSInduk?: number | string;
  siangTInduk?: number | string;
  siangNInduk?: number | string;
  // Tegangan Siang
  siangRs?: number | string;
  siangRt?: number | string;
  siangSt?: number | string;
  siangRn?: number | string;
  siangSn?: number | string;
  siangTn?: number | string;
  // Jurusan Siang 1
  siangR1?: number | string;
  siangS1?: number | string;
  siangT1?: number | string;
  siangN1?: number | string;
  // Jurusan Siang 2
  siangR2?: number | string;
  siangS2?: number | string;
  siangT2?: number | string;
  siangN2?: number | string;
  // Jurusan Siang 3
  siangR3?: number | string;
  siangS3?: number | string;
  siangT3?: number | string;
  siangN3?: number | string;
  // Jurusan Siang 4
  siangR4?: number | string;
  siangS4?: number | string;
  siangT4?: number | string;
  siangN4?: number | string;

  // Catatan
  temuanTier1?: string;
  temuanTier2?: string;
  keterangan?: string;
  // Measurement time
  jamMalam?: string;
  jamSiang?: string;
  kategoriWaktu?: 'MALAM' | 'SIANG' | 'KEDUANYA';
  sourceSheets?: string[];
}

export interface ReportConfig {
  judul: string;
  bulanTahun: string;
  ulpUnit: string;
  selectedFeeder: string; // 'ALL' or specific feeder name
  selectedUnit: string;   // 'ALL' or specific unit name
  defaultJamMalam: string; // '19:00'
  jamAkhirMalam?: string;  // '23:00'
  defaultJamSiang: string; // '10:00'
  jamAkhirSiang?: string;  // '18:00'
  waktuTarget: 'MALAM' | 'SIANG' | 'OTOMATIS';
  sheetMalamName?: string; // 'BEBAN PUNCAK GARDU'
  sheetSiangName?: string; // 'TEMUAN GARDU TIER 1 DAN TIER 1&'
  sortMode?: SortOrderMode;

  // Setting Pedoman Pengesahan & Tanda Tangan (Akhir Tabel):
  namaTlTeknik?: string;
  namaPengatur?: string;
  kota?: string;
  tanggalCetak?: string;

  // Setting Tanda Tangan Khusus / Lengkap untuk Semua ULP
  ulpSignatures?: Record<string, UlpSignatureItem>;
}

export interface UlpSignatureItem {
  ulpName: string;
  namaTlTeknik: string;
  namaPengatur: string;
  kota: string;
  tanggalCetak: string;
}

export const DEFAULT_KNOWN_ULPS: UlpSignatureItem[] = [
  {
    ulpName: 'ULP BUKITTINGGI',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'BUKITTINGGI',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP BASO',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'BASO',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP PADANG PANJANG',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'PADANG PANJANG',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP LUBUK SIKAPING',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'LUBUK SIKAPING',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP LUBUK BASUNG',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'LUBUK BASUNG',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP SIMPANG EMPAT',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'SIMPANG EMPAT',
    tanggalCetak: '31 AGUSTUS 2026',
  },
  {
    ulpName: 'ULP KOTO TUO',
    namaTlTeknik: '<<NAMA TL TEKNIK>>',
    namaPengatur: '<<PENGATUR>>',
    kota: 'KOTO TUO',
    tanggalCetak: '31 AGUSTUS 2026',
  },
];

export function normalizeUlpKey(val: string | undefined): string {
  if (!val) return '';
  const clean = val.trim().toUpperCase();
  if (clean.startsWith('ULP ')) return clean;
  if (clean.startsWith('ULP')) return `ULP ${clean.substring(3).trim()}`;
  return `ULP ${clean}`;
}

export function getSignatureForUlp(
  unitOrUlp: string | undefined,
  config: ReportConfig
): UlpSignatureItem {
  const normKey = normalizeUlpKey(unitOrUlp || config.ulpUnit || 'ULP BUKITTINGGI');

  // 1. Cek konfigurasi spesifik pada ulpSignatures
  if (config.ulpSignatures && config.ulpSignatures[normKey]) {
    const item = config.ulpSignatures[normKey];
    return {
      ulpName: item.ulpName || normKey,
      namaTlTeknik: item.namaTlTeknik || config.namaTlTeknik || '<<NAMA TL TEKNIK>>',
      namaPengatur: item.namaPengatur || config.namaPengatur || '<<PENGATUR>>',
      kota: item.kota || config.kota || normKey.replace('ULP ', ''),
      tanggalCetak: item.tanggalCetak || config.tanggalCetak || '31 AGUSTUS 2026',
    };
  }

  // 2. Cek default known ULPs
  const known = DEFAULT_KNOWN_ULPS.find((k) => k.ulpName === normKey);
  if (known) {
    return {
      ulpName: known.ulpName,
      namaTlTeknik: config.namaTlTeknik || known.namaTlTeknik,
      namaPengatur: config.namaPengatur || known.namaPengatur,
      kota: known.kota || config.kota || 'BUKITTINGGI',
      tanggalCetak: config.tanggalCetak || known.tanggalCetak,
    };
  }

  // 3. Fallback umum
  const derivedKota = normKey.replace('ULP ', '').trim() || config.kota || 'BUKITTINGGI';
  return {
    ulpName: normKey || 'ULP BUKITTINGGI',
    namaTlTeknik: config.namaTlTeknik || '<<NAMA TL TEKNIK>>',
    namaPengatur: config.namaPengatur || '<<PENGATUR>>',
    kota: config.kota || derivedKota,
    tanggalCetak: config.tanggalCetak || '31 AGUSTUS 2026',
  };
}

export type SortOrderMode = 'TGL_THEN_NOGD' | 'NOGD_THEN_TGL';

export function getUlpSignatureLabel(ulpInput: string | undefined): string {
  const val = (ulpInput || '').trim();
  if (!val) return '<<ULP>>';
  if (val.startsWith('<<') && val.endsWith('>>')) return val;
  if (val.toUpperCase().startsWith('ULP')) {
    return val.toUpperCase();
  }
  return `ULP ${val.toUpperCase()}`;
}

export function formatUlpName(unitDesc: string | undefined): string {
  const trimmed = (unitDesc || '').trim();
  if (!trimmed) return 'ULP BUKITTINGGI';
  if (trimmed.toUpperCase().startsWith('ULP')) {
    return trimmed.toUpperCase();
  }
  return `ULP ${trimmed.toUpperCase()}`;
}

/**
 * Format No. Gardu menjadi minimal 4 digit angka (misal: 18 -> "0018", 1 -> "0001", 138 -> "0138")
 * Menangani angka murni, angka berawalan/berakhiran huruf, serta format desimal Excel (18.0)
 */
export function formatNoGardu(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Tangani kemungkinan desimal dari pembacaan float/Excel seperti "18.0"
  str = str.replace(/\.0+$/, '');

  // 1. Angka murni: 18 -> "0018", 1 -> "0001", 138 -> "0138"
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return String(num).padStart(4, '0');
    }
    return str.padStart(4, '0');
  }

  // 2. Awalan teks diikuti angka (contoh: "GD 18" -> "GD 0018", "GD-18" -> "GD-0018")
  const prefixMatch = str.match(/^([A-Za-z\s._/-]+?)(\d+)$/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const num = parseInt(prefixMatch[2], 10);
    return `${prefix}${String(num).padStart(4, '0')}`;
  }

  // 3. Angka diikuti akhiran teks (contoh: "18A" -> "0018A", "18-B" -> "0018-B")
  const suffixMatch = str.match(/^(\d+)([A-Za-z\s._/-]+.*)$/);
  if (suffixMatch) {
    const num = parseInt(suffixMatch[1], 10);
    const suffix = suffixMatch[2];
    return `${String(num).padStart(4, '0')}${suffix}`;
  }

  return str;
}

export function compareNoGardu(a: { noGardu?: string }, b: { noGardu?: string }): number {
  const aVal = formatNoGardu(a.noGardu);
  const bVal = formatNoGardu(b.noGardu);
  return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
}

const INDO_MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, ags: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, nop: 11, nopember: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

/**
 * Ekstraksi komponen tanggal (hari, bulan, tahun) dari berbagai format masukan:
 * - Date object
 * - Excel serial date number (misal 46252)
 * - Format ISO (YYYY-MM-DD)
 * - Format Indonesia / standar (DD/MM/YYYY atau DD-MM-YYYY)
 * - Format US Sheets (M/D/YYYY jika p2 > 12)
 * - Format Teks (misal: 10 Agustus 2026)
 */
export function parseDateParts(
  val: string | number | Date | undefined | null
): { day: number; month: number; year: number } | null {
  if (val === undefined || val === null) return null;

  // 1. Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // Jika jam UTC tepat 00:00 (khas pembacaan cell tanggal tanpa jam di ExcelJS)
    const isUtcMidnight = val.getUTCHours() === 0 && val.getUTCMinutes() === 0;
    return {
      day: isUtcMidnight ? val.getUTCDate() : val.getDate(),
      month: isUtcMidnight ? val.getUTCMonth() + 1 : val.getMonth() + 1,
      year: isUtcMidnight ? val.getUTCFullYear() : val.getFullYear(),
    };
  }

  // 2. Excel Serial Number
  if (typeof val === 'number') {
    if (val > 1000 && val < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = Math.round(val * 86400 * 1000);
      const d = new Date(excelEpoch.getTime() + ms);
      return {
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      };
    }
    return null;
  }

  const str = String(val).trim();
  if (!str) return null;

  // 3. String numeric Excel serial (misal "46252")
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num) && num > 1000 && num < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = Math.round(num * 86400 * 1000);
      const d = new Date(excelEpoch.getTime() + ms);
      return {
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      };
    }
  }

  // 4. Format ISO: YYYY-MM-DD atau YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // 5. Format teks dengan nama bulan (misal "10 Agustus 2026", "10-Agu-2026")
  const textMonthMatch = str.match(/^(\d{1,2})\s*[-/\s]\s*([A-Za-z]+)\s*[-/\s]\s*(\d{2,4})/);
  if (textMonthMatch) {
    const d = parseInt(textMonthMatch[1], 10);
    const mKey = textMonthMatch[2].toLowerCase();
    const m = INDO_MONTHS[mKey] || INDO_MONTHS[mKey.slice(0, 3)];
    let y = parseInt(textMonthMatch[3], 10);
    if (y < 100) y += 2000;
    if (m && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y };
    }
  }

  // 5b. Format teks dengan nama bulan tanpa tahun (misal "10 Agustus", "10-Agu")
  const textMonthNoYearMatch = str.match(/^(\d{1,2})\s*[-/\s]\s*([A-Za-z]+)$/);
  if (textMonthNoYearMatch) {
    const d = parseInt(textMonthNoYearMatch[1], 10);
    const mKey = textMonthNoYearMatch[2].toLowerCase();
    const m = INDO_MONTHS[mKey] || INDO_MONTHS[mKey.slice(0, 3)];
    if (m && d >= 1 && d <= 31) {
      return { day: d, month: m, year: 2026 };
    }
  }

  // 6. Format 3 bagian angka dengan pemisah [/.-]: DD/MM/YYYY atau MM/DD/YYYY
  const partsMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (partsMatch) {
    const p1 = parseInt(partsMatch[1], 10);
    const p2 = parseInt(partsMatch[2], 10);
    let y = parseInt(partsMatch[3], 10);
    if (y < 100) y += 2000;

    let day = p1;
    let month = p2;

    // Jika p2 > 12 dan p1 <= 12: format US M/D/YYYY (contoh: 8/20/2026 -> bln 8, tgl 20)
    if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1;
    } else if (p1 > 12 && p2 <= 12) {
      // Format Indonesia DD/MM/YYYY (contoh: 20/08/2026 -> tgl 20, bln 8)
      day = p1;
      month = p2;
    } else {
      // Kedua angka <= 12 (contoh: 10/08/2026):
      // Sesuai standar Indonesia / PLN, angka pertama adalah TANGGAL (DD) dan kedua adalah BULAN (MM)
      day = p1;
      month = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year: y };
    }
  }

  // 6b. Format 2 bagian angka tanpa tahun (misal "10/08" atau "10-08" atau "20/8")
  const twoPartsMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (twoPartsMatch) {
    const p1 = parseInt(twoPartsMatch[1], 10);
    const p2 = parseInt(twoPartsMatch[2], 10);
    let day = p1;
    let month = p2;
    if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year: 2026 };
    }
  }

  // 7. Fallback parse via Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  }

  return null;
}

/**
 * Format tanggal selalu menjadi DD/MM/YYYY (contoh: 10/08/2026)
 */
export function formatTanggalDDMMYYYY(val: string | number | Date | undefined | null): string {
  if (val === undefined || val === null) return '';
  const parts = parseDateParts(val);
  if (!parts) {
    const s = String(val).trim();
    return s;
  }
  const dd = String(parts.day).padStart(2, '0');
  const mm = String(parts.month).padStart(2, '0');
  const yyyy = String(parts.year).padStart(4, '0');
  return `${dd}/${mm}/${yyyy}`;
}

export function parseDateTimestamp(val: string | number | Date | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const parts = parseDateParts(val);
  if (!parts) return 0;
  return new Date(parts.year, parts.month - 1, parts.day).getTime();
}

export function compareTanggal(a: { tanggal?: string }, b: { tanggal?: string }): number {
  const timeA = parseDateTimestamp(a.tanggal);
  const timeB = parseDateTimestamp(b.tanggal);
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  return (a.tanggal || '').localeCompare(b.tanggal || '');
}

export function compareTanggalAndNoGardu(
  a: RawTrafoRecord,
  b: RawTrafoRecord,
  mode: SortOrderMode = 'TGL_THEN_NOGD'
): number {
  if (mode === 'NOGD_THEN_TGL') {
    const garduDiff = compareNoGardu(a, b);
    if (garduDiff !== 0) return garduDiff;
    return compareTanggal(a, b);
  }
  const tglDiff = compareTanggal(a, b);
  if (tglDiff !== 0) return tglDiff;
  return compareNoGardu(a, b);
}

function minutesToHHmm(totalMinutes: number): string {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHHmmToMinutes(timeStr: string | undefined, defaultMinutes: number): number {
  if (!timeStr) return defaultMinutes;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return defaultMinutes;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return defaultMinutes;
  return ((h * 60 + m) % (24 * 60) + (24 * 60)) % (24 * 60);
}

/**
 * Menghasilkan N waktu dalam format HH:mm yang berurutan secara acak dan menaik (strictly ascending):
 * - Jam pertama selalu startMinutes (misal 10:00 untuk siang, 19:00 untuk malam).
 * - Jam terakhir selalu endMinutes (misal 18:00 untuk siang, 23:00 untuk malam) jika N >= 2.
 * - Jam perantara diacak dengan interval bilangan bulat positif, tidak pernah melebihi endMinutes.
 */
export function generateRandomAscendingTimes(
  count: number,
  startMinutes: number,
  endMinutes: number
): string[] {
  if (count <= 0) return [];
  if (count === 1) return [minutesToHHmm(startMinutes)];
  if (count === 2) return [minutesToHHmm(startMinutes), minutesToHHmm(endMinutes)];

  const totalSpan = Math.max(count - 1, endMinutes - startMinutes);
  const K = count - 1; // jumlah interval perpindahan gardu

  // Tentukan batas interval minimum agar waktu selalu menaik
  const maxPossibleMinGap = Math.max(1, Math.floor(totalSpan / K));
  const minGap = Math.max(1, Math.min(5, maxPossibleMinGap));

  const remaining = totalSpan - K * minGap;

  if (remaining <= 0) {
    const result: number[] = [startMinutes];
    let cur = startMinutes;
    for (let i = 1; i < count - 1; i++) {
      cur += minGap;
      result.push(cur);
    }
    result.push(endMinutes);
    return result.map(minutesToHHmm);
  }

  // Acak K - 1 titik potong dalam rentang [0, remaining]
  const cuts: number[] = [];
  for (let i = 0; i < K - 1; i++) {
    cuts.push(Math.random() * remaining);
  }
  cuts.sort((a, b) => a - b);

  const pieces: number[] = [];
  let prevCut = 0;
  for (let i = 0; i < cuts.length; i++) {
    pieces.push(cuts[i] - prevCut);
    prevCut = cuts[i];
  }
  pieces.push(remaining - prevCut);

  // Bulatkan ke menit bulat dengan metode sisa terbesar agar jumlah persis = remaining
  const integerParts = pieces.map((p) => Math.floor(p));
  const currentSum = integerParts.reduce((acc, val) => acc + val, 0);
  const diff = remaining - currentSum;

  const remainders = pieces.map((p, idx) => ({
    idx,
    rem: p - Math.floor(p),
  }));
  remainders.sort((a, b) => b.rem - a.rem);

  for (let i = 0; i < diff; i++) {
    integerParts[remainders[i % remainders.length].idx]++;
  }

  // Gabungkan minGap dan bagian acak integer
  const intervals = integerParts.map((part) => minGap + part);

  // Susun waktu kumulatif
  const times: number[] = [startMinutes];
  let curTime = startMinutes;
  for (let i = 0; i < intervals.length - 1; i++) {
    curTime += intervals[i];
    times.push(curTime);
  }
  // Jam terakhir selalu persis sama dengan endMinutes
  times.push(endMinutes);

  return times.map(minutesToHHmm);
}

/**
 * Otomatis menghitung jam pengukuran per Feeder & per Tanggal:
 * - Siang: Dimulai dari Jam 10:00 dengan urutan acak menaik hingga Jam Terakhir 18:00.
 * - Malam: Dimulai dari Jam 19:00 dengan urutan acak menaik hingga Jam Terakhir 23:00.
 * Setiap berganti Tanggal, waktu kembali direset mulai dari jam awal hingga jam terakhir.
 */
export function assignAutoSequentialTimes(
  records: RawTrafoRecord[],
  options?: {
    startJamSiang?: string; // Default: '10:00'
    endJamSiang?: string;   // Default: '18:00'
    startJamMalam?: string; // Default: '19:00'
    endJamMalam?: string;   // Default: '23:00'
    sortMode?: SortOrderMode;
  }
): RawTrafoRecord[] {
  const startMinutesSiang = parseHHmmToMinutes(options?.startJamSiang, 10 * 60); // 10:00
  const endMinutesSiang = parseHHmmToMinutes(options?.endJamSiang, 18 * 60);    // 18:00

  const startMinutesMalam = parseHHmmToMinutes(options?.startJamMalam, 19 * 60); // 19:00
  const endMinutesMalam = parseHHmmToMinutes(options?.endJamMalam, 23 * 60);    // 23:00

  const sortMode: SortOrderMode = options?.sortMode || 'TGL_THEN_NOGD';

  // Kelompokkan per Feeder lalu per Tanggal
  const feederGroups = new Map<string, Map<string, RawTrafoRecord[]>>();

  records.forEach((rec) => {
    const fKey = (rec.feeder || 'FEEDER').trim().toUpperCase();
    const tKey = formatTanggalDDMMYYYY(rec.tanggal) || (rec.tanggal || 'TGL').trim();

    if (!feederGroups.has(fKey)) {
      feederGroups.set(fKey, new Map());
    }
    const tMap = feederGroups.get(fKey)!;
    if (!tMap.has(tKey)) {
      tMap.set(tKey, []);
    }
    tMap.get(tKey)!.push(rec);
  });

  const updatedTimesMap = new Map<string, { jamSiang: string; jamMalam: string }>();

  feederGroups.forEach((dateMap) => {
    // Urutkan tanggal secara kronologis
    const sortedDates = Array.from(dateMap.keys()).sort((dA, dB) => {
      return parseDateTimestamp(dA) - parseDateTimestamp(dB);
    });

    sortedDates.forEach((dateKey) => {
      const recsOnDate = dateMap.get(dateKey)!;
      // Urutkan No Gardu pada tanggal tersebut
      recsOnDate.sort((a, b) => compareTanggalAndNoGardu(a, b, sortMode));

      // Hitung urutan jam acak Siang (10:00 s/d 18:00) dan Malam (19:00 s/d 23:00)
      const siangTimes = generateRandomAscendingTimes(
        recsOnDate.length,
        startMinutesSiang,
        endMinutesSiang
      );
      const malamTimes = generateRandomAscendingTimes(
        recsOnDate.length,
        startMinutesMalam,
        endMinutesMalam
      );

      recsOnDate.forEach((rec, idx) => {
        updatedTimesMap.set(rec.id, {
          jamSiang: siangTimes[idx] || minutesToHHmm(startMinutesSiang),
          jamMalam: malamTimes[idx] || minutesToHHmm(startMinutesMalam),
        });
      });
    });
  });

  return records.map((rec) => {
    const assigned = updatedTimesMap.get(rec.id);
    if (assigned) {
      return {
        ...rec,
        jamSiang: assigned.jamSiang,
        jamMalam: assigned.jamMalam,
      };
    }
    return rec;
  });
}
