import { StoreProvider } from '@/contexts/StoreContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface CountryLocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{
    country: string
    locale: string
  }>
}

export default async function CountryLocaleLayout({
  children,
  params,
}: CountryLocaleLayoutProps) {
  const { country, locale } = await params

  return (
    <StoreProvider initialCountry={country} initialLocale={locale}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </StoreProvider>
  )
}
