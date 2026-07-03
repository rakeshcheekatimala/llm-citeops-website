import { getTranslations } from "next-intl/server";

type AudienceVisual = "business" | "developer";

export async function AudienceSection() {
  const t = await getTranslations("Audience");

  const cards = [
    {
      title: t("businessTitle"),
      body: t("businessBody"),
      bullets: [t("businessBullet1"), t("businessBullet2"), t("businessBullet3")],
      visual: "business" as const,
    },
    {
      title: t("developerTitle"),
      body: t("developerBody"),
      bullets: [t("developerBullet1"), t("developerBullet2"), t("developerBullet3")],
      visual: "developer" as const,
    },
  ];

  return (
    <section className="border-b border-border bg-paper py-16 sm:py-24">
      <div className="safe-pad mx-auto max-w-content sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {cards.map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[28px] border border-border bg-card shadow-soft"
            >
              <AudienceVisualPanel title={card.title} visual={card.visual} />
              <div className="p-5 sm:p-6">
                <p className="text-base leading-relaxed text-ink-muted">
                  {card.body}
                </p>
                <div className="mt-5 space-y-3">
                  {card.bullets.map((bullet) => (
                    <p
                      key={bullet}
                      className="rounded-2xl bg-paper-muted px-4 py-3 text-sm leading-7 text-ink"
                    >
                      {bullet}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceVisualPanel({
  title,
  visual,
}: {
  title: string;
  visual: AudienceVisual;
}) {
  return (
    <div className="relative min-h-[17rem] overflow-hidden bg-ink p-5 text-paper sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.24),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(69,123,255,0.2),transparent_30%),linear-gradient(135deg,rgba(4,16,24,0.96),rgba(12,20,31,0.94))]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex h-full min-h-[14rem] flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">
              CiteOps view
            </p>
            <h3 className="mt-2 max-w-[18rem] font-display text-2xl font-semibold text-paper">
              {title}
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-paper/80 backdrop-blur">
            Live report
          </span>
        </div>

        {visual === "business" ? <BusinessVisual /> : <DeveloperVisual />}
      </div>
    </div>
  );
}

function BusinessVisual() {
  const metrics = [
    { label: "Composite", value: "82" },
    { label: "AEO", value: "88" },
    { label: "GEO", value: "76" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-paper/55">
          Visibility score
        </p>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-display text-5xl font-semibold leading-none text-paper">
            82
          </span>
          <span className="pb-1 text-sm font-semibold text-emerald-200">
            +12 vs rival
          </span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-teal-300 to-sky-400" />
        </div>
      </div>

      <div className="space-y-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur"
          >
            <span className="text-sm text-paper/70">{metric.label}</span>
            <span className="font-display text-2xl font-semibold text-paper">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperVisual() {
  const checks = [
    "FAQPage schema",
    "dateModified",
    "External citations",
  ];

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 font-mono text-xs text-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <span className="text-paper/35">$ </span>
        <span>llm-citeops audit --url &quot;$DEPLOY_URL&quot; --ci</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {checks.map((check, index) => (
          <div
            key={check}
            className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur"
          >
            <div className="mb-3 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-300 to-blue-400"
                style={{ width: `${90 - index * 18}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-paper/80">{check}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-paper/40">
              Fix queued
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["JSON", "HTML", "CSV"].map((format) => (
          <span
            key={format}
            className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-paper/70"
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  );
}
