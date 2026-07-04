const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type PublicOriginEnv = Partial<
  Record<
    | "NEXT_PUBLIC_SITE_URL"
    | "VERCEL_PROJECT_PRODUCTION_URL"
    | "VERCEL_URL"
    | "NODE_ENV"
    | "VERCEL_ENV",
    string
  >
>;

function normalizeOrigin(value: string) {
  const url = new URL(value);
  return url.origin.replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function getPublicSiteOrigin(
  request: Request,
  env: PublicOriginEnv = process.env,
) {
  const explicitOrigin = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitOrigin) {
    return normalizeOrigin(explicitOrigin);
  }

  const vercelOrigin = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;

  if (vercelOrigin) {
    return normalizeOrigin(
      vercelOrigin.startsWith("http") ? vercelOrigin : `https://${vercelOrigin}`,
    );
  }

  const requestOrigin = normalizeOrigin(request.url);
  const isProduction =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

  if (isProduction && isLocalOrigin(requestOrigin)) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set to the production domain before sending report magic links.",
    );
  }

  return requestOrigin;
}

export function buildReportPath(reportId: string, claimToken: string) {
  return `/tools/geo-audit/report?id=${encodeURIComponent(
    reportId,
  )}&token=${encodeURIComponent(claimToken)}`;
}

export function buildReportMagicLinkRedirect(params: {
  origin: string;
  reportId: string;
  claimToken: string;
}) {
  const reportPath = buildReportPath(params.reportId, params.claimToken);
  return `${params.origin}/auth/confirm?next=${encodeURIComponent(reportPath)}`;
}
