'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  const testPasswordReset = async () => {
    if (!supabase || !email) return;

    try {
      setLoading(true);
      setResult(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `✅ Password reset email sent to ${email}! Check your inbox.`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: `❌ Error: ${err instanceof Error ? err.message : 'Failed to send email'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const testMagicLink = async () => {
    if (!supabase || !email) return;

    try {
      setLoading(true);
      setResult(null);

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `✅ Magic link sent to ${email}! Check your inbox.`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: `❌ Error: ${err instanceof Error ? err.message : 'Failed to send email'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Resend Email Test
          </h1>
          <p className="text-gray-600">
            Test your Resend email integration with Supabase
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            How to Test:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Enter your email address below</li>
            <li>Click one of the test buttons</li>
            <li>Check your email inbox</li>
            <li>Verify the email comes from your custom domain (not @mail.app.supabase.io)</li>
            <li>Check email headers to confirm it's from Resend</li>
          </ol>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testPasswordReset}
                disabled={loading || !email}
                className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : '📧 Test Password Reset'}
              </button>

              <button
                onClick={testMagicLink}
                disabled={loading || !email}
                className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : '✨ Test Magic Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-6 mb-6 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ What to Check:
          </h2>
          <div className="space-y-3 text-sm">
            <label className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <span className="text-gray-700">
                <strong>Email received:</strong> Check your inbox (and spam folder)
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <span className="text-gray-700">
                <strong>From address:</strong> Should be from your custom domain (e.g., noreply@act.agency), not @mail.app.supabase.io
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <span className="text-gray-700">
                <strong>Email headers:</strong> Open email → View original/headers → Look for "X-Resend-" headers
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <span className="text-gray-700">
                <strong>Template:</strong> Check if custom template is applied (if configured)
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" />
              <span className="text-gray-700">
                <strong>Links work:</strong> Click the link and verify it redirects correctly
              </span>
            </label>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">
            🔧 Troubleshooting:
          </h2>
          <div className="space-y-2 text-sm text-yellow-800">
            <p><strong>Email not received?</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check spam/junk folder</li>
              <li>Wait 1-2 minutes (sometimes delayed)</li>
              <li>Verify Resend API key in Supabase settings</li>
              <li>Check Resend dashboard for delivery status</li>
            </ul>
            <p className="mt-3"><strong>Still using @mail.app.supabase.io?</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Verify SMTP settings in Supabase Auth config</li>
              <li>Ensure domain is verified in Resend</li>
              <li>Check Resend API key is correct</li>
            </ul>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
