import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { warehouseApi, type Warehouse } from '../services/api';

interface WarehouseContextType {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  isLoading: boolean;
}

const WarehouseContext = createContext<WarehouseContextType>({
  warehouses: [],
  selectedWarehouse: null,
  selectedWarehouseId: '',
  setSelectedWarehouseId: () => {},
  isLoading: true,
});

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await warehouseApi.getAll();
      setWarehouses(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || null;

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        selectedWarehouseId,
        setSelectedWarehouseId,
        isLoading,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  return useContext(WarehouseContext);
}
