import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Layout from './components/Layout.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const DailyPage = lazy(() => import('./pages/DailyPage.jsx'))
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'))

function PageLoader() {
  return (
    <div style={loaderStyles}>
      <span>Loading...</span>
    </div>
  )
}

const loaderStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#888'
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/daily" element={<DailyPage />} />
              <Route path="/library" element={<LibraryPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
