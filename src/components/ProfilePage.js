import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage({ transactions = [] }) {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut();
    }
  };

  const stats = useMemo(() => {
    let daysActive = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user?.created_at) {
      const createdDate = new Date(user.created_at);
      createdDate.setHours(0, 0, 0, 0);
      if (!isNaN(createdDate.getTime())) {
        const diffTime = today - createdDate;
        daysActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      }
    } else if (transactions.length > 0) {
      const firstTransaction = transactions[transactions.length - 1];
      if (firstTransaction.created_at) {
        const firstDate = new Date(firstTransaction.created_at);
        firstDate.setHours(0, 0, 0, 0);
        if (!isNaN(firstDate.getTime())) {
          const diffTime = today - firstDate;
          daysActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
        }
      }
    }

    return {
      daysActive,
      totalTransactions: transactions.length,
    };
  }, [user, transactions]);

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.nickname ||
    user?.email?.split('@')[0] ||
    'Guest';

  const menuItems = [
    { icon: '👍', label: 'Rate us', helper: "It’s important for us" },
    { icon: '🔔', label: 'Reminders', toggle: true },
    { icon: '👥', label: 'Invite partner' },
    { icon: '🕒', label: 'Gestational Age', action: 'Change' },
  ];

  const infoLinks = [
    'Join community',
    'About us',
    'Privacy statement',
    'Privacy policy',
    'Terms of use',
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 pb-24 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-black">Profile</h1>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-black bg-white border border-black/10 rounded-full px-4 py-2 hover:bg-black hover:text-white transition"
        >
          Logout
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-[28px] shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-3xl">
              😺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-black">{displayName}</h2>
                <button className="text-xs text-black/50 underline">Edit</button>
              </div>
              <p className="text-sm text-black/60">{user?.email || 'No email connected'}</p>
            </div>
          </div>
          <div className="text-right text-xs text-black/50">
            <p>{stats.daysActive} days with Catty</p>
            <p>{stats.totalTransactions} total logs</p>
          </div>
        </div>

        <div className="bg-white rounded-[28px] shadow-sm divide-y divide-gray-100">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-black">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  {item.helper && (
                    <p className="text-xs text-black/50">{item.helper}</p>
                  )}
                </div>
              </div>
              {item.toggle ? (
                <div className="w-12 h-6 rounded-full bg-gray-200 relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              ) : item.action ? (
                <button className="text-xs font-medium text-black/50">
                  {item.action}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] shadow-sm px-5 py-4 space-y-3">
          {infoLinks.map((link) => (
            <div
              key={link}
              className="flex items-center justify-between text-sm text-black"
            >
              <span>{link}</span>
              <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] shadow-sm px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-black">
            <div className="flex items-center gap-2">
              <span className="text-lg">✉️</span>
              <span>Contact us</span>
            </div>
            <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="flex items-center justify-between text-sm text-black">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <span>Preferences</span>
            </div>
            <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={handleLogout}
          className="px-10 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;

