import { useState, useRef, useCallback } from 'react';
import Toast from '../components/Toast';

interface ProcessedRow {
  stt: number;
  sku: string;
  name: string;
  spec: string;
  quantity: number;
  cartonPct: string;
  loosePct: string;
  cartonQty: number;
  looseQty: number;
  finalSku: string;
  status: 'success' | 'error';
  statusText: string;
}

// Demo data matching Stitch design
const DEMO_DATA: ProcessedRow[] = [
  { stt: 1, sku: 'SP-LAVIE-500ML', name: 'Nước khoáng thiên nhiên LaVie 500ml', spec: '24 chai/thùng', quantity: 2400, cartonPct: '100%', loosePct: '0%', cartonQty: 100, looseQty: 0, finalSku: 'HAR-LAVIE-500-CTN', status: 'success', statusText: 'Thành công' },
  { stt: 2, sku: 'SP-MILO-180ML', name: 'Sữa lúa mạch Milo ít đường 180ml', spec: '48 hộp/thùng', quantity: 1452, cartonPct: '99.17%', loosePct: '0.83%', cartonQty: 30, looseQty: 12, finalSku: 'HAR-MILO-180-MIX', status: 'success', statusText: 'Đã khớp SKU' },
  { stt: 3, sku: 'ERR-COCA-330', name: 'Nước ngọt có gas Coca-Cola lon 330ml', spec: '0 chai/thùng', quantity: 500, cartonPct: '--', loosePct: '--', cartonQty: 0, looseQty: 500, finalSku: 'CHUA_MAPPING_V2', status: 'error', statusText: 'Lỗi quy cách' },
  { stt: 4, sku: 'SP-TH-TRUEMILK-1L', name: 'Sữa tươi TH true MILK nguyên chất 1L', spec: '12 hộp/thùng', quantity: 1200, cartonPct: '100%', loosePct: '0%', cartonQty: 100, looseQty: 0, finalSku: 'HAR-TH-1L-CTN', status: 'success', statusText: 'Thành công' },
  { stt: 5, sku: 'SP-CHINSU-250G', name: 'Tương ớt cay nồng Chin-su 250g', spec: '24 chai/thùng', quantity: 3618, cartonPct: '99.50%', loosePct: '0.50%', cartonQty: 150, looseQty: 18, finalSku: 'HAR-CHINSU-250-MIX', status: 'success', statusText: 'Đã khớp SKU' },
  { stt: 6, sku: 'ERR-OMACHI-S2', name: 'Mì khoai tây Omachi sốt bò hầm', spec: '30 gói/thùng', quantity: -15, cartonPct: '--', loosePct: '--', cartonQty: 0, looseQty: -15, finalSku: 'SL_AM_KHONG_HOP_LE', status: 'error', statusText: 'Số lượng âm' },
  { stt: 7, sku: 'SP-AQUAFINA-500', name: 'Nước tinh khiết Aquafina 500ml', spec: '28 chai/thùng', quantity: 2800, cartonPct: '100%', loosePct: '0%', cartonQty: 100, looseQty: 0, finalSku: 'HAR-AQUA-500-CTN', status: 'success', statusText: 'Thành công' },
  { stt: 8, sku: 'ERR-UNK-OISHI-P9', name: 'Snack Oishi tôm cay đặc biệt 40g', spec: '80 gói/thùng', quantity: 640, cartonPct: '--', loosePct: '--', cartonQty: 8, looseQty: 0, finalSku: 'SKU_CHUA_MAPPING', status: 'error', statusText: 'SKU chưa mapping' },
];

