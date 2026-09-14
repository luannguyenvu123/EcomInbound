import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
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

export default api;
