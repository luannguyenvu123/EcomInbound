import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY || '',
  },
});

// ===== Warehouse API =====
export interface Warehouse {
  id: string;
  code: string;
  name: string;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  total: number;
}

export const warehouseApi = {
  getAll: () => api.get<WarehouseListResponse>('/warehouses').then((r) => r.data),
  getByCode: (code: string) =>
    api.get<{ data: Warehouse }>(`/warehouses/${code}`).then((r) => r.data),
};

// ===== Mapping API =====
export interface Mapping {
  child: string;
  parent: string;
}

export interface MappingListResponse {
  data: Mapping[];
  total: number;
}

export const mappingApi = {
  getAll: () => api.get<MappingListResponse>('/mappings').then((r) => r.data),

  create: (dto: { child: string; parent: string }) =>
    api.post<{ message: string; data: Mapping }>('/mappings', dto).then((r) => r.data),

  remove: (child: string) =>
    api.delete<{ message: string; child: string }>(`/mappings/${child}`).then((r) => r.data),

  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ message: string; count: number }>('/mappings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  downloadTemplate: () =>
    api
      .get('/mappings/template', { responseType: 'blob' })
      .then((r) => r.data),
};

// ===== Excel API =====
export interface XeData {
  name: string;
  totalSlThung: number;
  totalSlGoiLe: number;
  itemCount: number;
}

export interface ProcessItem {
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
  hasMapping: boolean;
  is3N: boolean;
  errorMessage: string;
}

export interface ProcessResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  totalSlThung: number;
  totalSlGoiLe: number;
  xeList: XeData[];
  items: ProcessItem[];
  warehouse: { code: string; name: string } | null;
}

export const excelApi = {
  process: (file: File, warehouseId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('warehouseId', warehouseId);
    return api
      .post<ProcessResult>('/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  exportHaravan: (xe?: string, warehouseCode?: string, warehouseName?: string) => {
    const params: Record<string, string> = {};
    if (xe) params.xe = xe;
    if (warehouseCode) params.warehouseCode = warehouseCode;
    if (warehouseName) params.warehouseName = warehouseName;
    return api
      .get('/export', { params, responseType: 'blob' })
      .then((r) => r.data);
  },
};

export default api;
