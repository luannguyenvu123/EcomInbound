import { useState, useRef, useCallback } from 'react';
import { excelApi, type ProcessResult, type ProcessItem } from '../services/api';
import { useWarehouse } from '../contexts/WarehouseContext';
import Toast from '../components/Toast';

interface ProcessedRow {
  stt: number;
  sku: string;
  name: string;
  quyCach: number;
  soLuong: number;
  thungPercent: number;
  lePercent: number;
  slThung: number;
  slLe: number;
  slGoiLe: number;
  finalSku: string;
  status: 'success' | 'warning' | 'error';
  statusText: string;
}

export default function ExcelPage() {
  const { selectedWarehouse, selectedWarehouseId } = useWarehouse();
  const [viewState, setViewState] = useState<'upload' | 'results'>('upload');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, title: '', description: '', type: 'success' as 'success' | 'error' | 'info' });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [resultRows, setResultRows] = useState<ProcessedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, title, description, type });
  };

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

      const rows: ProcessedRow[] = (res.items || []).map((item: ProcessItem, idx: number) => {
        let status: 'success' | 'warning' | 'error' = 'success';
        let statusText = 'Thành công';

        if (item.errorMessage) {
          status = 'error';
          statusText = item.errorMessage;
        } else if (!item.hasMapping) {
          status = 'warning';
          statusText = 'Chưa có mapping';
        }

        return {
          stt: idx + 1,
          sku: item.sku,
          name: item.name,
          quyCach: item.quyCach,
          soLuong: item.soLuong,
          thungPercent: item.thungPercent,
          lePercent: item.lePercent,
          slThung: item.slThung,
          slLe: item.slLe,
          slGoiLe: item.slGoiLe,
          finalSku: item.finalSku || item.sku,
          status,
          statusText,
        };
      });

      setResultRows(rows);
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
      const blob = await excelApi.exportHaravan(xe, selectedWarehouse?.code, selectedWarehouse?.name);
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
          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-xl shadow-sm">
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Đang xử lý cho:</span>
            <div className="flex items-center gap-1.5 px-space-xs py-0.5 rounded-lg bg-primary-container text-on-primary font-semibold text-[14px]">
              <span className="material-symbols-outlined text-[16px]">warehouse</span>
              <span>{selectedWarehouse?.name || 'Chưa chọn kho'}</span>
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
                    : resultRows.length === 0
                    ? 'text-on-surface-variant/40 cursor-not-allowed'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => resultRows.length > 0 && setViewState('results')}
                disabled={resultRows.length === 0}
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
              className={`w-full max-w-4xl py-space-xl px-space-lg rounded-2xl bg-surface-container-low/70 transition-all duration-200 flex flex-col items-center text-center shadow-inner relative ${
                processing ? 'opacity-50 cursor-not-allowed' : 'group cursor-pointer hover:bg-surface-container-high/60'
              }`}
              onClick={() => !processing && fileInputRef.current?.click()}
              onDragOver={(e) => { if (!processing) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); } }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                if (!processing) {
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelect(file);
                }
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
              <div className="flex flex-col gap-space-sm">
                {result.xeList.map((xe) => (
                  <div key={xe.name} className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-lg">
                    <div className="flex items-center gap-space-sm">
                      <span className="font-semibold text-on-surface">{xe.name}</span>
                      <span className="text-body-sm text-on-surface-variant">({xe.itemCount} SP)</span>
                      <span className="text-body-sm text-primary">Thùng: {xe.totalSlThung}</span>
                      <span className="text-body-sm text-on-surface">Lẻ: {xe.totalSlGoiLe.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleExport(xe.name)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-container/50 hover:bg-primary-container text-primary text-label-sm font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>Xuất</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Table */}
          {resultRows.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="p-space-md border-b border-surface-container-high">
                <div className="flex flex-wrap items-center justify-between gap-space-md">
                  <h3 className="text-label-md font-semibold text-on-surface">
                    Chi tiết kết quả xử lý
                    <span className="text-on-surface-variant font-normal ml-2">({filteredData.length} dòng)</span>
                  </h3>
                  <div className="flex items-center gap-space-sm">
                    {/* Search */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                      <input
                        type="text"
                        placeholder="Tìm SKU, tên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-body-sm bg-surface-container-low border border-surface-container-high rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-48"
                      />
                    </div>
                    {/* Filter */}
                    <div className="flex bg-surface-container-low rounded-lg p-0.5">
                      {[
                        { value: 'all' as const, label: 'Tất cả', count: resultRows.length },
                        { value: 'success' as const, label: 'Thành công', count: resultRows.filter(r => r.status === 'success').length },
                        { value: 'warning' as const, label: 'Cảnh báo', count: resultRows.filter(r => r.status === 'warning').length },
                        { value: 'error' as const, label: 'Lỗi', count: resultRows.filter(r => r.status === 'error').length },
                      ].map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setFilterStatus(f.value)}
                          className={`px-2.5 py-1 rounded-md text-label-sm transition-all ${
                            filterStatus === f.value
                              ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {f.label}
                          <span className="ml-1 text-[10px] opacity-70">{f.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-3 py-2.5 text-left text-label-sm font-semibold text-on-surface-variant w-12">STT</th>
                      <th className="px-3 py-2.5 text-left text-label-sm font-semibold text-on-surface-variant">SKU</th>
                      <th className="px-3 py-2.5 text-left text-label-sm font-semibold text-on-surface-variant">Tên sản phẩm</th>
                      <th className="px-3 py-2.5 text-center text-label-sm font-semibold text-on-surface-variant w-20">Quy cách</th>
                      <th className="px-3 py-2.5 text-center text-label-sm font-semibold text-on-surface-variant w-24">Thùng</th>
                      <th className="px-3 py-2.5 text-center text-label-sm font-semibold text-on-surface-variant w-24">Gói lẻ</th>
                      <th className="px-3 py-2.5 text-left text-label-sm font-semibold text-on-surface-variant">SKU mới</th>
                      <th className="px-3 py-2.5 text-left text-label-sm font-semibold text-on-surface-variant w-36">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-on-surface-variant">
                          {searchQuery || filterStatus !== 'all' ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row) => (
                        <tr
                          key={row.stt}
                          className={`transition-colors hover:bg-surface-container-low/50 ${
                            row.status === 'error'
                              ? 'bg-error-container/10'
                              : row.status === 'warning'
                              ? 'bg-yellow-50'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-on-surface-variant font-mono text-[12px]">{row.stt}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-on-surface">{row.sku}</td>
                          <td className="px-3 py-2 text-on-surface max-w-[200px] truncate">{row.name}</td>
                          <td className="px-3 py-2 text-center text-on-surface-variant">{row.quyCach}</td>
                          <td className="px-3 py-2 text-center font-semibold text-primary">{row.slThung > 0 ? row.slThung.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-on-surface">{row.slGoiLe > 0 ? row.slGoiLe.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2 font-mono text-on-surface">{row.finalSku}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              row.status === 'success'
                                ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                : row.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-error-container text-on-error-container'
                            }`}>
                              {row.status === 'success' && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                              {row.status === 'warning' && <span className="material-symbols-outlined text-[12px]">info</span>}
                              {row.status === 'error' && <span className="material-symbols-outlined text-[12px]">error</span>}
                              {row.statusText}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                className="bg-primary-container hover:bg-primary text-on-primary font-semibold text-headline-sm px-space-lg py-space-sm rounded-xl flex items-center gap-space-sm shadow-md transition-all transform active:scale-95"
                onClick={() => handleExport()}
              >
                <span className="material-symbols-outlined text-[20px]">sync_saved_locally</span>
                <span>Xuất tất cả</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 rounded-full text-label-sm font-bold">
                  ({result?.xeList.length || 0} xe/cont)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {processing && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-2xl flex flex-col items-center gap-space-md max-w-sm mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-headline-sm text-on-surface">Đang xử lý file</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">Vui lòng chờ trong giây lát...</p>
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
