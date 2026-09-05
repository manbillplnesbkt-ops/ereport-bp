import ExcelJS from 'exceljs';
import {
  RawTrafoRecord,
  ReportConfig,
  formatUlpName,
  compareTanggalAndNoGardu,
  assignAutoSequentialTimes,
} from '../types/trafo';

// Helper to sanitize and deduplicate Excel worksheet names
function sanitizeSheetName(name: string, usedNames: Set<string>): string {
  // Excel worksheet names: max 31 chars, cannot contain: \ / ? * [ ] :
  let clean = (name || 'Feeder')
    .replace(/[\\/?*[\]:]/g, '_')
    .trim();
  if (!clean) clean = 'Feeder';
  if (clean.length > 31) clean = clean.substring(0, 31).trim();

  let candidate = clean;
  let counter = 2;
  while (usedNames.has(candidate.toUpperCase())) {
    const suffix = ` (${counter})`;
    const maxBase = 31 - suffix.length;
    candidate = `${clean.substring(0, maxBase)}${suffix}`;
    counter++;
  }
  usedNames.add(candidate.toUpperCase());
  return candidate;
}

// Helper to format numbers cleanly
const toNum = (val: string | number | undefined): number | string => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? val : num;
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

const headerFill: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E1F2' }, // Soft blue from PLN standard
};

const feederBarFill: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E2E2' }, // Light gray bar
};

