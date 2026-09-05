import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import {
  RawTrafoRecord,
  compareTanggalAndNoGardu,
  assignAutoSequentialTimes,
} from '../types/trafo';

// Normalize No Gardu for robust matching (e.g. "0180", "180", " 0180 ")
export function normalizeGarduKey(noGardu: string | number | undefined): string {
  if (noGardu === undefined || noGardu === null) return '';
  const str = String(noGardu).trim().toUpperCase();
  // Remove leading zeroes for comparison if numeric, but preserve non-digit suffixes
  const numericMatch = str.match(/^0*([1-9][0-9]*.*)$/);
  return numericMatch ? numericMatch[1] : str;
}

// Helper to extract values from row object with various key spellings
export function extractRowValue(row: Record<string, any>, ...candidateKeys: string[]): string {
  for (const key of candidateKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      const val = String(row[key]).trim();
      if (val !== '') return val;
    }
  }
  // Case-insensitive lookup fallback
  const rowKeys = Object.keys(row);
  for (const cand of candidateKeys) {
    const candLower = cand.toLowerCase().replace(/[\s_.-]/g, '');
    for (const rk of rowKeys) {
      if (rk.toLowerCase().replace(/[\s_.-]/g, '') === candLower) {
        const val = String(row[rk]).trim();
        if (val !== '') return val;
      }
    }
  }
  return '';
}

