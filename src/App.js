import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import { trackPageView, trackLogin, trackLogout } from './lib/analytics';
import SpendingPage from './components/SpendingPage';
import ChatPage from './components/ChatPage';
import AnalyticsPage from './components/AnalyticsPage';
import MoodPage from './components/MoodPage';
import ProfilePage from './components/ProfilePage';
import DailySpendingPage from './components/DailySpendingPage';
import AuthPage from './components/AuthPage';
import SplashScreen from './components/SplashScreen';
import NavigationBar from './components/NavigationBar';
import StatusBar from './components/StatusBar';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState('spending');
  const [dailySpendingDate, setDailySpendingDate] = useState(null);
  const [dailySpendingStatuses, setDailySpendingStatuses] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [shouldShowTracker, setShouldShowTracker] = useState(false);

  // 페이지 변경 추적 (Google Analytics는 index.js에서 이미 초기화됨)
  useEffect(() => {
    if (!showSplash && !loading) {
      const pageName = dailySpendingDate !== null ? 'daily-spending' : currentPage;
      trackPageView(`/${pageName}`);
    }
  }, [currentPage, dailySpendingDate, showSplash, loading]);

  // 스플래시 스크린 표시 (새로고침할 때마다)
  useEffect(() => {
    // 스플래시 스크린을 3초간 표시한 후 AuthPage로 전환
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Load transactions from Supabase when user logs in
  useEffect(() => {
    if (user) {
      trackLogin('email'); // 로그인 추적
      loadTransactions();
      migrateLocalDataToSupabase();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert Supabase format to app format
      const formattedTransactions = (data || []).map(t => ({
        id: t.id,
        date: t.date,
        time: t.time,
        description: t.description,
        amount: parseFloat(t.amount),
        type: t.type,
        category: t.category,
        mood: t.mood,
        notes: t.notes || null
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const migrateLocalDataToSupabase = async () => {
    if (!user) return;

    try {
      // Check if user already has data in Supabase
      const { data: existingData } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // If no data exists, migrate from localStorage
      if (!existingData || existingData.length === 0) {
        const localTransactions = localStorage.getItem('chatty_wallet_transactions');
        if (localTransactions) {
          const parsed = JSON.parse(localTransactions);
          if (parsed && parsed.length > 0) {
            const transactionsToInsert = parsed.map(t => ({
              user_id: user.id,
              date: t.date,
              time: t.time,
              description: t.description,
              amount: Math.abs(t.amount),
              type: t.type,
              category: t.category,
              mood: t.mood,
              notes: t.notes || null
            }));

            const { error } = await supabase
              .from('transactions')
              .insert(transactionsToInsert);

            if (!error) {
              // Clear local storage after successful migration
              localStorage.removeItem('chatty_wallet_transactions');
              loadTransactions();
            }
          }
        }

        // Migrate categories
        const localCategories = localStorage.getItem('chatty_wallet_expense_categories');
        if (localCategories) {
          const parsed = JSON.parse(localCategories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const categoriesToInsert = parsed
              .filter(cat => typeof cat === 'string')
              .map(cat => ({
                user_id: user.id,
                category_name: cat
              }));

            if (categoriesToInsert.length > 0) {
              await supabase
                .from('user_categories')
                .insert(categoriesToInsert)
                .then(() => {
                  localStorage.removeItem('chatty_wallet_expense_categories');
                });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error migrating data:', error);
    }
  };

  const handleSetTransactions = async (newTransactions) => {
    setTransactions(newTransactions);
    
    // Save to Supabase
    if (user) {
      try {
        // Get the last transaction to save
        const lastTransaction = newTransactions[0];
        if (lastTransaction && lastTransaction.id) {
          // Check if it already exists (update) or is new (insert)
          const existing = transactions.find(t => t.id === lastTransaction.id);
          
          if (!existing) {
            // New transaction - insert to Supabase
            const { error } = await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                date: lastTransaction.date,
                time: lastTransaction.time,
                description: lastTransaction.description,
                amount: Math.abs(lastTransaction.amount),
                type: lastTransaction.type,
                category: lastTransaction.category,
                mood: lastTransaction.mood,
                notes: lastTransaction.notes || null
              });

            if (error) throw error;
          }
        }
      } catch (error) {
        console.error('Error saving transaction:', error);
      }
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // 스플래시 스크린 표시
  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleDateClick = (dateKey, extra) => {
    // Parse dateKey (YYYY-MM-DD) to get day number
    if (!dateKey) return;
    const [year, month, day] = dateKey.split('-');
    const dayNumber = extra?.day ?? parseInt(day, 10);
    if (!isNaN(dayNumber) && dayNumber > 0 && dayNumber <= 31) {
      setDailySpendingDate(dayNumber);
      setDailySpendingStatuses(extra?.statusesByDay || null);
      setShouldShowTracker(true); // Tracker에서 열렸음을 표시
    }
  };

  const handleBackFromDailySpending = (newDate) => {
    if (newDate && typeof newDate === 'number') {
      setDailySpendingDate(newDate);
    } else {
      setDailySpendingDate(null);
      setDailySpendingStatuses(null);
      // shouldShowTracker는 유지하여 Tracker가 다시 열리도록 함
    }
  };

  const renderPage = () => {
    if (dailySpendingDate !== null && dailySpendingDate !== undefined) {
      const today = new Date();
      const currentDay = today.getDate();
      // Ensure dailySpendingDate is a valid number
      const validDate = typeof dailySpendingDate === 'number' && !isNaN(dailySpendingDate) ? dailySpendingDate : currentDay;
      return (
        <DailySpendingPage
          transactions={transactions}
          selectedDate={validDate}
          onBack={handleBackFromDailySpending}
          currentDay={currentDay}
          dayStatuses={dailySpendingStatuses}
        />
      );
    }

    switch (currentPage) {
      case 'spending':
        return <SpendingPage transactions={transactions} setTransactions={handleSetTransactions} onDeleteTransaction={handleDeleteTransaction} />;
      case 'chat':
        return <ChatPage transactions={transactions} />;
      case 'analytics':
        return <AnalyticsPage transactions={transactions} onDateClick={handleDateClick} autoOpenTracker={shouldShowTracker && dailySpendingDate === null} onTrackerOpened={() => setShouldShowTracker(false)} />;
      case 'mood':
        return <MoodPage transactions={transactions} />;
      case 'profile':
        return <ProfilePage transactions={transactions} />;
      default:
        return <SpendingPage transactions={transactions} setTransactions={handleSetTransactions} onDeleteTransaction={handleDeleteTransaction} />;
    }
  };

  return (
    <div className="app-container">
      <div className="phone-frame">
        <StatusBar currentPage={currentPage} />
        <div className="phone-content">
          {renderPage()}
        </div>
        {dailySpendingDate === null && (
          <NavigationBar currentPage={currentPage} onNavigate={setCurrentPage} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Analytics />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

