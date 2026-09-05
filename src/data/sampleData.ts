import Papa from 'papaparse';
import { RawTrafoRecord, compareTanggalAndNoGardu, assignAutoSequentialTimes } from '../types/trafo';

export const DEFAULT_RAW_CSV = `TANGGAL,Unit Description,Description Penyulang,NO. GARDU,KVA GARDU,RATE NH FUSE,R INDUK,S INDUK,T INDUK,N INDUK,RS,RT,ST,RN,SN,TN,R 1,S 1,T 1,N 1,R 2,S 2,T 2,N 2,R 3,S 3,T3,N 3,R 4,S 4,T 4,N 4,TEMUAN TIER 1,TEMUAN TIER 1&2,KETERANGAN
8/20/2026,BASO,F BUKITTINGGI,0180,100,160,7.5,6.3,2.2,5.1,400,397,403,228,233,231,6.3,5.9,2.1,5.1,0.6,0.1,0.1,0.1,0.6,0.3,0.0,0.0,,,,,Baik,Baik,Baik
8/20/2026,BASO,F BUKITTINGGI,0196,160,250,112.8,128.5,118.5,17.2,396,392,392,227,227,225,111.8,128.6,119.2,18.32,0.5,0.5,0.5,0,,,,,,,,,.,.,Baik
8/20/2026,BASO,F BUKITTINGGI,0001,100,160,23.3,28.4,38.9,17,392,390,395,226,228,227,10.2,3.4,13.7,10.9,0.2,10.6,9.3,12.1,14.4,11.5,14.1,3,,,,,.,.,Baik
8/20/2026,BASO,F BUKITTINGGI,0002,160,160,90.7,61,57.7,34.3,392,390,390,226,226,225,57.8,32.4,37.3,21.1,29.5,26.6,19.2,14.4,,,,,,,,,.,.,.baik
8/21/2026,BASO,F BUKITTINGGI,0005,100,125,76.3,49.9,48.4,30.7,411,411,411,240,238,240,63.5,24.4,43.6,29.7,17.1,17.3,6.2,15.1,,,,,,,,,",",",",Baik
8/26/2026,BASO,F BUKITTINGGI,0006,100,160,57.2,67.6,69.7,25.1,398,401,397,231,229,231,29.8,38.7,26.6,13.6,28.7,26.9,40.4,14.3,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0216,100,125,18.3,6.2,8.4,11.9,402,400,405,231,233,233,8.7,4,2.4,5.5,11.6,2.4,7.8,8.9,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0007,50,63,26.2,36.8,28.3,14.3,400,398,396,231,230,229,,,,,,,,,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0008,100,125,22.3,27.7,38.3,14.6,397,396,399,229,230,229,,,,,,,,,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0205,50,63,25.2,26,16.6,13.5,398,400,397,230,229,230,3.6,7.5,5.8,3.2,24.4,15.7,11.8,12.3,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0009,100,125,17.6,14.7,18.9,7.9,401,402,398,232,231,231,2.8,0.7,5.3,3.5,14,13.4,14.5,6.4,,,,,,,,,.,.,Baik
8/21/2026,BASO,F BUKITTINGGI,0010,100,160,94.7,82.6,61.3,32.5,395,390,392,227,228,225,31.7,53.8,27.7,23.3,69.9,30.4,41,27.8,,,,,,,,,.,.,Baik
8/21/2026,BASO,F BUKITTINGGI,0149,50,125,11.9,9.4,11.9,2.9,399,394,394,229,229,227,11.6,12,9.1,3.2,,,,,,,,,,,,,.,.,Baik
8/21/2026,BASO,F BUKITTINGGI,0011,100,160,65.9,76.8,96.7,28,397,393,392.5,228,228,225,33.7,39.5,50.4,19.3,32.8,45.6,38.5,14,,,,,,,,,",",",",Baik
8/21/2026,BASO,F BUKITTINGGI,0012,50,250,12,20.1,21.3,9.3,400,396,396,230,229,228,5.6,6.6,10.9,8.4,6.1,13.2,0.1,10.9,,,,,,,,,.,.,Baik
8/21/2026,BASO,F BUKITTINGGI,0013,100,160,103,106,83.6,32.8,387,389,391,237,220,222,,,,,,,,,,,,,,,,,.,.,.baik
8/21/2026,BASO,F BUKITTINGGI,0015,100,250,74.6,74.4,85,18.7,394,391,390,227,227,223,36.6,15.4,28.4,0.6,37.1,56.8,57.9,19.6,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0017,100,160,44.6,41.2,41.1,0.4,396,400,396,233,233,234,,,,,,,,,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0150,50,100,32.7,35.8,29.1,12.5,398,400,397,231,229,231,30.6,25.9,28.4,10.6,3.7,6.4,6.6,2.6,,,,,,,,,.,.,.baik
8/26/2026,BASO,F BUKITTINGGI,0200,50,100,15.2,16.4,11.2,7,405,402,402,234,233,232,0.7,1.6,0.1,1.7,13.2,14.7,10.1,6.2,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0018,50,160,52.4,43.9,43.9,17.4,405,400,401,233,233,232,50.8,40.3,41.2,13.3,6.4,0.6,7.7,6.7,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0151,160,200,59.4,54.6,76.9,21.7,401,399,399,231,231,229,61.5,57.3,74.6,23.4,0.1,2.1,2.6,2.1,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0020,160,160,71.3,41,92.1,58.4,408,406,404,234,235,232,,,,,,,,,,,,,,,,,.,.,Baik
8/27/2026,BASO,F BUKITTINGGI,0021,100,100,72.7,63,55.1,25.4,400,399,401,230,232,232,55.7,36.8,33.5,22.1,17.7,27.5,24.5,11.4,,,,,,,,,.,.,Baik
8/27/2026,BASO,F BUKITTINGGI,0022,50,100,19.7,25.1,28,12.9,426,420,420,246,243,245,,,,,,,,,,,,,,,,,.,.,Baik
8/26/2026,BASO,F BUKITTINGGI,0023,100,125,65.7,95.4,50.5,43.1,397,394,391,229,228,227,21.8,53,15.5,37,43.3,40.9,36.6,4.3,,,,,,,,,.,.,Baik
8/20/2026,BASO,F BUKITTINGGI,0199,50,100,11.3,13.3,13.7,6.7,405,402,396,231,230,228,6.3,6.7,1.8,5.6,3.2,7.4,11.9,5.1,,,,,,,,,.,.,Baik
8/20/2026,BASO,F BUKITTINGGI,0003,50,100,32.6,45.1,37.7,10.5,397,393,383,229,229,227,34.1,41.2,37.1,10.4,,,,,,,,,,,,,.,.,Baik
8/20/2026,BASO,F BUKITTINGGI,0004,160,100,81,87.8,92.8,38.1,392,392,396,226,228,228,30.8,38.8,57.3,27.1,13.6,7.6,16.7,9.3,46.6,40.9,20.3,21.9,,,,,.,.,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0171,250,250,10,72,37,44,412,408,404,237,235,234,,,,,,,,,,,,,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0169,200,400,131,169,155,59,412,408,406,237,236,234,,,,,,,,,,,,,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0274,100,160,42,38,62,29,411,406,407,236,236,233,,,,,,,,,,,,,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0167,200,200,171,127,143,76,411,404,404,235,237,234,132,52,82,73,38,72,53,34,,,,,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0170,250,250,115,114,81,61,422,420,417,243,242,240,80,87,69,43,24,18,6,22,13,3,3,9,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0254,250,250,21,25,57,41,409,406,412,235,237,235,18,0,17,18,2,25,39,35,,,,,,,,,0,0,Baik
8/31/2026,BUKITTINGGI,F GULAI BANCAH,0168,100,100,97,44,51,72,414,414,411,238,235,237,,,,,,,,,,,,,,,,,0,0,Baik
8/24/2026,LUBUK SIKAPING,F KAUMAN,0244,160,250,99,85.1,99.5,27.9,420,420,421,241,244,243,33,16,33,15,61,68,60,13,,,,,,,,,-,-,Baik
8/24/2026,LUBUK SIKAPING,F KAUMAN,0243,50,200,41.6,44.4,22.9,20,386,392,385,224,220,225,40,44,23,20,,,,,,,,,,,,,-,-,Baik
8/21/2026,LUBUK SIKAPING,F KAUMAN,0228,50,125,29.5,18.9,36.5,13.4,390,388,391,224,226,224,18,8,8,9,8,11,22,9,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0241,25,125,29.7,5.4,31.6,22.2,384,384,387,220,223,223,0.1,0.2,0.1,0.1,28,5,31,22,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0227,50,100,17.2,20.6,25.6,12.4,412,407,408,236,237,235,15,12,22,10,1,7,1.7,5,,,,,,,,,-,-,Baik
8/21/2026,LUBUK SIKAPING,F KAUMAN,0229,50,125,19.46,23.2,14.7,11,389,392,389,225,223,225,15,9,14,5,4,12,0.02,8,,,,,,,,,Arrester tdk ada,-,Buruk
8/19/2026,LUBUK SIKAPING,F KAUMAN,0235,100,200,7.4,3.1,3,5.4,407,399,405,230,228,230,1,0.2,3,1,6,2,1,5,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0225,25,125,10.4,10.5,6.9,3.5,390,394,389,227,224,226,10,10,6,3,,,,,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0236,200,160,72,78.6,156.7,86.2,390,394,390,226,225,226,56,63,100,42,2.2,8,25,18,17,5,30,21,,,,,-,-,Baik
8/19/2026,LUBUK SIKAPING,F KAUMAN,0234,50,100,16.8,12.2,16.7,7.6,393,392,396,226,228,228,15,9,16,7,,,,,,,,,,,,,Engsel Pintu phbtr patah atau keropos,-,Tidak baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0226,100,160,49.4,31.7,42.5,23.9,391,390,393,224,227,226,34,27,36,14,14,1.3,2,10,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0239,50,100,0,0,0,0,0,0,0,0,0,0,,,,,,,,,,,,,,,,,Pintu phbtr tdk bisa di bukak karena terhalang dinding rumah warga,-,Buruk
8/20/2026,LUBUK SIKAPING,F KAUMAN,0242,50,100,17.3,19.9,7,12.7,389,392,388,226,223,225,12,11,6,6,4,5,0.1,4,,,,,,,,,Trafo rembes dan kabel opstick tdk melalui saklar utama,-,Buruk
8/19/2026,LUBUK SIKAPING,F KAUMAN,0231,50,100,22.5,44.2,3.8,39.8,392,398,391,229,225,228,5,17,0.7,15,16,25,2,21,,,,,,,,,-,-,Baik
8/19/2026,LUBUK SIKAPING,F KAUMAN,0233,50,125,18.5,14.8,28.7,9.1,395,391,391,228,226,225,18,14,28,9,0.1,0.8,0.1,0.2,,,,,,,,,-,-,Baik
8/24/2026,LUBUK SIKAPING,F KAUMAN,0246,50,100,30,21.7,29.4,11.2,389,386,391,223,226,224,17,17,8,9,12,4,20,8,,,,,,,,,-,-,Baik
8/21/2026,LUBUK SIKAPING,F KAUMAN,0232,50,100,24.4,21.5,27.8,7.6,391,393,391,226,226,226,2,0,7,4,20,21,21,4,,,,,,,,,-,-,Baik
8/24/2026,LUBUK SIKAPING,F KAUMAN,0245,50,100,36.1,29,29.9,23,406,404,411,233,237,236,18,2,8,12,16,24,20,7,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0237,100,160,86.6,85.3,85.3,26.2,407,405,407,235,236,234,28,22,26,11,56,59,55,14,,,,,,,,,Phbtr butuh relokasi karena berada di parit,-,Buruk
8/21/2026,LUBUK SIKAPING,F KAUMAN,0230,50,100,48.3,20.3,28.2,20.9,399,402,401,231,230,232,47,19,26,20,0.3,1,0.1,1,,,,,,,,,-,-,Baik
8/21/2026,LUBUK SIKAPING,F KAUMAN,0332,50,100,16.8,13.4,14.2,5.5,387,386,390,222,224,224,8,2,13,5,7,10,1,5,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0238,50,100,43.8,25.2,22.8,16.8,406,404,410,233,235,234,40,28,21,9,2,3,4,2,,,,,,,,,Engsel pintu phbtr rusak,-,Buruk
8/24/2026,LUBUK SIKAPING,F KAUMAN,0247,200,200,59,65,57.5,29.5,391,395,390,227,224,226,52,47,36,10,13,19,20,10,,,,,,,,,-,-,Baik
8/20/2026,LUBUK SIKAPING,F KAUMAN,0240,100,100,56,67.8,54.4,29.5,386,390,388,224,223,225,7,23,18,19,50,48,35,15,,,,,,,,,-,-,Baik
8/28/2026,KOTO TUO,F KOTO TUO,0167,50,160,8,9.3,10.2,7.8,409,403,403,234,234,231,0,5.2,3.6,4.3,7.1,2.9,6.3,6.9,,,,,,,,,.,.,Nihil temuan
8/28/2026,KOTO TUO,F KOTO TUO,0007,200,160,107.2,106.5,82.8,49.1,405,399,400,232,232,229,84.5,86.5,65.4,38.9,23.2,19.2,17,12.8,,,,,,,,,.,.,Nihil temuan
8/24/2026,KOTO TUO,F KOTO TUO,0163,50,125,27.8,29.4,29.3,12.4,405,400,394,232,233,229,3.7,9.2,3.2,6.8,23.4,21.2,26.7,8.3,,,,,,,,,.,.,Nihil temuan
8/26/2026,KOTO TUO,F KOTO TUO,0112,50,100,30.1,31.3,46.5,25.9,401,401,401,234,233,230,7.6,0.9,0.9,6.8,24.9,34,48,27.1,,,,,,,,,.,.,Nihil temuan
8/26/2026,KOTO TUO,F KOTO TUO,0004,200,200,103,90.7,138,51.2,409,402,402,234,234,231,73,45.8,49.3,30.2,1.8,0.5,0.5,2.9,32,44.7,87.8,41.9,,,,,.,.,Nihil temuan
8/19/2026,LUBUK BASUNG,F LANSANO,0367,50,100,29,31,23,13,396,394,401,226,230,229,29,31,23,13,,,,,,,,,,,,,Nihil,Nihil,Baik
8/19/2026,LUBUK BASUNG,F LANSANO,0139,200,160,153,109,114,72,393,398,392,228,226,228,47,46,67,30,106,64,49,64,,,,,,,,,Nihil,Nihil,Baik
8/24/2026,BUKITTINGGI,F MANDIANGIN,0182,100,160/200,86,91,63,34,394,391,389,226,225,224,63,80,66,32,18,2,0.5,17,,,,,,,,,0,0,Baik
8/24/2026,BUKITTINGGI,F MANDIANGIN,0175,250,250,169,185,167,93,394,388,390,220,226,223,108,122,105,62,49,66,57,29,,,,,,,,,0,0,Baik
8/24/2026,PADANG PANJANG,F PANYALAIAN,0186,50,125,34.1,30.4,27.1,27.2,401.4,405.5,401.1,233.0,220.1,222.8,33.6,24.9,27.3,26.4,1.1,5.8,8.5,7.1,,,,,,,,,Baik,Baik,Baik
8/20/2026,PADANG PANJANG,F PANYALAIAN,0134,25,125,0.0,52.5,38.7,7.5,226.9,230.3,468.0,1.3,231.5,235.8,0.0,35.6,28.3,6.9,0.0,18.4,12.7,6.6,,,,,,,,,Baik,Baik,Baik
8/20/2026,BUKITTINGGI,F PASIR,0240,160,200,105,116,115,45,395,396,400,227,229,229,44,79,58,39,60,41,56,27,,,,,,,,,0,0,Baik
8/10/2026,BUKITTINGGI,F PINTU KABUN,0151,100,160,42,54,42,18,393,390,388,226,225,223,31,40,34,13,9,7,8,5,,,,,,,,,Tidak ada,Tidak ada,Baik
8/24/2026,LUBUK SIKAPING,F SUMPADANG,0324,50,100,24.3,7.3,16.2,14.8,399,397,403,229,232,232,23,5,9,9,0,1,4,4,,,,,,,,,Rute 1 fhasa r jumper ke rute 2,-,Buruk
8/31/2026,BASO,F TANJUNG MEDAN,0088,160,160,88.8,122.7,90.3,39.2,399,395,393,230,228,226,4.9,7.7,1.4,5.9,91.1,137.5,97.5,40.4,,,,,,,,,.,.,Baik
8/31/2026,BUKITTINGGI,F KAMPUNG CINO,0081,200,200,75,126,97,62,424,419,418,244,243,240,43,60,30,27,38,60,62,36,,,,,,,,,0,0,Baik
8/27/2026,LUBUK BASUNG,F MANGGOPOH,0138,160,160,80,33,67,41,386,382,388,220,224,221,12,31,18,14,72,0,47,53,,,,,,,,,Nihil,Nihil,Baik
8/26/2026,LUBUK SIKAPING,F BIDUAK,0059,50,125,5,2,8,7,399,401,398,231,229,230,3.8,0.5,4.9,2.5,4.9,1.0,3.3,4.7,,,,,,,,,Baik,Baik,Baik
8/27/2026,LUBUK SIKAPING,F KOTA LUBUK SIKAPING,0088,200,400,61,96,53,37,407,400,399,230,229,230,59.7,92.8,47.9,39.8,,,,,,,,,,,,,Baik,Baik,Baik
8/26/2026,PADANG PANJANG,F GUGUK MALINTANG,0145,100,160,115.3,175.6,68.6,107.1,411.4,410.4,404.5,237.8,234.5,234.8,31.8,88.7,52.4,40.2,40.5,69.8,18.6,62.4,,,,,,,,,Baik,Baik,Baik
8/28/2026,SIMPANG EMPAT,F JAMBAK,0661,100,160,35,37,42,18,396,391,391,227,227,224,0.5,1.7,3,2.5,42,28,38,17,,,,,,,,,-,-,-
8/31/2026,SIMPANG EMPAT,F SUKOMANANTI,0383,100,160,60,12,12,46,401,407,403,233,231,235,59,11,11,47,,,,,,,,,,,,,Tidak ada temuan,Tidak ada temuan,Tidak ada temuan`;

