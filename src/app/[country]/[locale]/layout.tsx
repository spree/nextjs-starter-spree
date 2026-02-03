import { StoreProvider } from '@/contexts/StoreContext'
import { AuthProvider } from '@/contexts/AuthContext'

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
      <AuthProvider>
        {children}
      </AuthProvider>
    </StoreProvider>
  )
}
