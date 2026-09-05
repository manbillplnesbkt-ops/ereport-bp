import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  Link,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ReportConfig, formatUlpName } from '../types/trafo';

interface ReportHeaderProps {
  config: ReportConfig;
  onChangeConfig: (newConfig: Partial<ReportConfig>) => void;
  units: string[];
  feeders: string[];
  totalRecords: number;
  filteredCount: number;
  onDownloadExcel: () => void;
  onImportCsvText: (text: string) => void;
  onImportFile?: (file: File) => Promise<void>;
  onFetchSpreadsheetId: (sheetId: string) => Promise<void>;
  isDownloading: boolean;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  config,
  onChangeConfig,
  units,
  feeders,
  totalRecords,
  filteredCount,
  onDownloadExcel,
  onImportCsvText,
  onImportFile,
  onFetchSpreadsheetId,
  isDownloading,
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleFetchSheet = async () => {
    if (!sheetInput.trim()) {
      setSheetError('Masukkan Spreadsheet ID atau URL Google Sheets');
      return;
    }
    setSheetError(null);
    setIsFetchingSheet(true);
    try {
      // Extract ID from full URL if provided
      let id = sheetInput.trim();
      const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        id = match[1];
      }
      await onFetchSpreadsheetId(id);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Gagal mengambil spreadsheet';
      setSheetError(errorMsg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onImportFile) {
      await onImportFile(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onImportCsvText(text);
        }
      };
      reader.readAsText(file);
    }
    // reset input
    e.target.value = '';
  };

  return (
    <header className="bg-[#0A0A0A] text-[#F5F5F5] border-b border-white/10 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
        {/* Top Header Row matching Bold Typography Design */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] tracking-[0.3em] uppercase px-2 py-0.5 bg-white/10 text-[#00FF66] border border-white/15 font-mono font-bold">
                PLN DISTRIBUSI • BUKITTINGGI
              </span>
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                {filteredCount}/{totalRecords} GARDU AKTIF
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none uppercase text-white font-display">
              REPORT<span className="text-[#00FF66]">.</span>ENGINE
            </h1>
            <p className="mt-2 text-xs tracking-[0.3em] uppercase text-white/40 font-mono">
              Spreadsheet to XLSX Converter v2.0 • Standar Form Pengukuran Trafo
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end justify-between gap-3">
            <div className="text-left sm:text-right">
              <div className="text-3xl sm:text-4xl font-light tabular-nums text-white font-mono tracking-tight">
                {new Date().toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                }).replace(/\//g, '.')}
              </div>
              <div className="text-xs uppercase tracking-widest text-[#00FF66] flex items-center sm:justify-end gap-1.5 font-bold mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></span>
                <span>System Operational</span>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <button
                onClick={() => setShowConfigModal(!showConfigModal)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
                  showConfigModal
                    ? 'bg-white/20 text-[#00FF66] border-[#00FF66]'
                    : 'bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border-white/20'
                }`}
                title="Pengaturan Kop Laporan & Jam"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Kop Laporan</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 transition-colors cursor-pointer" title="Import file Excel (.xlsx, .xls) atau CSV">
                <Upload className="w-3.5 h-3.5 text-white/70" />
                <span>Import File (XLSX / CSV)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={onDownloadExcel}
                disabled={isDownloading || filteredCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-tighter text-black bg-[#00FF66] hover:bg-white disabled:opacity-40 disabled:hover:bg-[#00FF66] disabled:cursor-not-allowed transition-colors duration-300"
              >
                {isDownloading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Generate Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Spreadsheet ID & Target Selectors Bar */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Spreadsheet ID */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono">
              Spreadsheet ID / URL
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <Link className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Paste Google Sheet URL atau ID (e.g. 1A2b3C4d5E6f...)"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchSheet()}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono text-white bg-white/5 border border-white/20 focus:border-[#00FF66] focus:bg-white/10 outline-none transition-colors placeholder:text-white/30"
                />
              </div>
              <button
                onClick={handleFetchSheet}
                disabled={isFetchingSheet}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-black bg-[#00FF66] hover:bg-white transition-colors shrink-0 disabled:opacity-50"
              >
                {isFetchingSheet ? 'Sync...' : 'Load'}
              </button>
            </div>
          </div>

          {/* Unit Target */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono">
              Target Unit
            </label>
            <select
              value={config.selectedUnit}
              onChange={(e) => {
                const val = e.target.value;
                onChangeConfig({
                  selectedUnit: val,
                  ulpUnit: val !== 'ALL' ? formatUlpName(val) : config.ulpUnit,
                });
              }}
              className="w-full py-2 px-3 text-xs font-mono uppercase bg-[#141414] border border-white/20 text-white focus:border-[#00FF66] outline-none transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Unit ({units.length})</option>
              {units.map((u) => (
                <option key={u} value={u} className="bg-[#141414] text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Feeder Target */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono">
              Select Target Feeder
            </label>
            <select
              value={config.selectedFeeder}
              onChange={(e) => onChangeConfig({ selectedFeeder: e.target.value })}
              className="w-full py-2 px-3 text-xs font-mono uppercase bg-[#141414] border border-white/20 text-white focus:border-[#00FF66] outline-none transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Penyulang ({feeders.length})</option>
              {feeders.map((f) => (
                <option key={f} value={f} className="bg-[#141414] text-white">
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sheetError && (
          <div className="mt-3 p-3 bg-red-950/40 border border-red-500/40 text-xs text-red-200 font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{sheetError}</span>
          </div>
        )}
      </div>

      {/* Format Laporan Configuration Drawer / Panel */}
      {showConfigModal && (
        <div className="bg-[#111111] border-t border-b border-white/10 px-4 sm:px-8 py-5 transition-all">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#00FF66] font-bold">
                // Formatting Profile & Parameter Kop Laporan
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                PLN Standard Excel Output
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Kop Judul Laporan
                </label>
                <input
                  type="text"
                  value={config.judul}
                  onChange={(e) => onChangeConfig({ judul: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Bulan & Tahun Laporan
                </label>
                <input
                  type="text"
                  value={config.bulanTahun}
                  onChange={(e) => onChangeConfig({ bulanTahun: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                  placeholder="BULAN AGUSTUS 2026"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Nama ULP / Unit PLN
                </label>
                <input
                  type="text"
                  value={config.ulpUnit}
                  onChange={(e) => onChangeConfig({ ulpUnit: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                  placeholder="ULP BUKITTINGGI"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Jam Siang (Mulai s/d Terakhir)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={config.defaultJamSiang}
                    onChange={(e) =>
                      onChangeConfig({ defaultJamSiang: e.target.value })
                    }
                    className="w-1/2 px-2 py-2 text-xs font-mono text-white text-center bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                    placeholder="10:00"
                    title="Jam Siang Mulai"
                  />
                  <span className="text-white/40 text-xs">-</span>
                  <input
                    type="text"
                    value={config.jamAkhirSiang || '18:00'}
                    onChange={(e) =>
                      onChangeConfig({ jamAkhirSiang: e.target.value })
                    }
                    className="w-1/2 px-2 py-2 text-xs font-mono text-white text-center bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                    placeholder="18:00"
                    title="Jam Siang Terakhir"
                  />
                </div>
                <div className="text-[9px] font-mono text-[#00FF66]/80 mt-1">
                  10:00 s/d 18:00 (Urut Acak)
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Jam Malam (Mulai s/d Terakhir)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={config.defaultJamMalam}
                    onChange={(e) =>
                      onChangeConfig({ defaultJamMalam: e.target.value })
                    }
                    className="w-1/2 px-2 py-2 text-xs font-mono text-white text-center bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                    placeholder="19:00"
                    title="Jam Malam Mulai"
                  />
                  <span className="text-white/40 text-xs">-</span>
                  <input
                    type="text"
                    value={config.jamAkhirMalam || '23:00'}
                    onChange={(e) =>
                      onChangeConfig({ jamAkhirMalam: e.target.value })
                    }
                    className="w-1/2 px-2 py-2 text-xs font-mono text-white text-center bg-white/5 border border-white/20 focus:border-[#00FF66] outline-none"
                    placeholder="23:00"
                    title="Jam Malam Terakhir"
                  />
                </div>
                <div className="text-[9px] font-mono text-[#00FF66]/80 mt-1">
                  19:00 s/d 23:00 (Urut Acak)
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 font-bold font-mono mb-1.5">
                  Urutan Data Gardu
                </label>
                <select
                  value={config.sortMode || 'TGL_THEN_NOGD'}
                  onChange={(e) =>
                    onChangeConfig({
                      sortMode: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-[#141414] border border-white/20 focus:border-[#00FF66] outline-none cursor-pointer"
                >
                  <option value="TGL_THEN_NOGD">
                    TGL/BLN &amp; No. GD (A - Z)
                  </option>
                  <option value="NOGD_THEN_TGL">
                    No. GD (A - Z) &amp; TGL/BLN
                  </option>
                </select>
                <div className="text-[9px] font-mono text-[#00FF66]/80 mt-1">
                  Sesuai format PLN
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
