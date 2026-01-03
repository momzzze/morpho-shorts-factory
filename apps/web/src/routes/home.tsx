import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTheme } from '../theme';
import { useAppStore } from '@/app/store';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export const Route = createFileRoute('/home')({
  component: HomePage,
});

function HomePage() {
  const { tokens } = useTheme();
  const navigate = useNavigate();
  const token = useAppStore((s) => s.token);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  // If already logged in, send to the authed dashboard
  useEffect(() => {
    if (token) {
      navigate({ to: '/', replace: true });
    }
  }, [token, navigate]);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: tokens.bg, color: tokens.fg }}
    >
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="relative py-14 sm:py-18 lg:py-24">
            <div className="mx-auto max-w-5xl px-6 lg:px-10 flex flex-col gap-14 lg:gap-16">
              {/* Hero */}
              <section className="space-y-6 text-center">
                <h1
                  className="text-4xl sm:text-5xl font-bold leading-tight"
                  style={{ color: tokens.primary }}
                >
                  Find Undervalued Stocks Using Real Financial Data
                </h1>
                <p className="text-lg opacity-80 leading-relaxed max-w-3xl mx-auto">
                  We analyze official SEC filings and turn them into clear,
                  explainable insights — no hype, no black-box AI.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/auth/register"
                    className="px-5 py-3 rounded-xl font-semibold shadow"
                    style={{
                      backgroundColor: tokens.primary,
                      color: tokens.bg,
                    }}
                  >
                    Create free account
                  </Link>
                  <Link
                    to="/auth/login"
                    className="px-5 py-3 rounded-xl font-semibold border"
                    style={{
                      borderColor: tokens.border,
                      backgroundColor: tokens.surface,
                      color: tokens.fg,
                    }}
                  >
                    Login
                  </Link>
                </div>
              </section>

              {/* How it works */}
              <section className="space-y-4 text-center">
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: tokens.primary }}
                >
                  How it works
                </h2>
                <div className="grid gap-4 sm:grid-cols-3 text-left">
                  {[
                    {
                      title: 'We collect official data',
                      desc: 'We ingest company financials directly from SEC filings — revenue, profit, assets, cash flow.',
                    },
                    {
                      title: 'We normalize and score',
                      desc: 'Data is cleaned, standardized, and transformed into clear financial metrics.',
                    },
                    {
                      title: 'You get explanations',
                      desc: 'Every score comes with reasoning — you see why a company looks strong or weak.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl p-4 h-full"
                      style={{
                        backgroundColor: tokens.surface,
                        border: `1px solid ${tokens.border}`,
                      }}
                    >
                      <div
                        className="font-semibold mb-2"
                        style={{ color: tokens.primary }}
                      >
                        {item.title}
                      </div>
                      <div className="text-sm opacity-80 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* What you get */}
              <section className="space-y-3 text-center">
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: tokens.primary }}
                >
                  What you get inside
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 text-left">
                  {[
                    'Financial health scores per company',
                    'Fundamental screeners (quality, growth, stability)',
                    'Company detail pages with full breakdown',
                    'Saved filters and preferences',
                    'Background data updates (no manual refresh)',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl p-3"
                      style={{
                        backgroundColor: tokens.surface,
                        border: `1px solid ${tokens.border}`,
                      }}
                    >
                      <span className="text-sm opacity-85">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Trust & positioning */}
              <section
                className="rounded-2xl p-5 text-center text-sm sm:text-base"
                style={{
                  backgroundColor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                }}
              >
                Built for investors who want clarity, not noise. No social
                signals. No sentiment guessing. Just structured financial data.
              </section>

              {/* Final CTA */}
              <section className="space-y-3 text-center pb-4">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: tokens.primary }}
                >
                  Ready to explore real fundamentals?
                </h3>
                <Link
                  to="/auth/register"
                  className="inline-flex px-5 py-3 rounded-xl font-semibold shadow"
                  style={{ backgroundColor: tokens.primary, color: tokens.bg }}
                >
                  Create account
                </Link>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