// Parse raw row data into a Trafo record
export function parseRawRow(
  row: Record<string, any>,
  index: number,
  targetType: 'MALAM' | 'SIANG'
): RawTrafoRecord {
  const get = (...keys: string[]) => extractRowValue(row, ...keys);

  const baseData = {
    id: `row-${targetType.toLowerCase()}-${index + 1}-${Date.now()}`,
    tanggal: get('TANGGAL', 'Tanggal', 'tgl', 'DATE'),
    unit: get('Unit Description', 'UNIT DESCRIPTION', 'UNIT_DESCRIPTION', 'Unit_Description', 'UNIT', 'Unit', 'LOKASI', 'Lokasi', 'ULP', 'ulp'),
    feeder: get('Description Penyulang', 'PENYULANG', 'Penyulang', 'Feeder', 'DESCRIPTION PENYULANG'),
    noGardu: get('NO. GARDU', 'No Gardu', 'NO GARDU', 'No. Gardu', 'NO_GARDU', 'NO GD'),
    kvaGardu: get('KVA GARDU', 'KVA', 'Daya Trafo', 'KVA_GARDU', 'DAYA'),
    rateNhFuse: get('RATE NH FUSE', 'NH FUSE', 'RATE_NH_FUSE', 'FUSE'),
    temuanTier1: get('TEMUAN TIER 1', 'Temuan Tier 1', 'TEMUAN TIER 1 DAN TIER 1&'),
    temuanTier2: get('TEMUAN TIER 1&2', 'Temuan Tier 2', 'TEMUAN TIER 2'),
    keterangan: get('KETERANGAN', 'Keterangan', 'KET', 'Catatan'),
    jamMalam: get('JAM MALAM', 'Jam Malam', 'JAM_MALAM') || '19:00',
    jamSiang: get('JAM SIANG', 'Jam Siang', 'JAM_SIANG') || '11:00',
    kategoriWaktu: targetType,
  };

  const rInd = get('R INDUK', 'R_INDUK', 'R Induk', 'R IND');
  const sInd = get('S INDUK', 'S_INDUK', 'S Induk', 'S IND');
  const tInd = get('T INDUK', 'T_INDUK', 'T Induk', 'T IND');
  const nInd = get('N INDUK', 'N_INDUK', 'N Induk', 'N IND');

  const rsVal = get('RS', 'R-S', 'r-s');
  const rtVal = get('RT', 'R-T', 'r-t', 'TR', 'T-R');
  const stVal = get('ST', 'S-T', 's-t');
  const rnVal = get('RN', 'R-N', 'r-n');
  const snVal = get('SN', 'S-N', 's-n');
  const tnVal = get('TN', 'T-N', 't-n');

  const r1Val = get('R 1', 'R1', 'r1', 'R_1');
  const s1Val = get('S 1', 'S1', 's1', 'S_1');
  const t1Val = get('T 1', 'T1', 't1', 'T_1');
  const n1Val = get('N 1', 'N1', 'n1', 'N_1');

  const r2Val = get('R 2', 'R2', 'r2', 'R_2');
  const s2Val = get('S 2', 'S2', 's2', 'S_2');
  const t2Val = get('T 2', 'T2', 't2', 'T_2');
  const n2Val = get('N 2', 'N2', 'n2', 'N_2');

  const r3Val = get('R 3', 'R3', 'r3', 'R_3');
  const s3Val = get('S 3', 'S3', 's3', 'S_3');
  const t3Val = get('T 3', 'T3', 't3', 'T_3');
  const n3Val = get('N 3', 'N3', 'n3', 'N_3');

  const r4Val = get('R 4', 'R4', 'r4', 'R_4');
  const s4Val = get('S 4', 'S4', 's4', 'S_4');
  const t4Val = get('T 4', 'T4', 't4', 'T_4');
  const n4Val = get('N 4', 'N4', 'n4', 'N_4');

  if (targetType === 'MALAM') {
    return {
      ...baseData,
      rInduk: rInd,
      sInduk: sInd,
      tInduk: tInd,
      nInduk: nInd,
      rs: rsVal,
      rt: rtVal,
      st: stVal,
      rn: rnVal,
      sn: snVal,
      tn: tnVal,
      r1: r1Val,
      s1: s1Val,
      t1: t1Val,
      n1: n1Val,
      r2: r2Val,
      s2: s2Val,
      t2: t2Val,
      n2: n2Val,
      r3: r3Val,
      s3: s3Val,
      t3: t3Val,
      n3: n3Val,
      r4: r4Val,
      s4: s4Val,
      t4: t4Val,
      n4: n4Val,
    };
  } else {
    // SIANG
    return {
      ...baseData,
      // Default blank for malam fields
      rInduk: '',
      sInduk: '',
      tInduk: '',
      nInduk: '',
      rs: '',
      rt: '',
      st: '',
      rn: '',
      sn: '',
      tn: '',
      r1: '',
      s1: '',
      t1: '',
      n1: '',
      r2: '',
      s2: '',
      t2: '',
      n2: '',
      r3: '',
      s3: '',
      t3: '',
      n3: '',
      r4: '',
      s4: '',
      t4: '',
      n4: '',
      // Populate siang measurements
      siangRInduk: rInd,
      siangSInduk: sInd,
      siangTInduk: tInd,
      siangNInduk: nInd,
      siangRs: rsVal,
      siangRt: rtVal,
      siangSt: stVal,
      siangRn: rnVal,
      siangSn: snVal,
      siangTn: tnVal,
      siangR1: r1Val,
      siangS1: s1Val,
      siangT1: t1Val,
      siangN1: n1Val,
      siangR2: r2Val,
      siangS2: s2Val,
      siangT2: t2Val,
      siangN2: n2Val,
      siangR3: r3Val,
      siangS3: s3Val,
      siangT3: t3Val,
      siangN3: n3Val,
      siangR4: r4Val,
      siangS4: s4Val,
      siangT4: t4Val,
      siangN4: n4Val,
    };
  }
}

