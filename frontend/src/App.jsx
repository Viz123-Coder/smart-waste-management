import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LiveBins from './pages/LiveBins.jsx'
import BinDetails from './pages/BinDetails.jsx'
import MapView from './pages/MapView.jsx'
import Predictions from './pages/Predictions.jsx'
import RouteOptimization from './pages/RouteOptimization.jsx'
import Collections from './pages/Collections.jsx'
import DumpingReports from './pages/DumpingReports.jsx'
import Alerts from './pages/Alerts.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-bins" element={<LiveBins />} />
          <Route path="/bins/:binId" element={<BinDetails />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/routes" element={<RouteOptimization />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/dumping" element={<DumpingReports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  )
}
