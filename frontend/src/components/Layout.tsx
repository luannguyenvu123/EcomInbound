import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { warehouseApi, type Warehouse } from '../services/api';

export default function Layout() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await warehouseApi.getAll();
      setWarehouses(res.data);
      if (res.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(res.data[0].code);
      }
    } catch {
      // Backend might not be running yet - use empty state
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

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
                Kho đích:
              </label>
              <div className="relative">
                <select
                  className="appearance-none bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-space-md pr-8 py-1.5 text-label-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] cursor-pointer"
                  id="warehouse-select"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  {warehouses.length > 0 ? (
                    warehouses.map((w) => (
                      <option key={w.id} value={w.code}>
                        {w.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Chưa có kho</option>
                  )}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-outline-variant/40"></div>

            {/* Status Indicator */}
            <div className="hidden sm:inline-flex items-center gap-space-xs bg-secondary-container/20 border border-secondary/20 px-space-sm py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-label-sm text-on-secondary-container">Hệ thống sẵn sàng</span>
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
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
