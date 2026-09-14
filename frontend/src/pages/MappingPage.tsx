import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { mappingApi, type Mapping } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function MappingPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newChild, setNewChild] = useState('');
  const [newParent, setNewParent] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Mapping | null>(null);

  // Toast
  const [toast, setToast] = useState({ show: false, title: '', description: '', type: 'success' as 'success' | 'error' });

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, description, type });
  };

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mappingApi.getAll();
      setMappings(res.data);
    } catch {
      showToast('Lỗi', 'Không thể tải danh sách mapping. Kiểm tra lại kết nối Backend.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  // Filtered + searched mappings
  const filteredMappings = useMemo(() => {
    let result = mappings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.child.toLowerCase().includes(q) || m.parent.toLowerCase().includes(q)
      );
    }
    return result;
  }, [mappings, searchQuery, activeFilter]);

  // Paginated
  const totalPages = Math.ceil(filteredMappings.length / rowsPerPage);
  const paginatedMappings = filteredMappings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, rowsPerPage]);

  // Create mapping
  const handleCreate = async () => {
    if (!newChild.trim() || !newParent.trim()) return;
    setCreateLoading(true);
    try {
      await mappingApi.create({ child: newChild.trim(), parent: newParent.trim() });
      showToast('Đã tạo mapping', `${newChild.toUpperCase()} → ${newParent.toUpperCase()}`);
      setShowAddModal(false);
      setNewChild('');
      setNewParent('');
      fetchMappings();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
      showToast('Lỗi tạo mapping', msg, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete mapping
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mappingApi.remove(deleteTarget.child);
      showToast('Đã xóa mapping', `Mã ${deleteTarget.child} đã được gỡ bỏ.`);
      setDeleteTarget(null);
      fetchMappings();
    } catch {
      showToast('Lỗi', 'Không thể xóa mapping', 'error');
    }
  };

  // Import Excel
  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const res = await mappingApi.importExcel(file);
      showToast('Import thành công', `Đã nạp ${res.count} mapping từ file Excel.`);
      setShowImportModal(false);
      fetchMappings();
    } catch {
      showToast('Lỗi import', 'Không thể import file Excel. Kiểm tra định dạng file.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await mappingApi.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mapping_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Lỗi', 'Không thể tải template', 'error');
    }
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-space-lg mb-margin">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-xl rounded-xl shadow-sm animate-fade-in">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm mb-1">
              <span className="px-space-sm py-0.5 rounded-full bg-primary/10 text-primary text-label-sm tracking-wide uppercase font-semibold">
                Quy chuẩn dữ liệu kho
              </span>
            </div>
            <h1 className="font-semibold text-headline-lg text-on-surface tracking-tight">
              Mapping SKU 3N → 1N (Haravan)
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1 max-w-3xl">
              Quy đổi mã SKU nhà cung cấp / đơn vị thứ 3 (3N) sang mã chuẩn Haravan (1N) dùng cho phân bổ kho,
              đồng bộ phiếu nhập và kiểm kê tự động.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface text-label-md transition-all shadow-sm"
              onClick={handleDownloadTemplate}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              Tải template mẫu
            </button>
            <button
              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-primary text-label-md transition-all shadow-sm"
              onClick={() => setShowImportModal(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">table_chart</span>
              Import Excel
            </button>
            <button
              className="inline-flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-md shadow-md transition-all"
              onClick={() => setShowAddModal(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              + Thêm mapping
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md animate-fade-in stagger-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-on-surface-variant">Tổng số liên kết SKU</span>
              <span className="font-semibold text-headline-md text-on-surface">{mappings.length.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md animate-fade-in stagger-2">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-on-surface-variant">Đang áp dụng thực tế</span>
              <span className="font-semibold text-headline-md text-on-surface">
                {mappings.length.toLocaleString()}{' '}
                <span className="text-label-sm text-on-surface-variant font-normal">(100%)</span>
              </span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md animate-fade-in stagger-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-on-surface-variant">Kết quả tìm kiếm</span>
              <span className="font-semibold text-headline-md text-on-surface">{filteredMappings.length.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md animate-fade-in stagger-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[22px]">warehouse</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-sm text-on-surface-variant">Đồng bộ tự động kho</span>
              <span className="font-semibold text-headline-md text-secondary flex items-center gap-1">
                Realtime
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm mb-margin overflow-hidden animate-slide-up">
        {/* Search & Filter Bar */}
        <div className="p-space-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md bg-surface-container-low/40">
          <div className="relative flex-1 max-w-2xl">
            <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-space-md py-2 bg-surface-container-lowest rounded-lg text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm"
              placeholder="Tìm kiếm theo SKU 3N, SKU 1N Haravan..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg">
            <button
              className={`px-space-md py-1.5 rounded-lg text-label-md flex items-center gap-1.5 transition-colors ${
                activeFilter === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveFilter('all')}
              type="button"
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-label-sm">
                {mappings.length}
              </span>
            </button>
            <button
              className={`px-space-md py-1.5 rounded-lg text-label-md flex items-center gap-1.5 transition-colors ${
                activeFilter === 'active'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveFilter('active')}
              type="button"
            >
              <span>Đang hoạt động</span>
              <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full text-label-sm">
                {mappings.length}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-label-sm tracking-wider uppercase">
                <th className="py-3 px-space-sm w-14 text-center">STT</th>
                <th className="py-3 px-space-md">SKU 3N (Mã con / Child)</th>
                <th className="py-3 px-space-md">SKU 1N (Mã cha Haravan)</th>
                <th className="py-3 px-space-md">Trạng thái</th>
                <th className="py-3 px-space-md text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30 text-body-md text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[32px] text-outline">search_off</span>
                      <span>Không tìm thấy mapping nào</span>
                      <span className="text-body-sm">
                        {searchQuery
                          ? 'Thử tìm kiếm với từ khóa khác'
                          : 'Thêm mapping mới bằng nút "Thêm mapping" hoặc Import Excel'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMappings.map((m, i) => {
                  const idx = (currentPage - 1) * rowsPerPage + i + 1;
                  return (
                    <tr
                      key={`${m.child}-${m.parent}`}
                      className={`hover:bg-surface-container-low/40 transition-colors animate-fade-in stagger-${Math.min(i + 1, 10)}`}
                    >
                      <td className="py-3.5 px-space-sm text-center font-mono text-on-surface-variant">
                        {String(idx).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-container-high rounded font-mono text-code-tabular text-on-surface font-semibold">
                          <span className="material-symbols-outlined text-[14px] text-outline">tag</span>
                          {m.child}
                        </div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed/60 text-on-primary-fixed-variant rounded-lg font-mono text-code-tabular font-bold">
                          <span className="material-symbols-outlined text-[15px] text-primary">hub</span>
                          {m.parent}
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Đang áp dụng
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            className="p-1.5 rounded hover:bg-error-container/40 text-tertiary hover:text-error transition-colors"
                            onClick={() => setDeleteTarget(m)}
                            title="Xóa"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMappings.length > 0 && (
          <div className="px-space-lg py-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <span className="text-body-sm text-on-surface-variant">
                Hiển thị{' '}
                <strong className="text-on-surface font-semibold">
                  {(currentPage - 1) * rowsPerPage + 1} -{' '}
                  {Math.min(currentPage * rowsPerPage, filteredMappings.length)}
                </strong>{' '}
                trên tổng số{' '}
                <strong className="text-on-surface font-semibold">{filteredMappings.length.toLocaleString()}</strong>{' '}
                mapping
              </span>
              <div className="flex items-center gap-space-xs">
                <label className="text-label-sm text-on-surface-variant" htmlFor="rows-per-page">
                  Hiển thị:
                </label>
                <select
                  className="bg-surface-container-low text-on-surface text-label-sm rounded-lg px-2 py-1 outline-none cursor-pointer"
                  id="rows-per-page"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10 dòng</option>
                  <option value={25}>25 dòng</option>
                  <option value={50}>50 dòng</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 text-label-md flex items-center gap-1 transition-colors"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Trước
              </button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="w-6 text-center text-outline text-label-md">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`w-8 h-8 rounded-lg text-label-md font-semibold flex items-center justify-center transition-colors ${
                      currentPage === p
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                    onClick={() => setCurrentPage(p as number)}
                    type="button"
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="px-space-sm py-1 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 text-label-md flex items-center gap-1 transition-colors"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                type="button"
              >
                Sau
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Banner */}
      {deleteTarget && (
        <div className="mb-margin bg-error-container/40 p-space-md rounded-xl flex items-center justify-between gap-space-md shadow-sm animate-slide-up">
          <div className="flex items-center gap-space-md">
            <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-headline-sm text-on-surface">Xác nhận xóa liên kết SKU?</span>
              <span className="text-body-sm text-on-surface-variant">
                Bạn có chắc chắn muốn xóa liên kết SKU 3N: {deleteTarget.child} → SKU 1N: {deleteTarget.parent}?
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-label-md hover:bg-surface-container transition-colors"
              onClick={() => setDeleteTarget(null)}
              type="button"
            >
              Hủy
            </button>
            <button
              className="px-space-md py-1.5 rounded-lg bg-tertiary text-on-tertiary text-label-md hover:bg-error transition-colors shadow-sm"
              onClick={handleDelete}
              type="button"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      )}

      {/* Add Mapping Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm Mapping SKU 3N → 1N"
        subtitle="Tạo liên kết mã SKU mới cho Haravan"
        icon="add_link"
        footer={
          <>
            <button
              className="px-space-lg py-2 rounded-lg bg-surface-container text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
              onClick={() => setShowAddModal(false)}
              type="button"
            >
              Hủy bỏ
            </button>
            <button
              className="px-space-xl py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-md font-semibold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              onClick={handleCreate}
              disabled={createLoading || !newChild.trim() || !newParent.trim()}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {createLoading ? 'Đang tạo...' : 'Lưu mapping'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          <div className="space-y-1">
            <label className="block text-label-md text-on-surface font-semibold">
              SKU 3N (Mã kho/NCC) <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-low px-space-md py-2 rounded-lg font-mono text-code-tabular text-on-surface font-bold outline-none focus:bg-surface-container-lowest shadow-sm"
                type="text"
                placeholder="VN-DRY-8832"
                value={newChild}
                onChange={(e) => setNewChild(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                qr_code
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant">Mã in trên bao bì hoặc phiếu giao 3N</p>
          </div>
          <div className="space-y-1">
            <label className="block text-label-md text-on-surface font-semibold">
              SKU 1N (Mã chuẩn Haravan) <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full bg-primary-fixed/30 text-on-primary-fixed-variant px-space-md py-2 rounded-lg font-mono text-code-tabular font-bold outline-none focus:bg-surface-container-lowest shadow-sm"
                type="text"
                placeholder="HRV-KU-80T"
                value={newParent}
                onChange={(e) => setNewParent(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-primary">
                hub
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant">Mã mẹ chuẩn tồn kho trên hệ thống</p>
          </div>
        </div>
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Mapping từ Excel"
        subtitle="Tải lên file .xlsx để nạp mapping hàng loạt"
        icon="upload_file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
        <div
          className="w-full py-space-xl px-space-lg rounded-2xl bg-surface-container-low/70 hover:bg-surface-container-high/60 transition-all cursor-pointer flex flex-col items-center text-center shadow-inner"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            const file = e.dataTransfer.files?.[0];
            if (file) handleImport(file);
          }}
        >
          <div className="relative mb-space-md">
            <div className="w-20 h-24 bg-surface-container-lowest rounded-xl shadow-md flex flex-col items-center justify-center p-2.5">
              <span className="material-symbols-outlined text-[36px] text-primary">upload_file</span>
            </div>
          </div>
          <h3 className="font-semibold text-headline-sm text-on-surface mb-space-xs">
            {importing ? 'Đang import...' : 'Kéo file Excel vào đây hoặc click để chọn'}
          </h3>
          <p className="text-body-md text-on-surface-variant max-w-md">
            Chỉ chấp nhận tệp định dạng <span className="font-semibold text-on-surface font-mono">.xlsx</span>
          </p>
          {importing && (
            <div className="mt-space-md">
              <span className="material-symbols-outlined text-[24px] animate-spin text-primary">progress_activity</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Toast */}
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
