import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  basePath: string;
  locale: string;
}

export async function HeroSection({ basePath, locale }: HeroSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <section
      className="relative overflow-hidden min-h-[100svh] flex flex-col"
      style={{ background: "linear-gradient(135deg, #0e0b09 0%, #1a1210 50%, #0e0b09 100%)" }}
    >
      {/* Ambient grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Warm radial glow from right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 75% 50%, rgba(239,119,106,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Horizontal rule lines — editorial feel */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(239,119,106,0.2)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(239,119,106,0.2)" }} />

      {/* Main content grid */}
      <div className="relative flex-1 container mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-0 items-center min-h-[100svh]">

        {/* LEFT: Typography + CTAs */}
        <div className="flex flex-col justify-center py-24 lg:py-0 lg:pr-12 order-2 lg:order-1">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-8 w-fit"
            style={{ borderBottom: "1px solid rgba(239,119,106,0.4)", paddingBottom: "8px" }}
          >
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: "#EF776A" }}
            >
              Proud to be Indian
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="font-bold leading-[0.95] tracking-tight mb-6"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              color: "#f5ede8",
            }}
          >
            <span className="block">Next</span>
            <span className="block" style={{ color: "#EF776A" }}>Generation</span>
            <span className="block">Fragrances</span>
          </h1>

          {/* Divider */}
          <div
            className="mb-6 w-16 h-px"
            style={{ background: "rgba(239,119,106,0.5)" }}
          />

          {/* Tagline */}
          <p
            className="mb-10 leading-relaxed max-w-md"
            style={{
              fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
              color: "rgba(245,237,232,0.6)",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
            }}
          >
            Premium-quality fragrances. No excessive markups.
            Crafted with heart — for every occasion, every mood.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`${basePath}/products`}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all duration-300"
              style={{
                background: "#EF776A",
                color: "#0e0b09",
                letterSpacing: "0.15em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d9665a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#EF776A";
              }}
            >
              Shop Now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <Link
              href={`${basePath}/c/categories`}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold tracking-widest uppercase transition-all duration-300"
              style={{
                background: "transparent",
                color: "rgba(245,237,232,0.75)",
                border: "1px solid rgba(245,237,232,0.2)",
                letterSpacing: "0.15em",
              }}
            >
              Explore Categories
            </Link>
          </div>

          {/* Trust pills */}
          <div className="mt-12 flex flex-wrap gap-6">
            {[
              { icon: "✦", text: "Authentic Inspirations" },
              { icon: "✦", text: "Free Shipping above ₹499" },
              { icon: "✦", text: "2ml Samples Available" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span style={{ color: "#EF776A", fontSize: "0.6rem" }}>{icon}</span>
                <span
                  className="text-xs tracking-wide uppercase"
                  style={{ color: "rgba(245,237,232,0.4)", letterSpacing: "0.1em" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: NOZ Logo + decorative composition */}
        <div className="relative flex items-center justify-center order-1 lg:order-2 pt-24 pb-8 lg:py-0 lg:pl-12">

          {/* Vertical rule on left side of right panel (desktop only) */}
          <div
            className="absolute left-0 top-1/4 bottom-1/4 w-px hidden lg:block"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(239,119,106,0.2), transparent)" }}
          />

          {/* Outer circle ring */}
          <div
            className="absolute w-80 h-80 lg:w-[440px] lg:h-[440px] rounded-full"
            style={{
              border: "1px solid rgba(239,119,106,0.1)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Inner circle ring */}
          <div
            className="absolute w-56 h-56 lg:w-[300px] lg:h-[300px] rounded-full"
            style={{
              border: "1px solid rgba(239,119,106,0.15)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Coral glow blob behind logo */}
          <div
            className="absolute w-48 h-48 lg:w-64 lg:h-64 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(239,119,106,0.12) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* NOZ SVG Logo */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            <Image
              src="/noz.svg"
              alt="NOZ Fragrances"
              width={280}
              height={109}
              priority
              className="w-48 lg:w-72 drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 0 40px rgba(239,119,106,0.3))" }}
            />

            {/* Scent descriptor pill */}
            <div
              className="flex items-center gap-3 px-5 py-2.5"
              style={{
                background: "rgba(239,119,106,0.06)",
                border: "1px solid rgba(239,119,106,0.2)",
              }}
            >
              <div className="flex gap-1.5">
                {["Woody", "Floral", "Oriental", "Fresh"].map((note, i) => (
                  <span
                    key={note}
                    className="text-xs tracking-widest uppercase"
                    style={{
                      color: i === 0 ? "#EF776A" : "rgba(245,237,232,0.35)",
                      fontSize: "0.65rem",
                    }}
                  >
                    {note}
                    {i < 3 && <span className="ml-1.5 mr-0.5" style={{ opacity: 0.3 }}>·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating note labels — decorative */}
          <div
            className="absolute top-[15%] right-[10%] text-xs tracking-widest uppercase hidden lg:block"
            style={{ color: "rgba(239,119,106,0.35)", fontSize: "0.6rem", letterSpacing: "0.18em" }}
          >
            Est. India
          </div>
          <div
            className="absolute bottom-[20%] left-[8%] text-xs hidden lg:block"
            style={{ color: "rgba(245,237,232,0.15)", fontSize: "0.6rem", letterSpacing: "0.18em" }}
          >
            50ml · 10ml · 2ml
          </div>
        </div>
      </div>

      {/* Bottom scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
        aria-hidden
      >
        <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(245,237,232,0.5)", fontSize: "0.6rem", letterSpacing: "0.2em" }}>
          Scroll
        </span>
        <div
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, rgba(239,119,106,0.6), transparent)" }}
        />
      </div>
    </section>
  );
}
