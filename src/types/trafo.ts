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
}

export type SortOrderMode = 'TGL_THEN_NOGD' | 'NOGD_THEN_TGL';

export function formatUlpName(unitDesc: string | undefined): string {
  const trimmed = (unitDesc || '').trim();
  if (!trimmed) return 'ULP BUKITTINGGI';
  if (trimmed.toUpperCase().startsWith('ULP')) {
    return trimmed.toUpperCase();
  }
  return `ULP ${trimmed.toUpperCase()}`;
}

export function compareNoGardu(a: { noGardu?: string }, b: { noGardu?: string }): number {
  const aVal = (a.noGardu || '').trim();
  const bVal = (b.noGardu || '').trim();
  return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
}

export function parseDateTimestamp(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') {
    if (val > 30000 && val < 60000) {
      // Excel serial date to epoch
      return (val - 25569) * 86400 * 1000;
    }
    return val;
  }
  const str = String(val).trim();
  if (!str) return 0;

  // Format: YYYY-MM-DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
    const parts = str.split(/[-/.]/);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }

  // Format: M/D/YYYY or D/M/YYYY
  const slashParts = str.split(/[-/.]/);
  if (slashParts.length >= 3) {
    const p1 = parseInt(slashParts[0], 10);
    const p2 = parseInt(slashParts[1], 10);
    let p3 = parseInt(slashParts[2], 10);
    if (p3 < 100) p3 += 2000;

    // If p1 > 12, p1 is definitely day (DD/MM/YYYY)
    if (p1 > 12) {
      return new Date(p3, p2 - 1, p1).getTime();
    }
    // If p2 > 12, p2 is definitely day (MM/DD/YYYY)
    if (p2 > 12) {
      return new Date(p3, p1 - 1, p2).getTime();
    }
    // Default US style MM/DD/YYYY as commonly exported by Excel/Google Sheets
    return new Date(p3, p1 - 1, p2).getTime();
  }

  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
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
    const tKey = (rec.tanggal || 'TGL').trim();

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
