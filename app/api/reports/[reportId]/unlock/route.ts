import { NextResponse } from "next/server";

import {
  buildReportMagicLinkRedirect,
  getPublicSiteOrigin,
} from "@/lib/reports/redirects";
import { markReportUnlockIntent } from "@/lib/reports/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { reportId } = await params;
    const body = (await request.json()) as {
      email?: string;
      claimToken?: string;
    };

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: "A work email is required." },
        { status: 400 },
      );
    }

    if (!body.claimToken?.trim()) {
      return NextResponse.json(
        { error: "This report session is missing its secure token." },
        { status: 400 },
      );
    }

    const email = body.email.trim().toLowerCase();
    await markReportUnlockIntent({
      reportId,
      claimToken: body.claimToken,
      email,
    });

    const emailRedirectTo = buildReportMagicLinkRedirect({
      origin: getPublicSiteOrigin(request),
      reportId,
      claimToken: body.claimToken,
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      message: "Check your inbox for a secure report link.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send secure report link.",
      },
      { status: 500 },
    );
  }
}