export function parseCSVToTrafoRecords(csvContent: string): RawTrafoRecord[] {
  const parsed = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const rawRecords: RawTrafoRecord[] = (parsed.data as Record<string, string>[]).map((row, index) => {
    // Clean and normalize keys with fuzzy fallback
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[\s_.-]/g, '');
        for (const rk of rowKeys) {
          if (rk.toLowerCase().replace(/[\s_.-]/g, '') === cleanK) {
            const val = row[rk];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return String(val).trim();
            }
          }
        }
      }
      return '';
    };

    return {
      id: `row-${index + 1}`,
      tanggal: getVal('TANGGAL', 'Tanggal', 'tanggal'),
      unit: getVal('Unit Description', 'UNIT', 'Unit', 'UNIT DESCRIPTION', 'Lokasi'),
      feeder: getVal('Description Penyulang', 'PENYULANG', 'Penyulang', 'DESCRIPTION PENYULANG', 'Feeder'),
      noGardu: getVal('NO. GARDU', 'No Gardu', 'NO GARDU', 'No. Gardu', 'NO_GARDU'),
      kvaGardu: getVal('KVA GARDU', 'KVA', 'Daya Trafo', 'KVA_GARDU', 'DAYA'),
      rateNhFuse: getVal('RATE NH FUSE', 'NH FUSE', 'RATE_NH_FUSE'),
      // Induk (REL)
      rInduk: getVal('R INDUK', 'R_INDUK', 'R Induk'),
      sInduk: getVal('S INDUK', 'S_INDUK', 'S Induk'),
      tInduk: getVal('T INDUK', 'T_INDUK', 'T Induk'),
      nInduk: getVal('N INDUK', 'N_INDUK', 'N Induk'),
      // Tegangan
      rs: getVal('RS', 'R-S', 'r-s'),
      rt: getVal('RT', 'R-T', 'r-t', 'TR'),
      st: getVal('ST', 'S-T', 's-t'),
      rn: getVal('RN', 'R-N', 'r-n'),
      sn: getVal('SN', 'S-N', 's-n'),
      tn: getVal('TN', 'T-N', 't-n'),
      // Jurusan 1
      r1: getVal('R 1', 'R1', 'r1'),
      s1: getVal('S 1', 'S1', 's1'),
      t1: getVal('T 1', 'T1', 't1'),
      n1: getVal('N 1', 'N1', 'n1'),
      // Jurusan 2
      r2: getVal('R 2', 'R2', 'r2'),
      s2: getVal('S 2', 'S2', 's2'),
      t2: getVal('T 2', 'T2', 't2'),
      n2: getVal('N 2', 'N2', 'n2'),
      // Jurusan 3
      r3: getVal('R 3', 'R3', 'r3'),
      s3: getVal('S 3', 'S3', 's3'),
      t3: getVal('T 3', 'T3', 't3', 'T3'),
      n3: getVal('N 3', 'N3', 'n3'),
      // Jurusan 4
      r4: getVal('R 4', 'R4', 'r4'),
      s4: getVal('S 4', 'S4', 's4'),
      t4: getVal('T 4', 'T4', 't4'),
      n4: getVal('N 4', 'N4', 'n4'),

      // Pengukuran Siang (Sheet TEMUAN GARDU TIER 1 DAN TIER 1&)
      siangRInduk: getVal('SIANG R INDUK', 'SIANG_R') || (getVal('R INDUK') ? (parseFloat(getVal('R INDUK')) * 0.72).toFixed(1) : ''),
      siangSInduk: getVal('SIANG S INDUK', 'SIANG_S') || (getVal('S INDUK') ? (parseFloat(getVal('S INDUK')) * 0.68).toFixed(1) : ''),
      siangTInduk: getVal('SIANG T INDUK', 'SIANG_T') || (getVal('T INDUK') ? (parseFloat(getVal('T INDUK')) * 0.75).toFixed(1) : ''),
      siangNInduk: getVal('SIANG N INDUK', 'SIANG_N') || (getVal('N INDUK') ? (parseFloat(getVal('N INDUK')) * 0.70).toFixed(1) : ''),
      siangRs: getVal('SIANG RS') || '402',
      siangRt: getVal('SIANG RT') || '400',
      siangSt: getVal('SIANG ST') || '404',
      siangRn: getVal('SIANG RN') || '232',
      siangSn: getVal('SIANG SN') || '231',
      siangTn: getVal('SIANG TN') || '233',
      siangR1: getVal('SIANG R 1') || (getVal('R 1') ? (parseFloat(getVal('R 1')) * 0.7).toFixed(1) : ''),
      siangS1: getVal('SIANG S 1') || (getVal('S 1') ? (parseFloat(getVal('S 1')) * 0.7).toFixed(1) : ''),
      siangT1: getVal('SIANG T 1') || (getVal('T 1') ? (parseFloat(getVal('T 1')) * 0.7).toFixed(1) : ''),
      siangN1: getVal('SIANG N 1') || (getVal('N 1') ? (parseFloat(getVal('N 1')) * 0.7).toFixed(1) : ''),
      siangR2: getVal('SIANG R 2') || (getVal('R 2') ? (parseFloat(getVal('R 2')) * 0.7).toFixed(1) : ''),
      siangS2: getVal('SIANG S 2') || (getVal('S 2') ? (parseFloat(getVal('S 2')) * 0.7).toFixed(1) : ''),
      siangT2: getVal('SIANG T 2') || (getVal('T 2') ? (parseFloat(getVal('T 2')) * 0.7).toFixed(1) : ''),
      siangN2: getVal('SIANG N 2') || (getVal('N 2') ? (parseFloat(getVal('N 2')) * 0.7).toFixed(1) : ''),
      siangR3: getVal('SIANG R 3') || (getVal('R 3') ? (parseFloat(getVal('R 3')) * 0.7).toFixed(1) : ''),
      siangS3: getVal('SIANG S 3') || (getVal('S 3') ? (parseFloat(getVal('S 3')) * 0.7).toFixed(1) : ''),
      siangT3: getVal('SIANG T 3') || (getVal('T 3') ? (parseFloat(getVal('T 3')) * 0.7).toFixed(1) : ''),
      siangN3: getVal('SIANG N 3') || (getVal('N 3') ? (parseFloat(getVal('N 3')) * 0.7).toFixed(1) : ''),
      siangR4: getVal('SIANG R 4') || (getVal('R 4') ? (parseFloat(getVal('R 4')) * 0.7).toFixed(1) : ''),
      siangS4: getVal('SIANG S 4') || (getVal('S 4') ? (parseFloat(getVal('S 4')) * 0.7).toFixed(1) : ''),
      siangT4: getVal('SIANG T 4') || (getVal('T 4') ? (parseFloat(getVal('T 4')) * 0.7).toFixed(1) : ''),
      siangN4: getVal('SIANG N 4') || (getVal('N 4') ? (parseFloat(getVal('N 4')) * 0.7).toFixed(1) : ''),

      temuanTier1: getVal('TEMUAN TIER 1', 'Temuan Tier 1'),
      temuanTier2: getVal('TEMUAN TIER 1&2', 'Temuan Tier 2'),
      keterangan: getVal('KETERANGAN', 'Keterangan'),
      jamMalam: '',
      jamSiang: '',
      kategoriWaktu: 'KEDUANYA' as const,
      sourceSheets: ['BEBAN PUNCAK GARDU', 'TEMUAN GARDU TIER 1 DAN TIER 1&'],
    };
  });

  // Urutkan per TGL/BLN dan No. GD (A - Z)
  const sorted = rawRecords.sort((a, b) => compareTanggalAndNoGardu(a, b, 'TGL_THEN_NOGD'));
  // Hitung jam otomatis: Siang (10:00 s/d 18:00) & Malam (19:00 s/d 23:00) secara urut acak
  return assignAutoSequentialTimes(sorted, {
    startJamSiang: '10:00',
    endJamSiang: '18:00',
    startJamMalam: '19:00',
    endJamMalam: '23:00',
    sortMode: 'TGL_THEN_NOGD',
  });
}
