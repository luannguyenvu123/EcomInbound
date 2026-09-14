import { useState, useRef, useCallback } from 'react';
import { excelApi, warehouseApi, type ProcessResult, type Warehouse } from '../services/api';
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

export default function ExcelPage() {
  const [viewState, setViewState] = useState<'upload' | 'results'>('upload');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, title: '', description: '', type: 'success' as 'success' | 'error' | 'info' });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [resultRows, setResultRows] = useState<ProcessedRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, title, description, type });
  };

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await warehouseApi.getAll();
      setWarehouses(res.data);
      if (res.data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(res.data[0].id);
      }
    } catch {
      // ignore
    }
  }, [selectedWarehouseId]);

  useState(() => {
    fetchWarehouses();
  });

  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedWarehouseId) {
      showToast('Lỗi', 'Vui lòng chọn kho trước khi upload', 'error');
      return;
    }

    setProcessing(true);
    showToast('Đang xử lý', `Tệp "${file.name}" đang được phân tích...`, 'info');

    try {
      const res = await excelApi.process(file, selectedWarehouseId);
      setResult(res);

      // Map response to rows for display
      const rows: ProcessedRow[] = [];
      // Note: The actual row data would come from a separate endpoint
      // For now, we show the summary from the response
      setResultRows([]);
      setViewState('results');
      showToast('Xử lý hoàn tất', `Tổng: ${res.totalRows} dòng, ${res.successRows} thành công, ${res.errorRows} lỗi`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể xử lý file';
      showToast('Lỗi xử lý', msg, 'error');
    } finally {
      setProcessing(false);
    }
  }, [selectedWarehouseId]);

  const filteredData = resultRows.filter((row) => {
    const matchStatus = filterStatus === 'all' || row.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || row.sku.toLowerCase().includes(q) || row.name.toLowerCase().includes(q) || row.finalSku.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const successCount = result?.successRows || 0;
  const errorCount = result?.errorRows || 0;
  const totalCartons = result?.totalSlThung || 0;
  const totalLoose = result?.totalSlGoiLe || 0;
  const totalRows = result?.totalRows || 0;

  const handleExport = async (xe?: string) => {
    try {
      const blob = await excelApi.exportHaravan(xe);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = xe ? `Haravan_${xe}.xlsx` : 'Haravan_All.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Xuất thành công', `Đã tải file Haravan`);
    } catch {
      showToast('Lỗi', 'Không thể xuất file', 'error');
    }
  };

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
                <select
                  className="bg-transparent text-on-primary font-semibold text-[14px] outline-none cursor-pointer"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
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
                {totalRows > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                    {totalRows.toLocaleString()}
                  </span>
                )}
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
                {processing ? 'Đang xử lý...' : 'Kéo file Excel vào đây hoặc click để chọn'}
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-md mb-space-lg">
                Chỉ chấp nhận tệp định dạng <span className="font-semibold text-on-surface font-mono">.xlsx</span> (Dung lượng tối đa 25MB)
              </p>

              <div className="flex items-center gap-space-md">
                <button className="bg-primary-container hover:bg-primary text-on-primary px-space-xl py-space-md rounded-xl font-semibold text-headline-sm shadow-md flex items-center gap-space-sm transition-all transform active:scale-95" type="button">
                  <span className="material-symbols-outlined text-[20px]">upload</span>
                  <span>{processing ? 'Đang upload...' : 'Chọn file từ máy tính'}</span>
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
      {viewState === 'results' && result && (
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
              <span className="font-bold text-headline-lg text-on-surface font-mono">{totalRows.toLocaleString()}</span>
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
                {totalRows > 0 ? ((successCount / totalRows) * 100).toFixed(1) : 0}%
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
                {totalRows > 0 ? ((errorCount / totalRows) * 100).toFixed(1) : 0}%
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

          {/* Xe List */}
          {result.xeList.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <h3 className="text-label-md font-semibold text-on-surface mb-space-sm">Danh sách xe</h3>
              <div className="flex flex-wrap gap-space-sm">
                {result.xeList.map((xe) => (
                  <div key={xe.name} className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg">
                    <span className="font-semibold text-on-surface">{xe.name}</span>
                    <span className="text-body-sm text-on-surface-variant">({xe.itemCount} SP)</span>
                    <span className="text-body-sm text-primary">Thùng: {xe.totalSlThung}</span>
                    <span className="text-body-sm text-on-surface">Lẻ: {xe.totalSlGoiLe}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="sticky bottom-4 z-40 w-full bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-space-md shadow-xl flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <button
                className="px-space-md py-space-sm rounded-xl text-error hover:bg-error-container/40 transition-colors flex items-center gap-1.5 font-semibold text-[14px]"
                onClick={() => { setViewState('upload'); setResult(null); setResultRows([]); }}
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Xóa kết quả</span>
              </button>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <button
                className="bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-headline-sm px-space-lg py-space-sm rounded-xl flex items-center gap-space-sm shadow-sm transition-all"
                onClick={() => handleExport()}
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Tải file kết quả (.xlsx)</span>
              </button>
              <button
                className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-headline-sm px-space-lg py-space-sm rounded-xl flex items-center gap-space-sm shadow-md transition-all transform active:scale-95"
                onClick={() => handleExport()}
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
