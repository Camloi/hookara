'use client'

import {
  Globe,
  Clock,
  Timer,
  Download,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function FeaturesSection() {
  const { t } = useTranslation()
  return (
    <section id="fonctionnalites" className="bg-background py-8 md:py-24">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t('features.title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          {t('features.subtitle')}
        </p>
        <div className="mt-14 grid gap-12 sm:grid-cols-3">
          {[
            {
              num: "1",
              title: t('features.step1Title'),
              desc: t('features.step1Desc'),
            },
            {
              num: "2",
              title: t('features.step2Title'),
              desc: t('features.step2Desc'),
            },
            {
              num: "3",
              title: t('features.step3Title'),
              desc: t('features.step3Desc'),
            },
          ].map((f, i) => (
            <div key={i} className="relative flex flex-col items-center text-center rounded-xl border border-border px-6 pb-8 pt-12">
              <span className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground ring-8 ring-background">
                {f.num}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhySection() {
  const { t } = useTranslation()
  return (
    <section className="bg-secondary/40 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t('why.title')}</h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Clock className="h-5 w-5" />,
              title: t('why.timeTitle'),
              desc: t('why.timeDesc'),
            },
            {
              icon: <Globe className="h-5 w-5" />,
              title: t('why.terminologyTitle'),
              desc: t('why.terminologyDesc'),
            },
            {
              icon: <Timer className="h-5 w-5" />,
              title: t('why.timestampsTitle'),
              desc: t('why.timestampsDesc'),
            },
            {
              icon: <Download className="h-5 w-5" />,
              title: t('why.pdfTitle'),
              desc: t('why.pdfDesc'),
            },
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const { t } = useTranslation()
  return (
    <section id="faq" className="bg-background py-12 md:py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t('faq.title')}</h2>
        <div className="mt-12 space-y-4">
          {[
            { q: t('faq.q1'), a: t('faq.a1') },
            { q: t('faq.q2'), a: t('faq.a2') },
            { q: t('faq.q3'), a: t('faq.a3') },
            { q: t('faq.q4'), a: t('faq.a4') },
            { q: t('faq.q5'), a: t('faq.a5') },
          ].map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold select-none hover:bg-secondary/50 transition">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FooterSection() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-border bg-background py-8 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between md:px-8">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Hookara</span>
        </div>
        <p>{t('footer.madeWith')} <a href="https://x.com/kamtahh" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground transition">Kamtah <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a></p>
      </div>
    </footer>
  );
}
