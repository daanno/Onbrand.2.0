// @ts-nocheck - Prevent errors during build
import { NextRequest, NextResponse } from 'next/server';

// Tell Next.js this is a dynamic API route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, fromEmail, toEmail } = body;

    if (!apiKey || !fromEmail || !toEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call Resend API from server-side (no CORS issues)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'Test Email from ACT 2.0',
        html: '<div style="font-family: sans-serif; padding: 20px;"><h1>🎉 Success!</h1><p>If you received this email, your Resend integration is working correctly!</p><p style="color: #666; font-size: 14px;">This is a test email sent from your ACT 2.0 application.</p></div>',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Resend API error', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully! Email ID: ${data.id}`,
      data,
    });
  } catch (error) {
    console.error('Test Resend API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
