import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface StorefrontLayoutProps {
  children: React.ReactNode
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
