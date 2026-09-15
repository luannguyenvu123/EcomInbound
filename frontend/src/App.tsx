import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WarehouseProvider } from './contexts/WarehouseContext';
import Layout from './components/Layout';
import ExcelPage from './pages/ExcelPage';
import MappingPage from './pages/MappingPage';

function App() {
  return (
    <BrowserRouter>
      <WarehouseProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ExcelPage />} />
            <Route path="mappings" element={<MappingPage />} />
          </Route>
        </Routes>
      </WarehouseProvider>
    </BrowserRouter>
  );
}

export default App;
