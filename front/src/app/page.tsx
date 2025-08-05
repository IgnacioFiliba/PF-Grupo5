
import DealZone from './components/dealzone'
import Features from './components/features'
import Navbar from './components/navbar'
import ProductList from './components/productlist'
import SearchFilters from './components/searchfilters'
import TopBar from './components/topbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <main className="container mx-auto px-4">
        <SearchFilters />
        <Features />
        <ProductList />
        <DealZone />
      </main>
    </div>
  )
}
