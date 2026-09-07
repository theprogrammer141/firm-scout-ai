import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import IcpSetup from './pages/IcpSetup';
import Discover from './pages/Discover';
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import PipelineProgress from './pages/PipelineProgress';
import Opportunities from './pages/Opportunities';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/icp" element={<IcpSetup />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lead/:id" element={<LeadDetail />} />
        <Route path="/pipeline/:jobId" element={<PipelineProgress />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
