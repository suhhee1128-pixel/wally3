import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import wallyLogo from '../assets/wally-2.png';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        throw error;
      }
      // Supabase will redirect for OAuth; keep loading state minimal
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || err.error_description || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    setError('');
    setSuccess('');
    window.alert('Apple 로그인은 준비 중입니다. 이메일 또는 Google 계정을 이용해 주세요.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('Form submitted:', { isLogin, email });

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please enter your name or nickname');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        console.log('Attempting sign in...');
        const { data, error } = await signIn(email, password);
        console.log('Sign in result:', { data, error });
        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
        if (data) {
          console.log('Sign in successful');
        }
      } else {
        console.log('Attempting sign up...');
        const { data, error } = await signUp(email, password, name.trim());
        console.log('Sign up result:', { data, error });
        if (error) {
          console.error('Sign up error:', error);
          throw error;
        }
        if (data) {
          console.log('Sign up successful', data);
          // Check if email confirmation is required
          if (data.user && !data.session) {
            setSuccess('Account created! Please check your email to confirm your account, then sign in.');
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setLoading(false);
            // Switch to login mode after a moment
            setTimeout(() => {
              setIsLogin(true);
              setSuccess('');
            }, 3000);
            return;
          }
          // If session exists, user is automatically logged in
          if (data.session) {
            setSuccess('Account created and signed in successfully!');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || error.error_description || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const heading = 'Create an account';
  const subheading = 'enter your email and password.';
  const primaryLabel = loading ? 'Loading...' : 'Create an Account';

  return (
    <div className="min-h-screen bg-[#F6F6F8] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-[32px] shadow-[0_30px_60px_rgba(15,23,42,0.08)] px-8 pt-12 pb-10 relative overflow-hidden">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-start mb-1">
              <img
                src={wallyLogo}
                alt="Wally mascot"
                className="h-8 w-auto object-contain"
                draggable="false"
              />
            </div>
            <div>
              <h1 className="text-[24px] font-medium text-black tracking-tight">{heading}</h1>
              <p className="mt-2 text-[15px] text-gray-400 font-normal">{subheading}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          {!error && !success && !isLogin && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-600">
              After signing up, please check your email to confirm your account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Name or nickname
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 rounded-[14px] border border-gray-200 bg-white px-4 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition"
                  placeholder="name or nickname"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-[14px] border border-gray-200 bg-white px-4 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition"
                placeholder="email"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 rounded-[14px] border border-gray-200 bg-white px-4 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition"
                placeholder="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full h-12 rounded-[14px] border border-gray-200 bg-white px-4 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition"
                  placeholder="confirm password"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full h-12 rounded-[16px] bg-[#C4FF1D] text-black font-medium tracking-wide transition hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {primaryLabel}
            </button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center">
              <span className="h-px flex-1 bg-gray-200"></span>
              <span className="px-3 text-xs uppercase tracking-[0.3em] text-gray-400">or</span>
              <span className="h-px flex-1 bg-gray-200"></span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-[16px] bg-black text-white font-medium text-sm tracking-wide flex items-center justify-center gap-3 transition hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5" aria-hidden="true">
                  <path fill="#4285F4" d="M488 261.8c0-17.8-1.6-35.1-4.6-52H249v98.6h134.4c-5.8 31.4-23.3 58.1-49.7 75.8v63.1h80.5c47.1-43.4 73.8-107.4 73.8-185.5z" />
                  <path fill="#34A853" d="M249 492c65.7 0 120.8-21.9 161.1-59.4l-80.5-63.1c-22.4 15-50.8 23.7-80.6 23.7-61.9 0-114.3-41.8-133.1-98.1H32.2v61.6C72.8 449.9 156.8 492 249 492z" />
                  <path fill="#FBBC05" d="M115.9 294.8c-4.9-14.7-7.8-30.4-7.8-46.8s2.8-32.1 7.8-46.8v-61.6H32.2C11.6 179.9 0 215 0 248s11.6 68.1 32.2 108.4l83.7-61.6z" />
                  <path fill="#EA4335" d="M249 152.1c35.7 0 67.6 12.3 92.8 36.5l69.7-69.7C369.8 76.3 314.7 54 249 54 156.8 54 72.8 96.1 32.2 139.6l83.7 61.6C134.7 193.9 187.1 152.1 249 152.1z" />
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleAppleSignIn}
                className="w-full h-12 rounded-[16px] bg-black text-white font-medium text-sm tracking-wide flex items-center justify-center gap-3 transition hover:bg-black/90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M318.7 268.7c-.3-36.7 16-64.4 49-84.9-18.4-26.9-46.2-41.7-82.8-44.8-34.7-2.8-72.8 20.3-86.7 20.3-14.2 0-47.6-19.3-73.8-19.3-55 0-115.9 40.3-115.9 120.5 0 26.4 4.9 53.7 14.6 81.9 13.1 37.4 60.3 128.9 109.6 127 25.7-.6 43.8-18.3 77.2-18.3 32.7 0 49.5 18.3 77.8 18.3 49.5-.7 92.8-82.4 105.5-119.9-67-31.6-64.9-92.6-64.5-101.8zm-59.7-185.3c26.4-31.4 24-60 23.2-70.6-23.4 1.3-50.7 15.6-66.5 34.1-17.2 19.8-27.1 44.3-25 71.2 25.3 2 48.4-11 68.3-34.7z"
                  />
                </svg>
                Continue with Apple
              </button>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-sm font-medium text-gray-500 hover:text-black transition"
            >
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="pt-8 text-center text-xs uppercase tracking-[0.4em] text-gray-300">
            wally
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;

