import React, { useState, useMemo } from 'react';
import {
  RawTrafoRecord,
  ReportConfig,
  formatUlpName,
  compareTanggalAndNoGardu,
  SortOrderMode,
} from '../types/trafo';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  Info,
  FileSpreadsheet,
  Layers,
  Clock,
  ArrowUpDown,
  Shuffle,
} from 'lucide-react';

interface DataTablePreviewProps {
  records: RawTrafoRecord[];
  config: ReportConfig;
  onChangeConfig?: (changes: Partial<ReportConfig>) => void;
  onReassignTimes?: () => void;
  onExportExcel?: () => void;
  isDownloading?: boolean;
}

export const DataTablePreview: React.FC<DataTablePreviewProps> = ({
  records,
  config,
  onChangeConfig,
  onReassignTimes,
  onExportExcel,
  isDownloading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFeeders, setExpandedFeeders] = useState<Record<string, boolean>>({});
  const [activeSheetTab, setActiveSheetTab] = useState<string>('ALL');

  const currentSortMode: SortOrderMode = config.sortMode || 'TGL_THEN_NOGD';

  // Filter records & sort per No GD dari kecil ke besar ( A - Z ) dan TGL/BLN
  const filtered = useMemo(() => {
    const list = records.filter((r) => {
      const matchFeeder =
        config.selectedFeeder === 'ALL' || r.feeder === config.selectedFeeder;
      const matchUnit =
        config.selectedUnit === 'ALL' || r.unit === config.selectedUnit;

      if (!matchFeeder || !matchUnit) return false;

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.noGardu.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q) ||
        r.feeder.toLowerCase().includes(q) ||
        (r.keterangan && r.keterangan.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => compareTanggalAndNoGardu(a, b, currentSortMode));
  }, [records, config.selectedFeeder, config.selectedUnit, searchTerm, currentSortMode]);

  // Group by Feeder and sort each group per No GD (A - Z) dan TGL/BLN
  const groupedByFeeder = useMemo(() => {
    const groups: { [key: string]: RawTrafoRecord[] } = {};
    filtered.forEach((item) => {
      const fKey = item.feeder || 'FEEDER UTAMA';
      if (!groups[fKey]) {
        groups[fKey] = [];
      }
      groups[fKey].push(item);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => compareTanggalAndNoGardu(a, b, currentSortMode));
    });
    return groups;
  }, [filtered, currentSortMode]);

  const feederKeys = useMemo(() => Object.keys(groupedByFeeder), [groupedByFeeder]);

  const displayedFeeders = useMemo(() => {
    if (activeSheetTab === 'ALL') {
      return Object.entries(groupedByFeeder) as [string, RawTrafoRecord[]][];
    }
    if (groupedByFeeder[activeSheetTab]) {
      return [[activeSheetTab, groupedByFeeder[activeSheetTab]]] as [string, RawTrafoRecord[]][];
    }
    return Object.entries(groupedByFeeder) as [string, RawTrafoRecord[]][];
  }, [activeSheetTab, groupedByFeeder]);

  // ULP diambil dari Spreadsheet kolom Unit Description
  const currentUlpTitle = useMemo(() => {
    if (config.selectedUnit && config.selectedUnit !== 'ALL') {
      return formatUlpName(config.selectedUnit);
    }
    if (activeSheetTab !== 'ALL' && groupedByFeeder[activeSheetTab]?.[0]?.unit) {
      return formatUlpName(groupedByFeeder[activeSheetTab][0].unit);
    }
    const unitFromRow = filtered.find((r) => r.unit && r.unit.trim() !== '')?.unit;
    if (unitFromRow) {
      return formatUlpName(unitFromRow);
    }
    return config.ulpUnit || 'ULP BUKITTINGGI';
  }, [config.selectedUnit, config.ulpUnit, activeSheetTab, groupedByFeeder, filtered]);

  const toggleFeeder = (feeder: string) => {
    setExpandedFeeders((prev) => ({
      ...prev,
      [feeder]: prev[feeder] !== undefined ? !prev[feeder] : false, // default expanded
    }));
  };

  return (
    <div className="bg-[#141414] border border-white/10 rounded-none overflow-hidden flex flex-col">
      {/* Table Toolbar matching Bold Typography Live Output Preview */}
      <div className="p-4 sm:p-5 bg-[#0F0F0F] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white font-display">
            Live Output Preview
          </h2>
          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 bg-white/10 text-[#00FF66] border border-white/15 font-bold">
            {filtered.length} Gardu ({currentSortMode === 'TGL_THEN_NOGD' ? 'TGL/BLN + No. GD' : 'No. GD + TGL/BLN'})
          </span>

          {/* Quick Sort Mode Toggle */}
          {onChangeConfig && (
            <button
              onClick={() =>
                onChangeConfig({
                  sortMode:
                    currentSortMode === 'TGL_THEN_NOGD' ? 'NOGD_THEN_TGL' : 'TGL_THEN_NOGD',
                })
              }
              title="Ganti Urutan Penyortiran: TGL/BLN & No. GD vs No. GD & TGL/BLN"
              className="px-2.5 py-1 text-[11px] font-mono uppercase font-bold bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3 h-3 text-[#00FF66]" />
              <span>
                Urut: {currentSortMode === 'TGL_THEN_NOGD' ? 'TGL/BLN & No. GD' : 'No. GD & TGL/BLN'}
              </span>
            </button>
          )}

          {/* Re-randomize sequential times button */}
          {onReassignTimes && (
            <button
              onClick={onReassignTimes}
              title="Acak ulang jam pengukuran Siang (10:00 s/d 18:00) & Malam (19:00 s/d 23:00) secara urut acak menaik per tanggal"
              className="px-2.5 py-1 text-[11px] font-mono uppercase font-bold bg-white/5 hover:bg-[#00FF66]/10 text-white/80 hover:text-[#00FF66] border border-white/20 hover:border-[#00FF66]/40 flex items-center gap-1.5 transition-colors"
            >
              <Shuffle className="w-3 h-3 text-[#00FF66]" />
              <span>Acak Ulang Jam (10-18 &amp; 19-23)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="CARI GARDU / LOKASI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs font-mono uppercase bg-white/5 border border-white/20 text-white placeholder-white/30 focus:border-[#00FF66] outline-none transition-colors w-52 sm:w-64"
            />
          </div>

          {/* Window control dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
          </div>
        </div>
      </div>

      {/* Feeder Sheet Tabs bar (Multi-sheet Excel Preview) */}
      <div className="bg-[#0B0B0B] px-4 py-2 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 uppercase pr-2 border-r border-white/10 mr-1 shrink-0">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF66]" />
          <span>Sheet Excel ({feederKeys.length}):</span>
        </div>
        <button
          onClick={() => setActiveSheetTab('ALL')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all shrink-0 flex items-center gap-1.5 ${
            activeSheetTab === 'ALL'
              ? 'bg-[#00FF66] text-black shadow-sm font-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Semua Sheet</span>
          <span className={`text-[10px] px-1 py-0.2 font-mono ${activeSheetTab === 'ALL' ? 'bg-black/20 text-black' : 'text-white/50'}`}>
            ({filtered.length})
          </span>
        </button>
        {feederKeys.map((fName) => {
          const count = groupedByFeeder[fName]?.length || 0;
          const isActive = activeSheetTab === fName;
          return (
            <button
              key={fName}
              onClick={() => setActiveSheetTab(fName)}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#00FF66] text-black shadow-sm font-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <span>{fName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono ${isActive ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/60'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Excel Sheet Simulation Canvas */}
      <div className="p-4 sm:p-6 overflow-x-auto bg-[#0A0A0A] max-h-[75vh]">
        <div className="min-w-[1280px] bg-white text-black p-8 border border-black/10 shadow-2xl font-sans text-xs">
          {/* Sheet Header block */}
          <div className="text-center mb-6">
            <h1 className="text-base sm:text-lg font-black text-black tracking-tight uppercase font-display">
              {config.judul || 'HASIL PENGUKURAN BEBAN DAN TEGANGAN (PUNCAK) TRAFO DISTRIBUSI'}
            </h1>
            <h2 className="text-xs sm:text-sm font-black text-neutral-800 uppercase mt-1 tracking-wider font-mono">
              {config.bulanTahun || 'BULAN AGUSTUS 2026'}
            </h2>
            <h3 className="text-xs sm:text-sm font-black text-neutral-800 uppercase font-mono">
              {currentUlpTitle}
            </h3>
          </div>

          {/* Main Table */}
          <table className="w-full border-collapse border border-slate-900 text-slate-900 text-[11px]">
            {/* Header Row 1 */}
            <thead>
              <tr className="bg-[#F1F1F1] text-center font-bold">
                <th
                  rowSpan={3}
                  className="border border-slate-900 px-2 py-1.5 w-10 align-middle"
                >
                  NO.
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-900 px-2 py-1 align-middle"
                >
                  PHBTR
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-900 px-2 py-1.5 w-16 align-middle"
                >
                  DAYA
                  <br />
                  TRAFO
                  <br />
                  (kVA)
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-900 px-2 py-1 align-middle"
                >
                  WAKTU PENGUKURAN
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-900 px-1 py-1.5 w-9 align-middle"
                >
                  Jur.
                </th>
                <th
                  colSpan={10}
                  className="border border-slate-900 px-2 py-1 align-middle bg-[#D9E1F2]"
                >
                  HASIL PENGUKURAN BEBAN DAN TEGANGAN SIANG
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-900 px-2 py-1.5 w-12 align-middle"
                >
                  J A M
                </th>
                <th
                  rowSpan={3}
                  className="border border-slate-900 px-1 py-1.5 w-9 align-middle"
                >
                  Jur.
                </th>
                <th
                  colSpan={10}
                  className="border border-slate-900 px-2 py-1 align-middle bg-[#D9E1F2]"
                >
                  HASIL PENGUKURAN BEBAN DAN TEGANGAN MALAM
                </th>
              </tr>

              {/* Header Row 2 */}
              <tr className="bg-slate-50 text-center font-bold">
                <th
                  rowSpan={2}
                  className="border border-slate-900 px-2 py-1 w-14 align-middle"
                >
                  No GD
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-900 px-2 py-1 w-28 align-middle"
                >
                  LOKASI
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-900 px-2 py-1 w-20 align-middle"
                >
                  TGL / BLN
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-900 px-1 py-1 w-12 align-middle"
                >
                  J A M
                </th>

                {/* Malam Group Subheaders */}
                <th
                  colSpan={4}
                  className="border border-slate-900 px-1 py-0.5 bg-[#D9E1F2]"
                >
                  BEBAN ( A )
                </th>
                <th
                  colSpan={6}
                  className="border border-slate-900 px-1 py-0.5 bg-[#D9E1F2]"
                >
                  TEGANGAN ( VOLT )
                </th>

                {/* Siang Group Subheaders */}
                <th
                  colSpan={4}
                  className="border border-slate-900 px-1 py-0.5 bg-[#D9E1F2]"
                >
                  BEBAN ( A )
                </th>
                <th
                  colSpan={6}
                  className="border border-slate-900 px-1 py-0.5 bg-[#D9E1F2]"
                >
                  TEGANGAN ( VOLT )
                </th>
              </tr>

              {/* Header Row 3 */}
              <tr className="bg-slate-50 text-center text-[10px] font-bold">
                {/* Malam cols */}
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">R</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">S</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">T</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">R - S</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">S - T</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">T - R</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">R - N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">S - N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">T - N</th>

                {/* Siang cols */}
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">R</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">S</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">T</th>
                <th className="border border-slate-900 w-8 py-1 bg-[#D9E1F2]">N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">R - S</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">S - T</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">T - R</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">R - N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">S - N</th>
                <th className="border border-slate-900 w-9 py-1 bg-[#D9E1F2]">T - N</th>
              </tr>
            </thead>

            {/* Table Body grouped by Feeder */}
            <tbody>
              {displayedFeeders.length === 0 ? (
                <tr>
                  <td
                    colSpan={29}
                    className="border border-slate-900 py-8 text-center text-slate-500 font-medium"
                  >
                    Tidak ada data gardu yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                displayedFeeders.map(([feederName, items]) => {
                  const isCollapsed = expandedFeeders[feederName] === false;

                  return (
                    <React.Fragment key={feederName}>
                      {/* Feeder Divider Banner */}
                      <tr
                        onClick={() => toggleFeeder(feederName)}
                        className="bg-[#222222] text-white hover:bg-black cursor-pointer transition-colors select-none font-black text-xs uppercase tracking-widest"
                      >
                        <td
                          colSpan={29}
                          className="border border-slate-900 py-2 px-3 text-center"
                        >
                          <div className="flex items-center justify-center gap-2.5">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-[#00FF66]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#00FF66]" />
                            )}
                            <span className="font-display">FEEDER // {feederName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 text-[#00FF66] font-bold">
                              {items.length} GARDU
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Gardu Rows under this feeder */}
                      {!isCollapsed &&
                        items.map((rec, itemIdx) => {
                          const currentNo = itemIdx + 1;
                          const hasJur4 = Boolean(
                            rec.r4 || rec.s4 || rec.t4 || rec.n4 ||
                            rec.siangR4 || rec.siangS4 || rec.siangT4 || rec.siangN4
                          );
                          // Standard requested: Jurusan REL, I, II, III (total 4 rows per gardu)
                          // Jurusan IV is added as row 5 if available
                          const totalJurRows = hasJur4 ? 4 : 3;

                          // Helper to format values cleanly
                          const fmt = (v: any) => {
                            if (v === undefined || v === null || v === '') return '';
                            return String(v);
                          };

                          return (
                            <React.Fragment key={rec.id}>
                              {/* Row 1: REL */}
                              <tr className="hover:bg-amber-50/40">
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center font-bold align-middle bg-white"
                                >
                                  {currentNo}
                                </td>
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center font-bold align-middle bg-white font-mono"
                                >
                                  {rec.noGardu}
                                </td>
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-left px-2 align-middle bg-white truncate max-w-[140px]"
                                  title={rec.unit}
                                >
                                  {rec.unit}
                                </td>
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center align-middle bg-white"
                                >
                                  {rec.kvaGardu}
                                </td>
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center align-middle bg-white whitespace-nowrap"
                                >
                                  {rec.tanggal}
                                </td>
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center align-middle bg-white"
                                >
                                  {rec.jamSiang || config.defaultJamSiang || '10:00'}
                                </td>

                                {/* Jur. Siang: REL - Sheet TEMUAN GARDU TIER 1 DAN TIER 1& */}
                                <td className="border border-slate-900 text-center font-bold bg-slate-100">
                                  REL
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangRInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangSInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangTInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangNInduk)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangRs)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangRt)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangSt)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangRn)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangSn)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.siangTn)}
                                </td>
                                
                                {/* Jam Malam */}
                                <td
                                  rowSpan={totalJurRows + 1}
                                  className="border border-slate-900 text-center align-middle bg-white"
                                >
                                  {rec.jamMalam || config.defaultJamMalam || '19:00'}
                                </td>

                                {/* Jur. Malam: REL - Sheet BEBAN PUNCAK GARDU */}
                                <td className="border border-slate-900 text-center font-bold bg-slate-100">
                                  REL
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.rInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.sInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.tInduk)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.nInduk)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.rs)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.rt)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.st)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.rn)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.sn)}
                                </td>
                                <td className="border border-slate-900 text-center">
                                  {fmt(rec.tn)}
                                </td>
                              </tr>

                              {/* Row 2: Jurusan I */}
                              <tr className="hover:bg-amber-50/40">
                                <td className="border border-slate-900 text-center font-medium">
                                  I
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangR1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangS1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangT1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangN1)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>

                                <td className="border border-slate-900 text-center font-medium">
                                  I
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.r1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.s1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.t1)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.n1)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                              </tr>

                              {/* Row 3: Jurusan II */}
                              <tr className="hover:bg-amber-50/40">
                                <td className="border border-slate-900 text-center font-medium">
                                  II
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangR2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangS2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangT2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangN2)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>

                                <td className="border border-slate-900 text-center font-medium">
                                  II
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.r2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.s2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.t2)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.n2)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                              </tr>

                              {/* Row 4: Jurusan III */}
                              <tr className="hover:bg-amber-50/40">
                                <td className="border border-slate-900 text-center font-medium">
                                  III
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangR3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangS3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangT3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                  {fmt(rec.siangN3)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>

                                <td className="border border-slate-900 text-center font-medium">
                                  III
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.r3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.s3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.t3)}
                                </td>
                                <td className="border border-slate-900 text-right px-1">
                                  {fmt(rec.n3)}
                                </td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                                <td className="border border-slate-900 text-center"></td>
                              </tr>

                              {/* Row 5: Jurusan IV if available */}
                              {hasJur4 && (
                                <tr className="hover:bg-amber-50/40">
                                  <td className="border border-slate-900 text-center font-medium">
                                    IV
                                  </td>
                                  <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                    {fmt(rec.siangR4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                    {fmt(rec.siangS4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                    {fmt(rec.siangT4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1 font-mono text-slate-800">
                                    {fmt(rec.siangN4)}
                                  </td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>

                                  <td className="border border-slate-900 text-center font-medium">
                                    IV
                                  </td>
                                  <td className="border border-slate-900 text-right px-1">
                                    {fmt(rec.r4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1">
                                    {fmt(rec.s4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1">
                                    {fmt(rec.t4)}
                                  </td>
                                  <td className="border border-slate-900 text-right px-1">
                                    {fmt(rec.n4)}
                                  </td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                  <td className="border border-slate-900 text-center"></td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
