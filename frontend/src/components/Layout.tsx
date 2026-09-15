import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { warehouseApi } from '../services/api';
import { useWarehouse } from '../contexts/WarehouseContext';

function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/30">
      <div className="h-16 max-w-7xl mx-auto px-gutter-lg flex items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high animate-pulse"></div>
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse"></div>
            <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
          <div className="h-8 w-24 bg-surface-container-high rounded-lg animate-pulse"></div>
          <div className="h-8 w-28 bg-surface-container-high rounded-lg animate-pulse"></div>
        </div>
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-sm">
            <div className="h-4 w-8 bg-surface-container-high rounded animate-pulse hidden lg:block"></div>
            <div className="h-9 w-32 bg-surface-container-high rounded-lg animate-pulse"></div>
          </div>
          <div className="h-5 w-px bg-outline-variant/40"></div>
          <div className="h-8 w-24 bg-surface-container-high rounded-lg animate-pulse hidden sm:block"></div>
        </div>
      </div>
    </header>
  );
}

function ContentSkeleton() {
  return (
    <main className="w-full pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-margin py-margin">
        <div className="flex flex-col gap-space-lg animate-pulse">
          {/* Sub-bar skeleton */}
          <div className="w-full bg-surface-container-low shadow-sm rounded-xl p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-xl">
                <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse"></div>
                <div className="h-7 w-28 bg-primary/20 rounded-lg animate-pulse"></div>
              </div>
              <div className="bg-surface-container-high p-1 rounded-full flex items-center">
                <div className="h-8 w-28 bg-surface-container-high rounded-full animate-pulse"></div>
                <div className="h-8 w-32 bg-surface-container-high rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Upload zone skeleton */}
          <div className="w-full bg-surface-container-lowest rounded-2xl p-space-xl shadow-md">
            <div className="w-full max-w-4xl mx-auto py-space-xl px-space-lg rounded-2xl bg-surface-container-low/70 flex flex-col items-center">
              <div className="relative mb-space-md">
                <div className="w-24 h-28 bg-surface-container-high rounded-xl animate-pulse"></div>
              </div>
              <div className="h-5 w-64 bg-surface-container-high rounded animate-pulse mb-2"></div>
              <div className="h-4 w-80 bg-surface-container-high rounded animate-pulse mb-space-lg"></div>
              <div className="h-10 w-48 bg-primary/20 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Layout() {
  const { warehouses, selectedWarehouse, selectedWarehouseId, setSelectedWarehouseId, isLoading } = useWarehouse();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkApiHealth = useCallback(async () => {
    try {
      await warehouseApi.getAll();
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [checkApiHealth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderSkeleton />
        <ContentSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]">
        <div className="h-16 max-w-7xl mx-auto px-gutter-lg flex items-center justify-between gap-space-lg">
          {/* Brand */}
          <div className="flex items-center gap-space-md">
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[20px]">inventory_2</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-headline-sm text-on-surface tracking-tight leading-none">
                EcomInbound
              </span>
              <span className="text-label-sm text-on-surface-variant leading-none mt-1">
                Warehouse Automation
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-space-md py-space-xs rounded-lg text-label-md transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              Xử lý Excel
            </NavLink>
            <NavLink
              to="/mappings"
              className={({ isActive }) =>
                `px-space-md py-space-xs rounded-lg text-label-md transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              Quản lý Mapping
            </NavLink>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-space-lg">
            {/* Warehouse Selector */}
            <div className="flex items-center gap-space-sm">
              <label
                className="text-label-md text-on-surface-variant whitespace-nowrap hidden lg:inline"
                htmlFor="warehouse-select"
              >
                Kho:
              </label>
              <div className="relative">
                <select
                  className="appearance-none bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-space-md pr-8 py-1.5 text-label-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] cursor-pointer"
                  id="warehouse-select"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  <option value="">-- Chọn kho --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-outline-variant/40"></div>

            {/* Status Indicator */}
            <div className={`hidden sm:inline-flex items-center gap-space-xs px-space-sm py-1 rounded-lg border ${
              apiStatus === 'online'
                ? 'bg-secondary-container/20 border-secondary/20'
                : apiStatus === 'offline'
                ? 'bg-error-container/20 border-error/20'
                : 'bg-surface-container-low border-outline-variant/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                apiStatus === 'online'
                  ? 'bg-secondary animate-pulse'
                  : apiStatus === 'offline'
                  ? 'bg-error'
                  : 'bg-on-surface-variant animate-pulse'
              }`}></span>
              <span className={`text-label-sm ${
                apiStatus === 'online'
                  ? 'text-on-secondary-container'
                  : apiStatus === 'offline'
                  ? 'text-on-error-container'
                  : 'text-on-surface-variant'
              }`}>
                {apiStatus === 'online'
                  ? 'Hệ thống sẵn sàng'
                  : apiStatus === 'offline'
                  ? 'Mất kết nối'
                  : 'Đang kiểm tra...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-16 bg-background">
        <div className="max-w-7xl mx-auto px-margin py-margin">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