// Builds a complete PLN standard worksheet for a given feeder
function populateFeederWorksheet(
  ws: ExcelJS.Worksheet,
  feederName: string,
  recs: RawTrafoRecord[],
  config: ReportConfig,
  ulpTitle: string
) {
  // Column definitions (29 columns A to AC)
  ws.columns = [
    { key: 'colA', width: 6 },   // 1 NO.
    { key: 'colB', width: 10 },  // 2 No GD
    { key: 'colC', width: 22 },  // 3 LOKASI
    { key: 'colD', width: 12 },  // 4 DAYA TRAFO (kVA)
    { key: 'colE', width: 14 },  // 5 TGL / BLN
    { key: 'colF', width: 9 },   // 6 JAM Siang
    { key: 'colG', width: 7 },   // 7 Jur. Siang
    { key: 'colH', width: 8 },   // 8 R Siang
    { key: 'colI', width: 8 },   // 9 S Siang
    { key: 'colJ', width: 8 },   // 10 T Siang
    { key: 'colK', width: 8 },   // 11 N Siang
    { key: 'colL', width: 8 },   // 12 R-S Siang
    { key: 'colM', width: 8 },   // 13 S-T Siang
    { key: 'colN', width: 8 },   // 14 T-R Siang
    { key: 'colO', width: 8 },   // 15 R-N Siang
    { key: 'colP', width: 8 },   // 16 S-N Siang
    { key: 'colQ', width: 8 },   // 17 T-N Siang
    { key: 'colR', width: 9 },   // 18 JAM Malam
    { key: 'colS', width: 7 },   // 19 Jur. Malam
    { key: 'colT', width: 8 },   // 20 R Malam
    { key: 'colU', width: 8 },   // 21 S Malam
    { key: 'colV', width: 8 },   // 22 T Malam
    { key: 'colW', width: 8 },   // 23 N Malam
    { key: 'colX', width: 8 },   // 24 R-S Malam
    { key: 'colY', width: 8 },   // 25 S-T Malam
    { key: 'colZ', width: 8 },   // 26 T-R Malam
    { key: 'colAA', width: 8 },  // 27 R-N Malam
    { key: 'colAB', width: 8 },  // 28 S-N Malam
    { key: 'colAC', width: 8 },  // 29 T-N Malam
  ];

  // Title rows
  let curRow = 1;

  // 1. Judul Laporan
  ws.mergeCells(curRow, 1, curRow, 29);
  const titleCell = ws.getCell(curRow, 1);
  titleCell.value = config.judul || 'HASIL PENGUKURAN BEBAN DAN TEGANGAN (PUNCAK) TRAFO DISTRIBUSI';
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(curRow).height = 24;
  curRow++;

  // 2. Bulan & Tahun
  ws.mergeCells(curRow, 1, curRow, 29);
  const bulanCell = ws.getCell(curRow, 1);
  bulanCell.value = config.bulanTahun || 'BULAN AGUSTUS 2026';
  bulanCell.font = { name: 'Arial', size: 11, bold: true };
  bulanCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(curRow).height = 20;
  curRow++;

  // 3. ULP (Diambil dari Spreadsheet kolom Unit Description)
  ws.mergeCells(curRow, 1, curRow, 29);
  const ulpCell = ws.getCell(curRow, 1);
  ulpCell.value = ulpTitle;
  ulpCell.font = { name: 'Arial', size: 11, bold: true };
  ulpCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(curRow).height = 20;
  curRow++;

  // Empty spacer
  curRow++;

  // Table Headers (3 rows)
  const hRow1 = curRow;
  const hRow2 = curRow + 1;
  const hRow3 = curRow + 2;

  // Set header row heights
  ws.getRow(hRow1).height = 22;
  ws.getRow(hRow2).height = 20;
  ws.getRow(hRow3).height = 20;

  // Col 1: NO. (Rows 1-3 merged)
  ws.mergeCells(hRow1, 1, hRow3, 1);
  const cellNo = ws.getCell(hRow1, 1);
  cellNo.value = 'NO.';

  // Col 2-3: PHBTR
  ws.mergeCells(hRow1, 2, hRow1, 3);
  ws.getCell(hRow1, 2).value = 'PHBTR';
  ws.mergeCells(hRow2, 2, hRow3, 2);
  ws.getCell(hRow2, 2).value = 'No GD';
  ws.mergeCells(hRow2, 3, hRow3, 3);
  ws.getCell(hRow2, 3).value = 'LOKASI';

  // Col 4: DAYA TRAFO (kVA)
  ws.mergeCells(hRow1, 4, hRow3, 4);
  ws.getCell(hRow1, 4).value = 'DAYA\nTRAFO\n(kVA)';

  // Col 5-6: WAKTU PENGUKURAN
  ws.mergeCells(hRow1, 5, hRow1, 6);
  ws.getCell(hRow1, 5).value = 'WAKTU PENGUKURAN';
  ws.mergeCells(hRow2, 5, hRow3, 5);
  ws.getCell(hRow2, 5).value = 'TGL\nBLN';
  ws.mergeCells(hRow2, 6, hRow3, 6);
  ws.getCell(hRow2, 6).value = 'J A M';

  // Col 7: Jur. Siang
  ws.mergeCells(hRow1, 7, hRow3, 7);
  ws.getCell(hRow1, 7).value = 'Jur.';

  // Col 8-17: HASIL PENGUKURAN BEBAN DAN TEGANGAN SIANG
  ws.mergeCells(hRow1, 8, hRow1, 17);
  ws.getCell(hRow1, 8).value = 'HASIL PENGUKURAN BEBAN DAN TEGANGAN SIANG';

  // Siang: BEBAN ( A ) Col 8-11
  ws.mergeCells(hRow2, 8, hRow2, 11);
  ws.getCell(hRow2, 8).value = 'BEBAN ( A )';
  ws.getCell(hRow3, 8).value = 'R';
  ws.getCell(hRow3, 9).value = 'S';
  ws.getCell(hRow3, 10).value = 'T';
  ws.getCell(hRow3, 11).value = 'N';

  // Siang: TEGANGAN ( VOLT ) Col 12-17
  ws.mergeCells(hRow2, 12, hRow2, 17);
  ws.getCell(hRow2, 12).value = 'TEGANGAN ( VOLT )';
  ws.getCell(hRow3, 12).value = 'R - S';
  ws.getCell(hRow3, 13).value = 'S - T';
  ws.getCell(hRow3, 14).value = 'T - R';
  ws.getCell(hRow3, 15).value = 'R - N';
  ws.getCell(hRow3, 16).value = 'S - N';
  ws.getCell(hRow3, 17).value = 'T - N';

  // Col 18: JAM Malam
  ws.mergeCells(hRow1, 18, hRow3, 18);
  ws.getCell(hRow1, 18).value = 'J A M';

  // Col 19: Jur. Malam
  ws.mergeCells(hRow1, 19, hRow3, 19);
  ws.getCell(hRow1, 19).value = 'Jur.';

  // Col 20-29: HASIL PENGUKURAN BEBAN DAN TEGANGAN MALAM
  ws.mergeCells(hRow1, 20, hRow1, 29);
  ws.getCell(hRow1, 20).value = 'HASIL PENGUKURAN BEBAN DAN TEGANGAN MALAM';

  // Malam: BEBAN ( A ) Col 20-23
  ws.mergeCells(hRow2, 20, hRow2, 23);
  ws.getCell(hRow2, 20).value = 'BEBAN ( A )';
  ws.getCell(hRow3, 20).value = 'R';
  ws.getCell(hRow3, 21).value = 'S';
  ws.getCell(hRow3, 22).value = 'T';
  ws.getCell(hRow3, 23).value = 'N';

  // Malam: TEGANGAN ( VOLT ) Col 24-29
  ws.mergeCells(hRow2, 24, hRow2, 29);
  ws.getCell(hRow2, 24).value = 'TEGANGAN ( VOLT )';
  ws.getCell(hRow3, 24).value = 'R - S';
  ws.getCell(hRow3, 25).value = 'S - T';
  ws.getCell(hRow3, 26).value = 'T - R';
  ws.getCell(hRow3, 27).value = 'R - N';
  ws.getCell(hRow3, 28).value = 'S - N';
  ws.getCell(hRow3, 29).value = 'T - N';

  // Style header cells
  for (let r = hRow1; r <= hRow3; r++) {
    for (let c = 1; c <= 29; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = thinBorder;

      // Color highlight for siang & malam headers
      if (c >= 8 && c <= 17) {
        cell.fill = headerFill;
      } else if (c >= 20 && c <= 29) {
        cell.fill = headerFill;
      }
    }
  }

  curRow = hRow3 + 1;

  // Insert Feeder Divider Bar
  ws.mergeCells(curRow, 1, curRow, 29);
  const feederCell = ws.getCell(curRow, 1);
  feederCell.value = `FEEDER  ${feederName}`;
  feederCell.font = { name: 'Arial', size: 10, bold: true, italic: true };
  feederCell.alignment = { horizontal: 'center', vertical: 'middle' };
  feederCell.fill = feederBarFill;
  feederCell.border = thinBorder;
  ws.getRow(curRow).height = 20;
  curRow++;

  // Urutkan Per No. GD dari kecil ke besar ( A - Z ) dan TGL/BLN
  const sortMode = config.sortMode || 'TGL_THEN_NOGD';
  let sortedRecs = [...recs].sort((a, b) => compareTanggalAndNoGardu(a, b, sortMode));
  if (sortedRecs.some((r) => !r.jamSiang || !r.jamMalam)) {
    sortedRecs = assignAutoSequentialTimes(sortedRecs, {
      startJamSiang: config.defaultJamSiang || '10:00',
      endJamSiang: config.jamAkhirSiang || '18:00',
      startJamMalam: config.defaultJamMalam || '19:00',
      endJamMalam: config.jamAkhirMalam || '23:00',
      sortMode,
    });
  }

  // Numbering starts from 1 for each Feeder sheet
  let sheetIndex = 1;

  for (const rec of sortedRecs) {
    const hasJur4 = Boolean(
      rec.r4 || rec.s4 || rec.t4 || rec.n4 ||
      rec.siangR4 || rec.siangS4 || rec.siangT4 || rec.siangN4
    );

    // Total rows: REL, I, II, III (= 4 rows) or 5 if Jurusan IV exists
    const totalJurRows = hasJur4 ? 5 : 4;

    const startRow = curRow;
    const endRow = curRow + totalJurRows - 1;

    // Fill common Gardu Info on REL row, and merge vertically across startRow to endRow
    // 1. NO. (Restarted per sheet)
    ws.mergeCells(startRow, 1, endRow, 1);
    const noC = ws.getCell(startRow, 1);
    noC.value = sheetIndex++;
    noC.font = { name: 'Arial', size: 9, bold: true };
    noC.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. No GD (Sorted A - Z)
    ws.mergeCells(startRow, 2, endRow, 2);
    const gdC = ws.getCell(startRow, 2);
    gdC.value = rec.noGardu;
    gdC.font = { name: 'Arial', size: 9, bold: true };
    gdC.alignment = { horizontal: 'center', vertical: 'middle' };

    // 3. LOKASI (dari Spreadsheet kolom Unit Description)
    ws.mergeCells(startRow, 3, endRow, 3);
    const locC = ws.getCell(startRow, 3);
    locC.value = rec.unit;
    locC.font = { name: 'Arial', size: 9 };
    locC.alignment = { horizontal: 'left', vertical: 'middle' };

    // 4. DAYA TRAFO (kVA)
    ws.mergeCells(startRow, 4, endRow, 4);
    const dayaC = ws.getCell(startRow, 4);
    dayaC.value = toNum(rec.kvaGardu);
    dayaC.font = { name: 'Arial', size: 9 };
    dayaC.alignment = { horizontal: 'center', vertical: 'middle' };

    // 5. TGL / BLN
    ws.mergeCells(startRow, 5, endRow, 5);
    const tglC = ws.getCell(startRow, 5);
    tglC.value = rec.tanggal;
    tglC.font = { name: 'Arial', size: 9 };
    tglC.alignment = { horizontal: 'center', vertical: 'middle' };

    // 6. JAM Siang
    ws.mergeCells(startRow, 6, endRow, 6);
    const jamSC = ws.getCell(startRow, 6);
    jamSC.value = rec.jamSiang || config.defaultJamSiang || '10:00';
    jamSC.font = { name: 'Arial', size: 9 };
    jamSC.alignment = { horizontal: 'center', vertical: 'middle' };

    // 18. JAM Malam
    ws.mergeCells(startRow, 18, endRow, 18);
    const jamMC = ws.getCell(startRow, 18);
    jamMC.value = rec.jamMalam || config.defaultJamMalam || '19:00';
    jamMC.font = { name: 'Arial', size: 9 };
    jamMC.alignment = { horizontal: 'center', vertical: 'middle' };

    // Jurusan definitions: REL, I, II, III, (+ IV if exists)
    // Siang data from Sheet TEMUAN GARDU TIER 1 DAN TIER 1&
    // Malam data from Sheet BEBAN PUNCAK GARDU
    const jurusanData = [
      {
        name: 'REL',
        bebanSiang: [
          rec.siangRInduk ?? '',
          rec.siangSInduk ?? '',
          rec.siangTInduk ?? '',
          rec.siangNInduk ?? '',
        ],
        voltSiang: [
          rec.siangRs ?? '',
          rec.siangRt ?? '',
          rec.siangSt ?? '',
          rec.siangRn ?? '',
          rec.siangSn ?? '',
          rec.siangTn ?? '',
        ],
        bebanMalam: [rec.rInduk, rec.sInduk, rec.tInduk, rec.nInduk],
        voltMalam: [rec.rs, rec.rt, rec.st, rec.rn, rec.sn, rec.tn],
      },
      {
        name: 'I',
        bebanSiang: [
          rec.siangR1 ?? '',
          rec.siangS1 ?? '',
          rec.siangT1 ?? '',
          rec.siangN1 ?? '',
        ],
        voltSiang: ['', '', '', '', '', ''],
        bebanMalam: [rec.r1, rec.s1, rec.t1, rec.n1],
        voltMalam: ['', '', '', '', '', ''],
      },
      {
        name: 'II',
        bebanSiang: [
          rec.siangR2 ?? '',
          rec.siangS2 ?? '',
          rec.siangT2 ?? '',
          rec.siangN2 ?? '',
        ],
        voltSiang: ['', '', '', '', '', ''],
        bebanMalam: [rec.r2, rec.s2, rec.t2, rec.n2],
        voltMalam: ['', '', '', '', '', ''],
      },
      {
        name: 'III',
        bebanSiang: [
          rec.siangR3 ?? '',
          rec.siangS3 ?? '',
          rec.siangT3 ?? '',
          rec.siangN3 ?? '',
        ],
        voltSiang: ['', '', '', '', '', ''],
        bebanMalam: [rec.r3 ?? '', rec.s3 ?? '', rec.t3 ?? '', rec.n3 ?? ''],
        voltMalam: ['', '', '', '', '', ''],
      },
      ...(hasJur4
        ? [
            {
              name: 'IV',
              bebanSiang: [
                rec.siangR4 ?? '',
                rec.siangS4 ?? '',
                rec.siangT4 ?? '',
                rec.siangN4 ?? '',
              ],
              voltSiang: ['', '', '', '', '', ''],
              bebanMalam: [rec.r4 ?? '', rec.s4 ?? '', rec.t4 ?? '', rec.n4 ?? ''],
              voltMalam: ['', '', '', '', '', ''],
            },
          ]
        : []),
    ];

    // Fill each Jurusan row
    jurusanData.forEach((jRow, jIdx) => {
      const rowNum = startRow + jIdx;
      ws.getRow(rowNum).height = 18;

      // 7. Jur. Siang
      const jSC = ws.getCell(rowNum, 7);
      jSC.value = jRow.name;
      jSC.font = { name: 'Arial', size: 8, bold: jRow.name === 'REL' };
      jSC.alignment = { horizontal: 'center', vertical: 'middle' };

      // 8-11: Siang Beban (R, S, T, N) from Sheet TEMUAN GARDU TIER 1 DAN TIER 1&
      jRow.bebanSiang.forEach((val, bIdx) => {
        const c = ws.getCell(rowNum, 8 + bIdx);
        const num = toNum(val);
        c.value = num;
        c.font = { name: 'Arial', size: 8 };
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        if (typeof num === 'number') {
          c.numFmt = '#,##0.0';
        }
      });

      // 12-17: Siang Volt (RS, RT, ST, RN, SN, TN)
      jRow.voltSiang.forEach((val, vIdx) => {
        const c = ws.getCell(rowNum, 12 + vIdx);
        const num = toNum(val);
        c.value = num;
        c.font = { name: 'Arial', size: 8 };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        if (typeof num === 'number') {
          c.numFmt = '#,##0';
        }
      });

      // 19. Jur. Malam
      const jMC = ws.getCell(rowNum, 19);
      jMC.value = jRow.name;
      jMC.font = { name: 'Arial', size: 8, bold: jRow.name === 'REL' };
      jMC.alignment = { horizontal: 'center', vertical: 'middle' };

      // 20-23: Malam Beban (R, S, T, N) from Sheet BEBAN PUNCAK GARDU
      jRow.bebanMalam.forEach((val, bIdx) => {
        const c = ws.getCell(rowNum, 20 + bIdx);
        const num = toNum(val);
        c.value = num;
        c.font = { name: 'Arial', size: 8 };
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        if (typeof num === 'number') {
          c.numFmt = '#,##0.0';
        }
      });

      // 24-29: Malam Volt (RS, RT, ST, RN, SN, TN) from Sheet BEBAN PUNCAK GARDU
      jRow.voltMalam.forEach((val, vIdx) => {
        const c = ws.getCell(rowNum, 24 + vIdx);
        const num = toNum(val);
        c.value = num;
        c.font = { name: 'Arial', size: 8 };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        if (typeof num === 'number') {
          c.numFmt = '#,##0';
        }
      });

      // Add borders to row
      for (let col = 1; col <= 29; col++) {
        ws.getCell(rowNum, col).border = thinBorder;
      }
    });

    curRow = endRow + 1;
  }
}