// Parse CSV text with target designation
export function parseCSVWithRole(csvText: string, targetType: 'MALAM' | 'SIANG'): RawTrafoRecord[] {
  const parsed = Papa.parse(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  return (parsed.data as Record<string, string>[])
    .filter((row) => {
      // Must have some identifier
      return Boolean(
        row['NO. GARDU'] ||
        row['No Gardu'] ||
        row['NO GARDU'] ||
        row['NO_GARDU'] ||
        row['KVA GARDU'] ||
        row['R INDUK']
      );
    })
    .map((row, idx) => parseRawRow(row, idx, targetType));
}

// Merge Malam records (from BEBAN PUNCAK GARDU) and Siang records (from TEMUAN GARDU TIER 1 DAN TIER 1&)
export function mergeTrafoSheets(
  malamRecords: RawTrafoRecord[],
  siangRecords: RawTrafoRecord[]
): RawTrafoRecord[] {
  // If only one list exists, return it
  if (malamRecords.length === 0 && siangRecords.length === 0) return [];
  if (siangRecords.length === 0) return malamRecords;
  if (malamRecords.length === 0) return siangRecords;

  const siangMap = new Map<string, RawTrafoRecord>();
  siangRecords.forEach((rec) => {
    const key = normalizeGarduKey(rec.noGardu);
    if (key) {
      siangMap.set(key, rec);
    }
  });

  const mergedList: RawTrafoRecord[] = [];
  const processedSiangKeys = new Set<string>();

  // Loop through malam records and merge matching siang data
  malamRecords.forEach((mRec) => {
    const key = normalizeGarduKey(mRec.noGardu);
    const sRec = key ? siangMap.get(key) : undefined;

    if (sRec) {
      processedSiangKeys.add(key);
      mergedList.push({
        ...mRec,
        // Siang readings
        siangRInduk: sRec.siangRInduk ?? sRec.rInduk,
        siangSInduk: sRec.siangSInduk ?? sRec.sInduk,
        siangTInduk: sRec.siangTInduk ?? sRec.tInduk,
        siangNInduk: sRec.siangNInduk ?? sRec.nInduk,
        siangRs: sRec.siangRs ?? sRec.rs,
        siangRt: sRec.siangRt ?? sRec.rt,
        siangSt: sRec.siangSt ?? sRec.st,
        siangRn: sRec.siangRn ?? sRec.rn,
        siangSn: sRec.siangSn ?? sRec.sn,
        siangTn: sRec.siangTn ?? sRec.tn,
        siangR1: sRec.siangR1 ?? sRec.r1,
        siangS1: sRec.siangS1 ?? sRec.s1,
        siangT1: sRec.siangT1 ?? sRec.t1,
        siangN1: sRec.siangN1 ?? sRec.n1,
        siangR2: sRec.siangR2 ?? sRec.r2,
        siangS2: sRec.siangS2 ?? sRec.s2,
        siangT2: sRec.siangT2 ?? sRec.t2,
        siangN2: sRec.siangN2 ?? sRec.n2,
        siangR3: sRec.siangR3 ?? sRec.r3,
        siangS3: sRec.siangS3 ?? sRec.s3,
        siangT3: sRec.siangT3 ?? sRec.t3,
        siangN3: sRec.siangN3 ?? sRec.n3,
        siangR4: sRec.siangR4 ?? sRec.r4,
        siangS4: sRec.siangS4 ?? sRec.s4,
        siangT4: sRec.siangT4 ?? sRec.t4,
        siangN4: sRec.siangN4 ?? sRec.n4,
        // Also capture temuan from Tier 1 sheet if available
        temuanTier1: sRec.temuanTier1 || mRec.temuanTier1,
        temuanTier2: sRec.temuanTier2 || mRec.temuanTier2,
        keterangan: sRec.keterangan || mRec.keterangan,
        jamSiang: sRec.jamSiang || mRec.jamSiang || '11:00',
        kategoriWaktu: 'KEDUANYA',
        sourceSheets: ['BEBAN PUNCAK GARDU', 'TEMUAN GARDU TIER 1 DAN TIER 1&'],
      });
    } else {
      mergedList.push({
        ...mRec,
        kategoriWaktu: 'MALAM',
        sourceSheets: ['BEBAN PUNCAK GARDU'],
      });
    }
  });

  // Any remaining records in siang that were not in malam
  siangRecords.forEach((sRec) => {
    const key = normalizeGarduKey(sRec.noGardu);
    if (key && !processedSiangKeys.has(key)) {
      mergedList.push({
        ...sRec,
        kategoriWaktu: 'SIANG',
        sourceSheets: ['TEMUAN GARDU TIER 1 DAN TIER 1&'],
      });
    }
  });

  // Urutkan per TGL/BLN dan No. GD (A - Z)
  mergedList.sort((a, b) => compareTanggalAndNoGardu(a, b, 'TGL_THEN_NOGD'));

  // Otomatis hitung jam Siang (10:00 s/d 18:00) dan Malam (19:00 s/d 23:00) secara urut acak per Tanggal
  return assignAutoSequentialTimes(mergedList, {
    startJamSiang: '10:00',
    endJamSiang: '18:00',
    startJamMalam: '19:00',
    endJamMalam: '23:00',
    sortMode: 'TGL_THEN_NOGD',
  });
}

// Fetch Google Spreadsheet sheet by name
async function fetchSheetCsvByName(sheetId: string, sheetName: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const text = await resp.text();
    // Validate if it's actual CSV and not HTML error page
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

// Main Google Spreadsheet fetcher supporting BEBAN PUNCAK GARDU & TEMUAN GARDU TIER 1 DAN TIER 1&
export async function loadGoogleSpreadsheetDual(sheetId: string): Promise<{
  records: RawTrafoRecord[];
  summaryMessage: string;
}> {
  // Target 1: Sheet Malam (BEBAN PUNCAK GARDU)
  const malamSheetNames = [
    'BEBAN PUNCAK GARDU',
    'BEBAN PUNCAK',
    'Beban Puncak Gardu',
    'Sheet1',
  ];

  // Target 2: Sheet Siang (TEMUAN GARDU TIER 1 DAN TIER 1& or variations)
  const siangSheetNames = [
    'TEMUAN GARDU TIER 1 DAN TIER 1&',
    'TEMUAN GARDU TIER 1 DAN TIER 1&2',
    'TEMUAN GARDU TIER 1 & 2',
    'TEMUAN GARDU',
    'SIANG',
    'PENGUKURAN SIANG',
  ];

  let malamCsv: string | null = null;
  let usedMalamName = '';
  for (const sName of malamSheetNames) {
    const csv = await fetchSheetCsvByName(sheetId, sName);
    if (csv && csv.length > 50) {
      malamCsv = csv;
      usedMalamName = sName;
      break;
    }
  }

  let siangCsv: string | null = null;
  let usedSiangName = '';
  for (const sName of siangSheetNames) {
    const csv = await fetchSheetCsvByName(sheetId, sName);
    if (csv && csv.length > 50) {
      siangCsv = csv;
      usedSiangName = sName;
      break;
    }
  }

  // Fallback to default export if neither named sheet worked
  if (!malamCsv && !siangCsv) {
    const fallbackUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const resp = await fetch(fallbackUrl);
    if (!resp.ok) {
      throw new Error(
        `Gagal mengakses Google Sheets (Status: ${resp.status}). Pastikan Spreadsheet berstatus publik ("Anyone with the link can view").`
      );
    }
    const text = await resp.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      throw new Error(
        'Spreadsheet memerlukan login atau izin akses. Ubah izin menjadi "Anyone with the link can view".'
      );
    }
    const singleRecords = parseCSVWithRole(text, 'MALAM');
    if (singleRecords.length === 0) {
      throw new Error('Tidak ada baris data pengukuran gardu yang valid ditemukan.');
    }
    const sorted = singleRecords.sort((a, b) => compareTanggalAndNoGardu(a, b, 'TGL_THEN_NOGD'));
    const finalRecords = assignAutoSequentialTimes(sorted, {
      startJamSiang: '10:00',
      endJamSiang: '18:00',
      startJamMalam: '19:00',
      endJamMalam: '23:00',
      sortMode: 'TGL_THEN_NOGD',
    });
    return {
      records: finalRecords,
      summaryMessage: `Berhasil memuat ${finalRecords.length} data gardu dari Google Sheet utama.`,
    };
  }

  const malamRecords = malamCsv ? parseCSVWithRole(malamCsv, 'MALAM') : [];
  const siangRecords = siangCsv ? parseCSVWithRole(siangCsv, 'SIANG') : [];

  const merged = mergeTrafoSheets(malamRecords, siangRecords);

  let summary = `Berhasil memuat ${merged.length} gardu:`;
  if (malamRecords.length > 0) {
    summary += ` [Malam: ${usedMalamName} (${malamRecords.length})]`;
  }
  if (siangRecords.length > 0) {
    summary += ` [Siang: ${usedSiangName} (${siangRecords.length})]`;
  }

  return {
    records: merged,
    summaryMessage: summary,
  };
}

// Parse uploaded Excel workbook (.xlsx / .xls) with multiple sheets
export async function parseExcelWorkbook(file: File): Promise<{
  records: RawTrafoRecord[];
  summaryMessage: string;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  let malamWorksheet: ExcelJS.Worksheet | undefined;
  let siangWorksheet: ExcelJS.Worksheet | undefined;

  workbook.eachSheet((ws) => {
    const name = ws.name.toUpperCase().trim();
    if (name.includes('BEBAN PUNCAK') || name === 'MALAM' || name.includes('BEBAN_PUNCAK')) {
      malamWorksheet = ws;
    } else if (name.includes('TEMUAN') || name.includes('TIER 1') || name === 'SIANG') {
      siangWorksheet = ws;
    }
  });

  // If not matched by exact name, use first sheet as malam, second sheet as siang if available
  if (!malamWorksheet && workbook.worksheets.length > 0) {
    malamWorksheet = workbook.worksheets[0];
    if (workbook.worksheets.length > 1) {
      siangWorksheet = workbook.worksheets[1];
    }
  }

  const extractWorksheetData = (ws: ExcelJS.Worksheet, role: 'MALAM' | 'SIANG'): RawTrafoRecord[] => {
    // Find header row (row containing "NO. GARDU" or "KVA" or "INDUK")
    let headerRowIdx = 1;
    let headers: string[] = [];

    for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
      const row = ws.getRow(r);
      const values = row.values as any[];
      if (Array.isArray(values)) {
        const rowStr = values.map((v) => String(v || '')).join(' ').toUpperCase();
        if (rowStr.includes('GARDU') || rowStr.includes('KVA') || rowStr.includes('INDUK')) {
          headerRowIdx = r;
          headers = values.map((v) => String(v || '').trim());
          break;
        }
      }
    }

    const recs: RawTrafoRecord[] = [];
    for (let r = headerRowIdx + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const values = row.values as any[];
      if (!Array.isArray(values) || values.length <= 1) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        if (h && values[idx] !== undefined) {
          rowObj[h] = values[idx];
        }
      });

      // Also attach column indices as fallback keys
      values.forEach((val, idx) => {
        if (val !== undefined && val !== null) {
          rowObj[`col_${idx}`] = val;
        }
      });

      const parsed = parseRawRow(rowObj, recs.length, role);
      if (parsed.noGardu || parsed.kvaGardu || parsed.rInduk || parsed.siangRInduk) {
        recs.push(parsed);
      }
    }
    return recs;
  };

  const malamRecords = malamWorksheet ? extractWorksheetData(malamWorksheet, 'MALAM') : [];
  const siangRecords = siangWorksheet ? extractWorksheetData(siangWorksheet, 'SIANG') : [];

  const merged = mergeTrafoSheets(malamRecords, siangRecords);

  return {
    records: merged,
    summaryMessage: `Berhasil mengimpor file Excel: ${merged.length} gardu (${malamWorksheet ? malamWorksheet.name : 'Sheet 1'}${siangWorksheet ? ` + ${siangWorksheet.name}` : ''})`,
  };
}
