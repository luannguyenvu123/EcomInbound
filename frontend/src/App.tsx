import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ExcelPage from './pages/ExcelPage';
import MappingPage from './pages/MappingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ExcelPage />} />
          <Route path="mappings" element={<MappingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