export default function ExcelPage() {
  const [viewState, setViewState] = useState<'upload' | 'results'>('upload');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, title: '', description: '', type: 'success' as 'success' | 'error' | 'info' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, title, description, type });
  };

  const handleFileSelect = useCallback((file: File) => {
    showToast('Đã nhận file', `Tệp "${file.name}" đang được xử lý...`, 'info');
    setTimeout(() => {
      setViewState('results');
      showToast('Xử lý hoàn tất', `Đã phân tích ${DEMO_DATA.length} dòng dữ liệu.`);
    }, 800);
  }, []);

  const filteredData = DEMO_DATA.filter((row) => {
    const matchStatus = filterStatus === 'all' || row.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || row.sku.toLowerCase().includes(q) || row.name.toLowerCase().includes(q) || row.finalSku.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const successCount = DEMO_DATA.filter((r) => r.status === 'success').length;
  const errorCount = DEMO_DATA.filter((r) => r.status === 'error').length;
  const totalCartons = DEMO_DATA.filter((r) => r.status === 'success').reduce((s, r) => s + r.cartonQty, 0);
  const totalLoose = DEMO_DATA.filter((r) => r.status === 'success').reduce((s, r) => s + r.looseQty, 0);

  return (
    <div className="flex flex-col w-full">
      {/* Sub-bar with state switcher */}
      <section className="w-full bg-surface-container-low shadow-sm rounded-xl mb-space-lg p-space-md animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-xl shadow-sm">
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Đang xử lý cho:</span>
              <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-lg bg-primary-container text-on-primary font-semibold text-[14px]">
                <span className="material-symbols-outlined text-[16px]">warehouse</span>
                <span>Kho mặc định</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="bg-surface-container-high p-1 rounded-full flex items-center shadow-inner">
              <button
                className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-full text-label-md transition-all duration-200 ${
                  viewState === 'upload'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setViewState('upload')}
              >
                <span className="material-symbols-outlined text-[17px]">upload_file</span>
                <span>Tải lên file</span>
              </button>
              <button
                className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-full text-label-md transition-all duration-200 ${
                  viewState === 'results'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setViewState('results')}
              >
                <span className="material-symbols-outlined text-[17px]">analytics</span>
                <span>Kết quả xử lý</span>
                <span className="px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                  {DEMO_DATA.length.toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATE 1: UPLOAD ========== */}
      {viewState === 'upload' && (
        <div className="flex flex-col gap-space-lg animate-fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* Drop Zone */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-xl shadow-md flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div
              className="group cursor-pointer w-full max-w-4xl py-space-xl px-space-lg rounded-2xl bg-surface-container-low/70 hover:bg-surface-container-high/60 transition-all duration-200 flex flex-col items-center text-center shadow-inner relative"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
            >
              {/* Excel Icon */}
              <div className="relative mb-space-md transform group-hover:scale-105 transition-transform duration-300">
                <div className="w-24 h-28 bg-secondary/20 rounded-xl absolute -top-2 -right-2 transform rotate-6"></div>
                <div className="w-24 h-28 bg-surface-container-lowest rounded-xl shadow-md flex flex-col items-center justify-between p-2.5 relative">
                  <div className="w-full flex items-center justify-between">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <span className="text-label-sm text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant">XLSX</span>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[28px]">description</span>
                  </div>
                  <div className="w-full flex flex-col gap-1 px-1">
                    <div className="h-1 bg-surface-container-highest rounded-full w-full"></div>
                    <div className="h-1 bg-surface-container-highest rounded-full w-3/4"></div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2 bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </div>
              </div>

              <h2 className="font-semibold text-headline-md text-on-surface mb-space-xs tracking-tight">
                Kéo file Excel vào đây hoặc click để chọn
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-md mb-space-lg">
                Chỉ chấp nhận tệp định dạng <span className="font-semibold text-on-surface font-mono">.xlsx</span> (Dung lượng tối đa 25MB)
              </p>

              <div className="flex items-center gap-space-md">
                <button className="bg-primary-container hover:bg-primary text-on-primary px-space-xl py-space-md rounded-xl font-semibold text-headline-sm shadow-md flex items-center gap-space-sm transition-all transform active:scale-95" type="button">
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  <span>Chọn file từ máy tính</span>
                </button>
                <button
                  className="bg-surface-container-highest hover:bg-surface-container text-on-surface px-space-lg py-space-md rounded-xl font-semibold text-[14px] transition-all shadow-sm"
                  onClick={(e) => { e.stopPropagation(); setViewState('results'); }}
                  type="button"
                >
                  Mở dữ liệu mẫu
                </button>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              { num: '1', title: 'Tải file Excel nhập kho', desc: 'Tải lên bảng kê manifest dạng .xlsx chứa danh sách SKU, số lượng yêu cầu.', color: 'bg-primary-fixed text-on-primary-fixed' },
              { num: '2', title: 'Tự động tính Thùng/Lẻ', desc: 'Hệ thống tra cứu Master SKU, tự động chia nguyên thùng và bóc tách phần dư kiện lẻ.', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
              { num: '3', title: 'Kiểm tra & Xuất Haravan', desc: 'Kiểm tra nhanh danh sách lỗi, đồng bộ trực tiếp lên Haravan hoặc xuất file.', color: 'bg-tertiary-fixed text-on-tertiary-fixed' },
            ].map((step) => (
              <div key={step.num} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-start gap-space-md animate-fade-in">
                <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center font-semibold text-headline-sm font-bold shrink-0`}>
                  {step.num}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-[14px] text-on-surface font-bold mb-1">{step.title}</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== STATE 2: RESULTS ========== */}
      {viewState === 'results' && (
        <div className="flex flex-col gap-space-lg animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Tổng số dòng</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </div>
              </div>
              <span className="font-bold text-headline-lg text-on-surface font-mono">{DEMO_DATA.length.toLocaleString()}</span>
              <span className="text-body-sm text-on-surface-variant">dòng</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">Thành công</span>
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
              </div>
              <span className="font-bold text-headline-lg text-secondary font-mono">{successCount}</span>
              <span className="text-label-sm font-bold text-secondary bg-secondary-fixed/60 px-1.5 py-0.5 rounded w-fit">
                {((successCount / DEMO_DATA.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-error">Dòng lỗi</span>
                <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
              </div>
              <span className="font-bold text-headline-lg text-error font-mono">{errorCount}</span>
              <span className="text-label-sm font-bold text-error bg-error-container px-1.5 py-0.5 rounded w-fit">
                {((errorCount / DEMO_DATA.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-primary">Tổng số thùng</span>
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                </div>
              </div>
              <span className="font-bold text-headline-lg text-primary font-mono">{totalCartons.toLocaleString()}</span>
              <span className="text-body-sm text-on-surface-variant">thùng (CTN)</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Tổng gói lẻ</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">all_inbox</span>
                </div>
              </div>
              <span className="font-bold text-headline-lg text-on-surface font-mono">{totalLoose.toLocaleString()}</span>
              <span className="text-body-sm text-on-surface-variant">gói/hộp (PCS)</span>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="inline-flex bg-surface-container p-1 rounded-xl">
                {[
                  { key: 'all' as const, label: `Tất cả (${DEMO_DATA.length})` },
                  { key: 'success' as const, label: `Hợp lệ (${successCount})` },
                  { key: 'error' as const, label: `Lỗi (${errorCount})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    className={`px-space-md py-1 rounded-lg text-label-md transition-colors ${
                      filterStatus === f.key
                        ? `font-semibold bg-surface-container-lowest shadow-sm ${f.key === 'error' ? 'text-error' : 'text-primary'}`
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setFilterStatus(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                className="w-full bg-surface-container-low text-on-surface text-body-sm pl-9 pr-space-md py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                placeholder="Tìm SKU, tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-container-high/80 text-on-surface-variant text-label-sm uppercase tracking-wider">
                  <tr className="h-9">
                    <th className="px-space-md py-2 w-12 text-center">STT</th>
                    <th className="px-space-md py-2 min-w-[130px]">Mã SKU</th>
                    <th className="px-space-md py-2 min-w-[240px]">Tên sản phẩm</th>
                    <th className="px-space-md py-2 min-w-[120px]">Quy cách</th>
                    <th className="px-space-md py-2 text-right min-w-[90px]">Số lượng</th>
                    <th className="px-space-md py-2 text-right min-w-[80px]">Thùng%</th>
                    <th className="px-space-md py-2 text-right min-w-[80px]">Lẻ%</th>
                    <th className="px-space-md py-2 text-right min-w-[100px] text-primary font-bold">SL Thùng</th>
                    <th className="px-space-md py-2 text-right min-w-[100px] text-on-surface font-bold">SL Gói Lẻ</th>
                    <th className="px-space-md py-2 min-w-[170px]">Final SKU (Haravan)</th>
                    <th className="px-space-md py-2 text-center min-w-[110px]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {filteredData.map((row) => (
                    <tr
                      key={row.stt}
                      className={`h-11 transition-colors animate-fade-in stagger-${Math.min(row.stt, 10)} ${
                        row.status === 'error'
                          ? 'bg-error-container/40 hover:bg-error-container/60'
                          : 'bg-secondary-fixed/10 hover:bg-secondary-fixed/20'
                      }`}
                    >
                      <td className={`px-space-md py-2 font-mono text-center ${row.status === 'error' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {row.stt}
                      </td>
                      <td className={`px-space-md py-2 font-mono font-semibold ${row.status === 'error' ? 'text-error font-bold' : 'text-primary'}`}>
                        {row.sku}
                      </td>
                      <td className={`px-space-md py-2 font-medium truncate max-w-[260px] ${row.status === 'error' ? 'text-error' : 'text-on-surface'}`} title={row.name}>
                        {row.name}
                      </td>
                      <td className={`px-space-md py-2 ${row.status === 'error' ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                        {row.spec}
                      </td>
                      <td className={`px-space-md py-2 text-right font-mono font-semibold ${row.status === 'error' ? 'text-error font-bold' : ''}`}>
                        {row.quantity.toLocaleString()}
                      </td>
                      <td className={`px-space-md py-2 text-right font-mono ${row.status === 'error' ? 'text-error' : row.cartonPct === '100%' ? 'text-secondary font-bold' : 'text-secondary font-bold'}`}>
                        {row.cartonPct}
                      </td>
                      <td className={`px-space-md py-2 text-right font-mono ${row.status === 'error' ? 'text-error' : row.loosePct === '0%' ? 'text-outline' : 'text-primary font-bold'}`}>
                        {row.loosePct}
                      </td>
                      <td className={`px-space-md py-2 text-right font-mono font-bold ${row.status === 'error' ? 'text-error' : 'text-primary'}`}>
                        {row.cartonQty}
                      </td>
                      <td className={`px-space-md py-2 text-right font-mono font-bold ${row.status === 'error' ? 'text-error' : row.looseQty > 0 ? 'text-primary' : 'text-outline'}`}>
                        {row.looseQty}
                      </td>
                      <td className={`px-space-md py-2 font-mono ${row.status === 'error' ? 'text-error italic' : 'text-on-surface'}`}>
                        {row.finalSku}
                      </td>
                      <td className="px-space-md py-2 text-center">
                        {row.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            {row.statusText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error text-on-error text-[11px] font-bold shadow-sm">
                            {row.statusText}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-space-md py-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-space-sm">
                <span>
                  Hiển thị {filteredData.length} trong tổng số <strong className="text-on-surface">{DEMO_DATA.length}</strong> dòng
                </span>
                <span className="text-outline-variant">•</span>
                <span className="text-secondary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  Đã tính toàn bộ quy cách Thùng/Lẻ
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="sticky bottom-4 z-40 w-full bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-space-md shadow-xl flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <button
                className="px-space-md py-space-sm rounded-xl text-error hover:bg-error-container/40 transition-colors flex items-center gap-1.5 font-semibold text-[14px]"
                onClick={() => setViewState('upload')}
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Xóa kết quả</span>
              </button>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <button
                className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-headline-sm px-space-lg py-space-sm rounded-xl flex items-center gap-space-sm shadow-md transition-all transform active:scale-95"
                onClick={() => showToast('Xuất Haravan', `Đã nạp ${successCount} dòng SKU thành công lên Haravan.`)}
              >
                <span className="material-symbols-outlined text-[20px]">sync_saved_locally</span>
                <span>Xuất Haravan</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 rounded-full text-label-sm font-bold">
                  ({successCount} đơn)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        title={toast.title}
        description={toast.description}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