export async function generateTrafoExcelReport(
  records: RawTrafoRecord[],
  config: ReportConfig
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PLN Trafo Report Generator';
  workbook.created = new Date();

  // Filter records based on config
  const filteredRecords = records.filter((r) => {
    const matchFeeder =
      config.selectedFeeder === 'ALL' || r.feeder === config.selectedFeeder;
    const matchUnit =
      config.selectedUnit === 'ALL' || r.unit === config.selectedUnit;
    return matchFeeder && matchUnit;
  });

  // Group by Feeder (Jika dalam Satu ULP, pisahkan per Sheet dengan nama Sheet adalah Nama Feeder)
  const feedersMap = new Map<string, RawTrafoRecord[]>();
  filteredRecords.forEach((rec) => {
    const fKey = rec.feeder || 'FEEDER UTAMA';
    if (!feedersMap.has(fKey)) {
      feedersMap.set(fKey, []);
    }
    feedersMap.get(fKey)!.push(rec);
  });

  const usedSheetNames = new Set<string>();

  if (feedersMap.size === 0) {
    const ws = workbook.addWorksheet('Laporan Beban Trafo', {
      views: [{ showGridLines: true }],
    });
    const fallbackUlp = formatUlpName(config.selectedUnit !== 'ALL' ? config.selectedUnit : config.ulpUnit);
    populateFeederWorksheet(ws, 'FEEDER UTAMA', [], config, fallbackUlp);
  } else {
    for (const [feederName, feederRecs] of feedersMap.entries()) {
      // Nama Sheet adalah Nama Feeder
      const sheetName = sanitizeSheetName(feederName, usedSheetNames);
      const ws = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
      });

      // ULP diambil dari Spreadsheet kolom Unit Description
      const unitFromRow = feederRecs.find((r) => r.unit && r.unit.trim() !== '')?.unit;
      const ulpTitle = formatUlpName(
        unitFromRow || (config.selectedUnit !== 'ALL' ? config.selectedUnit : config.ulpUnit)
      );

      populateFeederWorksheet(ws, feederName, feederRecs, config, ulpTitle);
    }
  }

  // Generate buffer and Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
