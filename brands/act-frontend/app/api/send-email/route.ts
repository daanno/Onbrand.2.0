import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    const data = await resend.emails.send({
      from: 'ACT Onbrand <onboarding@resend.dev>', // Update with your verified domain
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
