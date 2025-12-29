'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { detectBrandId, getBrandCallbackUrl } from '@/lib/brand';
import { generatePassword, calculatePasswordStrength } from '@/lib/password-generator';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  // Extract brand from email domain
  const getBrandFromEmail = (email: string): { slug: string; name: string } | null => {
    if (!email || !email.includes('@')) return null;
    const domain = email.split('@')[1];
    const slug = domain.split('.')[0];
    const name = slug.charAt(0).toUpperCase() + slug.slice(1);
    return { slug, name };
  };

  const detectedBrand = getBrandFromEmail(email);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({ length: 16 });
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const handleCopyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const handleMicrosoftSignUp = async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      setError('');
      
      const brandId = detectBrandId();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: getBrandCallbackUrl(),
          scopes: 'email openid profile',
          queryParams: {
            brand_id: brandId,
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up with Microsoft');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const brandId = detectBrandId();
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            brand_id: brandId, // Pass brand ID to trigger
            job_function: jobFunction || 'Other',
          },
          emailRedirectTo: getBrandCallbackUrl(),
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        // Note: The brand assignment will happen via the auto_assign_brand trigger
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: '#889def' }}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white px-8 py-10 shadow-xl text-center space-y-6">
            <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Check your email!</h1>
            <p className="text-gray-600">
              We've sent you a confirmation email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to verify your account and complete signup.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-sm font-medium text-gray-900 hover:text-black transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-8" style={{ backgroundColor: '#889def' }}>
      {/* Centered Sign Up Form */}
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white px-8 py-8 shadow-xl">
          <div className="w-full space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Get started with onbrand
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Full name (optional)"
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Email address"
                />
                {/* Brand Detection Preview - Compact Version */}
                {detectedBrand && (
                  <div className="mt-1.5 rounded-lg bg-blue-50 border border-blue-200 p-2">
                    <p className="text-xs text-blue-900">
                      Creating account for: <span className="font-semibold">{detectedBrand.name}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Job Function (Role) */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  What is your role?
                </label>
                <select
                  value={jobFunction}
                  onChange={(e) => setJobFunction(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
                >
                  <option value="">Select your role</option>
                  <option value="Strategist">Strategist</option>
                  <option value="Creative">Creative</option>
                  <option value="Account Manager">Account Manager</option>
                  <option value="Social Media Manager">Social Media Manager</option>
                  <option value="Communication Manager">Communication Manager</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Password Field with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black transition-colors"
                      title="Generate strong password"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Generate
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black transition-colors"
                        title="Copy password"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Enter password or generate one"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator - Compact */}
                {passwordStrength && password.length > 0 && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500">Or sign up with</span>
              </div>
            </div>

            {/* OAuth Button */}
            <button
              type="button"
              onClick={handleMicrosoftSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>

            {/* Sign In Link */}
            <div className="text-center text-xs text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-gray-900 hover:text-black transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
