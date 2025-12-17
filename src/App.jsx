import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import DailyPage from './pages/DailyPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
