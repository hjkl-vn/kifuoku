import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0 pt-11">{children}</main>
      <Footer />
    </div>
  )
}
