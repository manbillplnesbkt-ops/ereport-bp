import React, { useState, useMemo } from 'react';
import {
  RawTrafoRecord,
  ReportConfig,
  formatUlpName,
  assignAutoSequentialTimes,
} from './types/trafo';
import {
  DEFAULT_RAW_CSV,
  parseCSVToTrafoRecords,
} from './data/sampleData';
import { generateTrafoExcelReport } from './utils/excelGenerator';
import { loadGoogleSpreadsheetDual, parseExcelWorkbook } from './utils/sheetLoader';
import { ReportHeader } from './components/ReportHeader';
import { DataTablePreview } from './components/DataTablePreview';
import {
  Zap,
  Activity,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  Columns,
} from 'lucide-react';

export default function App() {
  const initialRecords = useMemo(() => parseCSVToTrafoRecords(DEFAULT_RAW_CSV), []);
  const [records, setRecords] = useState<RawTrafoRecord[]>(initialRecords);

  const [config, setConfig] = useState<ReportConfig>(() => {
    const firstUnit = initialRecords.find((r) => r.unit && r.unit.trim() !== '')?.unit;
    return {
      judul: 'HASIL PENGUKURAN BEBAN DAN TEGANGAN (PUNCAK) TRAFO DISTRIBUSI',
      bulanTahun: 'BULAN AGUSTUS 2026',
      ulpUnit: formatUlpName(firstUnit || 'BASO'),
      selectedFeeder: 'ALL',
      selectedUnit: 'ALL',
      defaultJamMalam: '19:00',
      jamAkhirMalam: '23:00',
      defaultJamSiang: '10:00',
      jamAkhirSiang: '18:00',
      waktuTarget: 'MALAM',
      sortMode: 'TGL_THEN_NOGD',
    };
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleReassignTimes = () => {
    const updated = assignAutoSequentialTimes(records, {
      startJamSiang: config.defaultJamSiang || '10:00',
      endJamSiang: config.jamAkhirSiang || '18:00',
      startJamMalam: config.defaultJamMalam || '19:00',
      endJamMalam: config.jamAkhirMalam || '23:00',
      sortMode: config.sortMode || 'TGL_THEN_NOGD',
    });
    setRecords(updated);
    showToast('Jam Siang (10:00 s/d 18:00) & Malam (19:00 s/d 23:00) berhasil diacak ulang secara berurutan!');
  };

  const applyNewRecords = (newRecords: RawTrafoRecord[], message: string) => {
    setRecords(newRecords);
    const unitsFound = Array.from(
      new Set(newRecords.map((r) => r.unit).filter((u): u is string => Boolean(u && u.trim() !== '')))
    );
    if (unitsFound.length === 1) {
      setConfig((prev) => ({
        ...prev,
        ulpUnit: formatUlpName(unitsFound[0]),
        selectedUnit: unitsFound[0],
      }));
    } else if (unitsFound.length > 1) {
      setConfig((prev) => ({
        ...prev,
        ulpUnit: formatUlpName(unitsFound[0]),
      }));
    }
    showToast(message);
  };

  // Extract distinct units and feeders
  const units = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.unit) set.add(r.unit);
    });
    return Array.from(set).sort();
  }, [records]);

  const feeders = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.feeder) set.add(r.feeder);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records count
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchFeeder =
        config.selectedFeeder === 'ALL' || r.feeder === config.selectedFeeder;
      const matchUnit =
        config.selectedUnit === 'ALL' || r.unit === config.selectedUnit;
      return matchFeeder && matchUnit;
    });
  }, [records, config.selectedFeeder, config.selectedUnit]);

  // Analytics Metrics
  const stats = useMemo(() => {
    let totalKva = 0;
    let temuanCount = 0;

    filteredRecords.forEach((r) => {
      const kva = parseFloat(String(r.kvaGardu).replace(',', '.'));
      if (!isNaN(kva)) {
        totalKva += kva;
      }
      const ket = (r.keterangan || '').toLowerCase();
      const t1 = (r.temuanTier1 || '').toLowerCase();
      if (
        ket.includes('buruk') ||
        ket.includes('rusak') ||
        ket.includes('patah') ||
        ket.includes('jumper') ||
        ket.includes('rembes') ||
        t1.includes('rusak') ||
        t1.includes('patah') ||
        t1.includes('jumper')
      ) {
        temuanCount++;
      }
    });

    const activeFeeders = new Set(filteredRecords.map((r) => r.feeder)).size;

    return {
      totalGardu: filteredRecords.length,
      activeFeeders,
      totalKva: totalKva.toLocaleString('id-ID'),
      temuanCount,
    };
  }, [filteredRecords]);

  // Handle Download Excel (.xlsx)
  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateTrafoExcelReport(records, config);

      // Create download trigger
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizeName = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
      const unitFromRow = records.find((r) => r.unit && r.unit.trim() !== '')?.unit;
      const targetUlp =
        config.selectedUnit !== 'ALL'
          ? formatUlpName(config.selectedUnit)
          : unitFromRow
          ? formatUlpName(unitFromRow)
          : config.ulpUnit;
      const feederSuffix =
        config.selectedFeeder !== 'ALL'
          ? `_${sanitizeName(config.selectedFeeder)}`
          : '_Per_Sheet_Feeder';
      link.download = `Laporan_Beban_Trafo_${sanitizeName(
        targetUlp
      )}${feederSuffix}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('File Excel laporan berhasil diunduh (multi-sheet per Feeder)!');
    } catch (err) {
      console.error('Error generating Excel:', err);
      showToast('Terjadi kesalahan saat membuat file Excel.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Fetch from Google Spreadsheet ID (Dual Sheets: Malam & Siang)
  const handleFetchSpreadsheetId = async (sheetId: string) => {
    try {
      const result = await loadGoogleSpreadsheetDual(sheetId);
      if (result.records.length === 0) {
        throw new Error('Tidak ada baris data gardu yang ditemukan dalam Spreadsheet tersebut.');
      }
      applyNewRecords(result.records, result.summaryMessage);
    } catch (err) {
      console.error('Error fetching sheet:', err);
      throw err;
    }
  };

  // Handle Import File (.xlsx or .csv)
  const handleImportFile = async (file: File) => {
    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const result = await parseExcelWorkbook(file);
        if (result.records.length === 0) {
          showToast('File Excel tidak memiliki baris data gardu yang valid.');
          return;
        }
        applyNewRecords(result.records, result.summaryMessage);
      } else {
        const text = await file.text();
        handleImportCsvText(text);
      }
    } catch (err) {
      console.error('Error importing file:', err);
      showToast('Gagal memproses file. Pastikan format file sesuai.');
    }
  };

  const handleImportCsvText = (text: string) => {
    try {
      const parsed = parseCSVToTrafoRecords(text);
      if (parsed.length === 0) {
        showToast('File CSV tidak memiliki baris data yang valid.');
        return;
      }
      applyNewRecords(parsed, `Berhasil mengimpor ${parsed.length} data gardu!`);
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses file CSV.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-[#F5F5F5] font-sans">
      {/* Top Header Controls */}
      <ReportHeader
        config={config}
        onChangeConfig={(newCfg) => setConfig((prev) => ({ ...prev, ...newCfg }))}
        units={units}
        feeders={feeders}
        totalRecords={records.length}
        filteredCount={filteredRecords.length}
        onDownloadExcel={handleDownloadExcel}
        onImportCsvText={handleImportCsvText}
        onImportFile={handleImportFile}
        onFetchSpreadsheetId={handleFetchSpreadsheetId}
        isDownloading={isDownloading}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1">
        {/* Dual-Sheet Source Indicator Banner */}
        <div className="bg-[#121212] border border-white/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/15 text-xs font-mono">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white/50">Malam:</span>
              <span className="text-[#00FF66] font-bold">BEBAN PUNCAK GARDU</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/15 text-xs font-mono">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/50">Siang:</span>
              <span className="text-[#00FF66] font-bold">TEMUAN GARDU TIER 1 DAN TIER 1&</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/15 text-xs font-mono">
              <Columns className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white/50">Kolom Jurusan:</span>
              <span className="text-white font-bold">REL, I, II, III</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
            Sinkronisasi Otomatis No Gardu
          </div>
        </div>

        {/* KPI Metrics Cards - Bold Typography Archetype */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                01 // Total Gardu
              </span>
              <Layers className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter tabular-nums font-display">
                {stats.totalGardu}
              </div>
              <div className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest mt-1 font-semibold">
                Units Loaded
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                02 // Penyulang
              </span>
              <Activity className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter tabular-nums font-display">
                {stats.activeFeeders}
              </div>
              <div className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest mt-1 font-semibold">
                Active Feeders
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                03 // Total Daya
              </span>
              <Zap className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter tabular-nums font-display">
                {stats.totalKva.toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest mt-1 font-semibold">
                kVA Installed
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/40 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                04 // Temuan
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter tabular-nums font-display">
                {stats.temuanCount}
              </div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-1 font-semibold">
                Anomali Gardu
              </div>
            </div>
          </div>
        </div>

        {/* Live Table Preview matching user template & Bold Output Design */}
        <DataTablePreview
          records={records}
          config={config}
          onChangeConfig={(changes) => setConfig((prev) => ({ ...prev, ...changes }))}
          onReassignTimes={handleReassignTimes}
          onExportExcel={handleDownloadExcel}
          isDownloading={isDownloading}
        />

        {/* Informational Guidance / Log Box styled like Design HTML Log Output */}
        <div className="p-6 bg-[#111111] border-l-4 border-[#00FF66] text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-[0.25em]">
              // System Instructions & Panduan Template PLN
            </p>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-white/10 text-[#00FF66]">
              STATUS: READY
            </span>
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-white/80 space-y-1.5">
            <p className="flex items-start gap-2">
              <span className="text-[#00FF66]">&gt;</span>
              <span>
                <strong>Merge Cell Matrix:</strong> Hasil ekspor Excel otomatis menghasilkan struktur sel tergabung (REL induk + Jurusan I, II, III, IV) sesuai template resmi PLN.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#00FF66]">&gt;</span>
              <span>
                <strong>Feeder Segregation:</strong> Gunakan filter Unit dan Penyulang di atas untuk mengunduh feeder tunggal atau unduh seluruh feeder dengan banner pemisah.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#00FF66]">&gt;</span>
              <span>
                <strong>Google Sheets Live Sync:</strong> Atur akses Google Sheet ke &ldquo;Anyone with the link can view&rdquo;, tempel ID/link, lalu klik Load untuk sinkronisasi seketika.
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] border border-[#00FF66] text-[#00FF66] px-5 py-3.5 shadow-2xl flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-[#00FF66] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
