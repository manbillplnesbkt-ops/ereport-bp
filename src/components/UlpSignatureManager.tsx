import React, { useState, useMemo } from 'react';
import {
  ReportConfig,
  UlpSignatureItem,
  DEFAULT_KNOWN_ULPS,
  normalizeUlpKey,
  getSignatureForUlp,
  getUlpSignatureLabel,
} from '../types/trafo';
import {
  PenTool,
  Check,
  RotateCcw,
  Copy,
  Building2,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  Calendar,
  MapPin,
  UserCheck,
  FileCheck2,
  Sparkles,
  Search,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

const EXCLUDED_ULP_KEYS = new Set([
  'ULP BATUSANGKAR',
  'BATUSANGKAR',
  'ULP LIMA PULUH KOTA',
  'LIMA PULUH KOTA',
  'ULP PAYAKUMBUH',
  'PAYAKUMBUH',
]);

const CORE_PLN_ULPS = [
  'ULP BUKITTINGGI',
  'ULP BASO',
  'ULP PADANG PANJANG',
  'ULP LUBUK SIKAPING',
  'ULP LUBUK BASUNG',
  'ULP SIMPANG EMPAT',
  'ULP KOTO TUO',
];

interface UlpSignatureManagerProps {
  config: ReportConfig;
  onChangeConfig: (changes: Partial<ReportConfig>) => void;
  detectedUnits?: string[];
  isModal?: boolean;
  onClose?: () => void;
}

export const UlpSignatureManager: React.FC<UlpSignatureManagerProps> = ({
  config,
  onChangeConfig,
  detectedUnits = [],
  isModal = false,
  onClose,
}) => {
  // Mode tampilan: Kartu Terbuka atau Tabel Kompak (Keduanya LANGSUNG tampil tanpa dropdown)
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [previewUlpKey, setPreviewUlpKey] = useState<string>('ULP BUKITTINGGI');

  // Input aksi serentak (Batch)
  const [batchTanggal, setBatchTanggal] = useState<string>(config.tanggalCetak || '31 AGUSTUS 2026');
  const [batchPengatur, setBatchPengatur] = useState<string>(config.namaPengatur || '<<PENGATUR>>');
  const [batchTlTeknik, setBatchTlTeknik] = useState<string>(config.namaTlTeknik || '<<NAMA TL TEKNIK>>');

  const [newUlpName, setNewUlpName] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Daftar ULP terintegrasi: Core PLN + Detected Units dari Dataset + Custom Config
  const allUlpList = useMemo(() => {
    const map = new Map<string, UlpSignatureItem>();

    // 1. Masukkan default known ULPs (7 unit standar PLN diutamakan)
    DEFAULT_KNOWN_ULPS.forEach((item) => {
      map.set(item.ulpName, { ...item });
    });

    // 2. Masukkan unit yang otomatis terdeteksi dari dataset spreadsheet/CSV yang dimuat
    detectedUnits.forEach((unit) => {
      const norm = normalizeUlpKey(unit);
      if (norm && !map.has(norm)) {
        map.set(norm, {
          ulpName: norm,
          namaTlTeknik: config.namaTlTeknik || '<<NAMA TL TEKNIK>>',
          namaPengatur: config.namaPengatur || '<<PENGATUR>>',
          kota: norm.replace('ULP ', '').trim() || config.kota || 'BUKITTINGGI',
          tanggalCetak: config.tanggalCetak || '31 AGUSTUS 2026',
        });
      }
    });

    // 3. Terapkan data yang tersimpan di config.ulpSignatures
    if (config.ulpSignatures) {
      Object.entries(config.ulpSignatures).forEach(([key, val]: [string, UlpSignatureItem]) => {
        const norm = normalizeUlpKey(key);
        map.set(norm, {
          ulpName: val.ulpName || norm,
          namaTlTeknik: val.namaTlTeknik || config.namaTlTeknik || '<<NAMA TL TEKNIK>>',
          namaPengatur: val.namaPengatur || config.namaPengatur || '<<PENGATUR>>',
          kota: val.kota || config.kota || norm.replace('ULP ', ''),
          tanggalCetak: val.tanggalCetak || config.tanggalCetak || '31 AGUSTUS 2026',
        });
      });
    }

    return Array.from(map.values())
      .filter((item) => !EXCLUDED_ULP_KEYS.has(item.ulpName) && !EXCLUDED_ULP_KEYS.has(item.ulpName.replace('ULP ', '').trim()))
      .sort((a, b) => {
        const idxA = CORE_PLN_ULPS.indexOf(a.ulpName);
        const idxB = CORE_PLN_ULPS.indexOf(b.ulpName);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.ulpName.localeCompare(b.ulpName);
      });
  }, [detectedUnits, config.ulpSignatures, config.namaTlTeknik, config.namaPengatur, config.kota, config.tanggalCetak]);

  // Filter ULP berdasarkan pencarian cepat
  const filteredUlps = useMemo(() => {
    if (!searchFilter.trim()) return allUlpList;
    const q = searchFilter.toLowerCase();
    return allUlpList.filter(
      (u) =>
        u.ulpName.toLowerCase().includes(q) ||
        u.kota.toLowerCase().includes(q) ||
        u.namaTlTeknik.toLowerCase().includes(q) ||
        u.namaPengatur.toLowerCase().includes(q)
    );
  }, [allUlpList, searchFilter]);

  // Update data langsung pada ULP tertentu
  const handleUpdateField = (ulpKey: string, field: keyof UlpSignatureItem, value: string) => {
    const norm = normalizeUlpKey(ulpKey);
    const existing = config.ulpSignatures || {};
    const current = getSignatureForUlp(norm, config);
    const updatedItem: UlpSignatureItem = {
      ...current,
      [field]: value,
    };

    onChangeConfig({
      ulpSignatures: {
        ...existing,
        [norm]: updatedItem,
      },
    });
  };

  // Aksi Serentak: Terapkan nilai ke SEMUA ULP sekaligus
  const handleBatchApply = (type: 'TANGGAL' | 'PENGATUR' | 'TL_TEKNIK') => {
    const updatedMap: Record<string, UlpSignatureItem> = {};

    allUlpList.forEach((item) => {
      const current = getSignatureForUlp(item.ulpName, config);
      if (type === 'TANGGAL') {
        updatedMap[item.ulpName] = { ...current, tanggalCetak: batchTanggal };
      } else if (type === 'PENGATUR') {
        updatedMap[item.ulpName] = { ...current, namaPengatur: batchPengatur };
      } else if (type === 'TL_TEKNIK') {
        updatedMap[item.ulpName] = { ...current, namaTlTeknik: batchTlTeknik };
      }
    });

    const globalChanges: Partial<ReportConfig> = {
      ulpSignatures: updatedMap,
    };

    if (type === 'TANGGAL') {
      globalChanges.tanggalCetak = batchTanggal;
      showNotice(`Tanggal Cetak "${batchTanggal}" berhasil diterapkan ke SEMUA ULP!`);
    } else if (type === 'PENGATUR') {
      globalChanges.namaPengatur = batchPengatur;
      showNotice(`Nama Pengatur "${batchPengatur}" berhasil diterapkan ke SEMUA ULP!`);
    } else if (type === 'TL_TEKNIK') {
      globalChanges.namaTlTeknik = batchTlTeknik;
      showNotice(`Nama TL. Teknik "${batchTlTeknik}" berhasil diterapkan ke SEMUA ULP!`);
    }

    onChangeConfig(globalChanges);
  };

  // Salin seluruh isi satu ULP ke semua ULP lainnya
  const handleCopyOneToAll = (sourceUlp: UlpSignatureItem) => {
    const updatedMap: Record<string, UlpSignatureItem> = {};
    allUlpList.forEach((item) => {
      const current = getSignatureForUlp(item.ulpName, config);
      updatedMap[item.ulpName] = {
        ...current,
        namaTlTeknik: sourceUlp.namaTlTeknik,
        namaPengatur: sourceUlp.namaPengatur,
        tanggalCetak: sourceUlp.tanggalCetak,
      };
    });

    onChangeConfig({
      namaTlTeknik: sourceUlp.namaTlTeknik,
      namaPengatur: sourceUlp.namaPengatur,
      tanggalCetak: sourceUlp.tanggalCetak,
      ulpSignatures: updatedMap,
    });

    showNotice(`Format dari ${sourceUlp.ulpName} berhasil disalin ke SEMUA ULP lainnya!`);
  };

  // Kembalikan ke format standar PLN
  const handleResetToDefault = () => {
    const resetMap: Record<string, UlpSignatureItem> = {};
    DEFAULT_KNOWN_ULPS.forEach((item) => {
      resetMap[item.ulpName] = { ...item };
    });

    onChangeConfig({
      namaTlTeknik: '<<NAMA TL TEKNIK>>',
      namaPengatur: '<<PENGATUR>>',
      kota: 'BUKITTINGGI',
      tanggalCetak: '31 AGUSTUS 2026',
      ulpSignatures: resetMap,
    });
    showNotice('Pedoman pengesahan semua ULP berhasil dikembalikan ke standar awal PLN.');
  };

  // Tambah ULP Kustom baru
  const handleAddNewUlp = () => {
    if (!newUlpName.trim()) return;
    const norm = normalizeUlpKey(newUlpName);
    const existing = config.ulpSignatures || {};
    const newItem: UlpSignatureItem = {
      ulpName: norm,
      namaTlTeknik: config.namaTlTeknik || '<<NAMA TL TEKNIK>>',
      namaPengatur: config.namaPengatur || '<<PENGATUR>>',
      kota: norm.replace('ULP ', '').trim() || 'BUKITTINGGI',
      tanggalCetak: config.tanggalCetak || '31 AGUSTUS 2026',
    };

    onChangeConfig({
      ulpSignatures: {
        ...existing,
        [norm]: newItem,
      },
    });
    setPreviewUlpKey(norm);
    setNewUlpName('');
    showNotice(`${norm} berhasil ditambahkan dan langsung tampil di daftar!`);
  };

  // Hapus unit ULP dari daftar
  const handleDeleteUlp = (ulpName: string) => {
    const norm = normalizeUlpKey(ulpName);
    const existing = { ...(config.ulpSignatures || {}) };
    delete existing[norm];
    delete existing[ulpName];
    onChangeConfig({
      ulpSignatures: existing,
    });
    showNotice(`${norm} berhasil dihapus dari daftar pedoman tanda tangan.`);
  };

  // Item yang sedang aktif untuk pratinjau di bagian bawah
  const previewSignature = useMemo(() => {
    return getSignatureForUlp(previewUlpKey, config);
  }, [previewUlpKey, config]);

  return (
    <div className={`space-y-4 ${isModal ? 'p-6 bg-[#111111] text-white border border-white/20' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#00FF66]" />
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-[#00FF66] font-black">
              // Pedoman Pengesahan &amp; Tanda Tangan Terintegrasi (Semua ULP)
            </h3>
          </div>
          <p className="text-[11px] font-mono text-white/60 mt-0.5">
            Daftar seluruh ULP langsung tampil terbuka untuk pengisian data (TL. Teknik, Pengatur, Kota, Tanggal Cetak) tanpa perlu memilih dropdown.
          </p>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="CARI ULP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-7 pr-2.5 py-1 text-xs font-mono uppercase bg-black border border-white/20 text-white placeholder-white/30 focus:border-[#00FF66] outline-none w-36 sm:w-44"
            />
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-black/40 p-0.5 border border-white/15">
            <button
              onClick={() => setViewMode('CARDS')}
              title="Tampilkan dalam bentuk Kartu Lengkap Langsung Tampil"
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 ${
                viewMode === 'CARDS'
                  ? 'bg-[#00FF66] text-black font-black'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Kartu Langsung</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              title="Tampilkan dalam bentuk Tabel Spreadsheet Langsung Tampil"
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 ${
                viewMode === 'TABLE'
                  ? 'bg-[#00FF66] text-black font-black'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Tabel Langsung ({allUlpList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {successNotice && (
        <div className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/40 text-[#00FF66] text-xs font-mono flex items-center gap-2">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* BILAH AKSI CEPAT / ISI SERENTAK KE SEMUA ULP */}
      <div className="p-3 bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00FF66] uppercase font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>// Bilah Aksi Cepat / Isi Serentak Seluruh ULP:</span>
          </div>
          <button
            onClick={handleResetToDefault}
            className="px-2 py-0.5 text-[10px] font-mono text-white/50 hover:text-white hover:bg-white/10 border border-white/15 flex items-center gap-1 transition-colors"
            title="Kembalikan semua ULP ke standar bawaan PLN"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset Standar PLN</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          {/* Batch Tanggal */}
          <div className="flex items-center gap-1 bg-black/50 p-1.5 border border-white/10">
            <input
              type="text"
              value={batchTanggal}
              onChange={(e) => setBatchTanggal(e.target.value)}
              placeholder="31 AGUSTUS 2026"
              className="px-2 py-1 bg-black border border-white/20 text-white text-xs flex-1 outline-none focus:border-[#00FF66]"
            />
            <button
              onClick={() => handleBatchApply('TANGGAL')}
              className="px-2.5 py-1 bg-[#00FF66]/20 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-bold uppercase transition-colors text-[10px] whitespace-nowrap border border-[#00FF66]/30"
              title="Terapkan Tanggal ini ke semua ULP"
            >
              Set Tanggal Semua
            </button>
          </div>

          {/* Batch Pengatur */}
          <div className="flex items-center gap-1 bg-black/50 p-1.5 border border-white/10">
            <input
              type="text"
              value={batchPengatur}
              onChange={(e) => setBatchPengatur(e.target.value)}
              placeholder="<<PENGATUR>>"
              className="px-2 py-1 bg-black border border-white/20 text-white text-xs flex-1 outline-none focus:border-[#00FF66]"
            />
            <button
              onClick={() => handleBatchApply('PENGATUR')}
              className="px-2.5 py-1 bg-[#00FF66]/20 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-bold uppercase transition-colors text-[10px] whitespace-nowrap border border-[#00FF66]/30"
              title="Terapkan Nama Pengatur ini ke semua ULP"
            >
              Set Pengatur Semua
            </button>
          </div>

          {/* Batch TL Teknik */}
          <div className="flex items-center gap-1 bg-black/50 p-1.5 border border-white/10">
            <input
              type="text"
              value={batchTlTeknik}
              onChange={(e) => setBatchTlTeknik(e.target.value)}
              placeholder="<<NAMA TL TEKNIK>>"
              className="px-2 py-1 bg-black border border-white/20 text-white text-xs flex-1 outline-none focus:border-[#00FF66]"
            />
            <button
              onClick={() => handleBatchApply('TL_TEKNIK')}
              className="px-2.5 py-1 bg-[#00FF66]/20 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-bold uppercase transition-colors text-[10px] whitespace-nowrap border border-[#00FF66]/30"
              title="Terapkan Nama TL. Teknik ini ke semua ULP"
            >
              Set TL. Teknik Semua
            </button>
          </div>
        </div>
      </div>

      {/* DAFTAR LANGSUNG TAMPIL (MODE 1: GRID KARTU LENGKAP LANGSUNG TAMPIL) */}
      {viewMode === 'CARDS' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredUlps.map((ulp, idx) => {
              const sig = getSignatureForUlp(ulp.ulpName, config);
              const isDetectedFromData = detectedUnits.some(
                (du) => normalizeUlpKey(du) === ulp.ulpName
              );
              const isCurrentlyPreviewed = previewUlpKey === ulp.ulpName;

              return (
                <div
                  key={ulp.ulpName}
                  className={`p-4 bg-[#141414] border transition-all ${
                    isCurrentlyPreviewed
                      ? 'border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.15)] ring-1 ring-[#00FF66]/40'
                      : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  {/* Card Header: Unit Name & Badges */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 mb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-white/40">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-mono font-black uppercase text-[#00FF66] tracking-wider">
                          {ulp.ulpName}
                        </h4>
                        {isDetectedFromData && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/30 uppercase font-bold">
                            Terdeteksi Dari Data
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-white/50 mt-0.5">
                        Kop: PT. PLN (Persero) {getUlpSignatureLabel(ulp.ulpName)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyOneToAll(sig)}
                        title="Salin tanggal, TL teknik, dan pengatur unit ini ke semua ULP lainnya"
                        className="p-1 text-white/50 hover:text-[#00FF66] hover:bg-white/5 border border-white/10 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!CORE_PLN_ULPS.includes(ulp.ulpName) && (
                        <button
                          onClick={() => handleDeleteUlp(ulp.ulpName)}
                          title="Hapus unit ULP ini dari daftar"
                          className="p-1 text-white/40 hover:text-red-400 hover:bg-white/5 border border-white/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewUlpKey(ulp.ulpName)}
                        title="Tampilkan Pratinjau Tanda Tangan ULP ini di bagian bawah"
                        className={`px-2 py-1 text-[10px] font-mono uppercase font-bold flex items-center gap-1 border transition-colors ${
                          isCurrentlyPreviewed
                            ? 'bg-[#00FF66] text-black border-[#00FF66]'
                            : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Editable Fields Directly on the Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                    {/* TL Teknik */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#00FF66]" />
                        <span>TL. Teknik (Menyetujui)</span>
                      </label>
                      <input
                        type="text"
                        value={sig.namaTlTeknik}
                        onChange={(e) =>
                          handleUpdateField(ulp.ulpName, 'namaTlTeknik', e.target.value)
                        }
                        placeholder="<<NAMA TL TEKNIK>>"
                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* Pengatur */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1 flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3 text-[#00FF66]" />
                        <span>Nama Pengatur</span>
                      </label>
                      <input
                        type="text"
                        value={sig.namaPengatur}
                        onChange={(e) =>
                          handleUpdateField(ulp.ulpName, 'namaPengatur', e.target.value)
                        }
                        placeholder="<<PENGATUR>>"
                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* Kota */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00FF66]" />
                        <span>Kota Pengesahan</span>
                      </label>
                      <input
                        type="text"
                        value={sig.kota}
                        onChange={(e) =>
                          handleUpdateField(ulp.ulpName, 'kota', e.target.value)
                        }
                        placeholder="BUKITTINGGI"
                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* Tanggal Cetak */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-white/60 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#00FF66]" />
                        <span>Tanggal Cetak</span>
                      </label>
                      <input
                        type="text"
                        value={sig.tanggalCetak}
                        onChange={(e) =>
                          handleUpdateField(ulp.ulpName, 'tanggalCetak', e.target.value)
                        }
                        placeholder="31 AGUSTUS 2026"
                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAFTAR LANGSUNG TAMPIL (MODE 2: TABEL INPUT LANGSUNG TAMPIL) */}
      {viewMode === 'TABLE' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-white/15 bg-black max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#161616] z-10 border-b border-white/20 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-3 py-2.5 text-white/60">No</th>
                  <th className="px-3 py-2.5 text-white/80">Unit ULP</th>
                  <th className="px-3 py-2.5 text-white/80">Kop Surat</th>
                  <th className="px-3 py-2.5 text-[#00FF66]">TL. Teknik (Kiri)</th>
                  <th className="px-3 py-2.5 text-[#00FF66]">Pengatur (Kanan)</th>
                  <th className="px-3 py-2.5 text-white/80">Kota</th>
                  <th className="px-3 py-2.5 text-white/80">Tanggal Cetak</th>
                  <th className="px-3 py-2.5 text-center text-white/60">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUlps.map((ulp, idx) => {
                  const sig = getSignatureForUlp(ulp.ulpName, config);
                  const isCurrentlyPreviewed = previewUlpKey === ulp.ulpName;
                  const isDetectedFromData = detectedUnits.some(
                    (du) => normalizeUlpKey(du) === ulp.ulpName
                  );

                  return (
                    <tr
                      key={ulp.ulpName}
                      className={`hover:bg-white/5 transition-colors ${
                        isCurrentlyPreviewed ? 'bg-[#00FF66]/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-white/50 text-[10px]">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#00FF66]">{ulp.ulpName}</span>
                          {isDetectedFromData && (
                            <span className="text-[8px] px-1 py-0.2 bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/30">
                              DATA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-white/70 text-[11px] whitespace-nowrap">
                        PT. PLN (Persero) {getUlpSignatureLabel(ulp.ulpName)}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={sig.namaTlTeknik}
                          onChange={(e) =>
                            handleUpdateField(ulp.ulpName, 'namaTlTeknik', e.target.value)
                          }
                          className="w-full min-w-[150px] px-2 py-1 bg-black/60 border border-white/20 focus:border-[#00FF66] text-white text-xs outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={sig.namaPengatur}
                          onChange={(e) =>
                            handleUpdateField(ulp.ulpName, 'namaPengatur', e.target.value)
                          }
                          className="w-full min-w-[130px] px-2 py-1 bg-black/60 border border-white/20 focus:border-[#00FF66] text-white text-xs outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={sig.kota}
                          onChange={(e) =>
                            handleUpdateField(ulp.ulpName, 'kota', e.target.value)
                          }
                          className="w-full min-w-[110px] px-2 py-1 bg-black/60 border border-white/20 focus:border-[#00FF66] text-white text-xs outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={sig.tanggalCetak}
                          onChange={(e) =>
                            handleUpdateField(ulp.ulpName, 'tanggalCetak', e.target.value)
                          }
                          className="w-full min-w-[130px] px-2 py-1 bg-black/60 border border-white/20 focus:border-[#00FF66] text-white text-xs outline-none"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCopyOneToAll(sig)}
                            title="Salin data baris ini ke semua ULP lain"
                            className="p-1 text-white/50 hover:text-[#00FF66] hover:bg-white/10"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {!CORE_PLN_ULPS.includes(ulp.ulpName) && (
                            <button
                              onClick={() => handleDeleteUlp(ulp.ulpName)}
                              title="Hapus unit ULP ini dari daftar"
                              className="p-1 text-white/40 hover:text-red-400 hover:bg-white/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => setPreviewUlpKey(ulp.ulpName)}
                            className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-colors ${
                              isCurrentlyPreviewed
                                ? 'bg-[#00FF66] text-black font-black'
                                : 'bg-white/10 text-white/70 hover:text-white'
                            }`}
                          >
                            Preview
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tambah Unit ULP Kustom Tambahan */}
      <div className="p-3 bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-white/70 font-bold">
            + Tambah Unit ULP Lain:
          </span>
          <input
            type="text"
            value={newUlpName}
            onChange={(e) => setNewUlpName(e.target.value)}
            placeholder="Contoh: ULP LEMBAH ANAI"
            className="px-2.5 py-1.5 bg-black border border-white/20 text-white text-xs font-mono outline-none focus:border-[#00FF66] w-56"
          />
          <button
            onClick={handleAddNewUlp}
            disabled={!newUlpName.trim()}
            className="px-3 py-1.5 bg-[#00FF66] text-black font-mono font-bold text-xs uppercase hover:bg-white transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah ke Daftar</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-white/40">
          Total {allUlpList.length} Unit ULP Terdaftar Siap Dicetak ke Excel
        </span>
      </div>

      {/* LIVE PRATINJAU TANDA TANGAN AKHIR TABEL (SESUAI PEDOMAN PLN) */}
      <div className="p-4 bg-[#0D0D0D] border border-white/15">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#00FF66] font-bold">
              // Pratinjau Tanda Tangan Akhir Tabel: {previewSignature.ulpName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/50 uppercase">
            Tercetak Otomatis pada Lembar Kerja Excel Penyulang Terkait
          </span>
        </div>

        {/* Kotak Format Resmi TTD Standar PLN */}
        <div className="bg-white text-black p-6 rounded-xs font-sans shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-2 gap-8">
            {/* Sisi Kiri: Menyetujui */}
            <div className="text-center w-72 space-y-1">
              <p className="text-xs text-slate-800">Menyetujui,</p>
              <p className="text-xs text-slate-900 font-semibold">
                PT. PLN (Persero) {getUlpSignatureLabel(previewSignature.ulpName)}
              </p>
              <p className="text-xs text-slate-800">TL. Teknik</p>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                [ Ruang Tanda Tangan &amp; Cap Stempel Resmi ]
              </div>
              <p className="text-sm font-bold text-black tracking-wider uppercase">
                {previewSignature.namaTlTeknik || '<<NAMA TL TEKNIK>>'}
              </p>
            </div>

            {/* Sisi Kanan: Pengatur */}
            <div className="text-center w-72 space-y-1">
              <p className="text-xs text-slate-900 font-semibold">
                {previewSignature.kota || 'BUKITTINGGI'}, {previewSignature.tanggalCetak || '31 AGUSTUS 2026'}
              </p>
              <p className="text-xs text-slate-800">PLN Electricity services</p>
              <p className="text-xs text-slate-800">Pengatur</p>
              <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                [ Ruang Tanda Tangan &amp; Cap Stempel Resmi ]
              </div>
              <p className="text-sm font-bold text-black tracking-wider uppercase">
                {previewSignature.namaPengatur || '<<PENGATUR>>'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Close Button if opened in dialog */}
      {isModal && onClose && (
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00FF66] text-black font-mono font-black text-xs uppercase hover:bg-white transition-colors"
          >
            Selesai &amp; Simpan
          </button>
        </div>
      )}
    </div>
  );
};
