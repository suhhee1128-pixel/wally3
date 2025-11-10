import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadUserSettings, saveUserSettings, migrateSettingsFromLocalStorage } from '../lib/userSettings';
import LoadingIcon from './LoadingIcon';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function AnalyticsPage({ transactions = [], onDateClick }) {
  const { user } = useAuth();
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // State for target goal and period
  const [target, setTarget] = useState(5000);
  const [showModal, setShowModal] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [period, setPeriod] = useState('month'); // 'week', '2weeks', '3weeks', 'month'
  const [startDate, setStartDate] = useState(() => {
    // Default to today in YYYY-MM-DD format
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [startDateInput, setStartDateInput] = useState('');
  const [activityView, setActivityView] = useState('tracker');
  const [showTrackerDetail, setShowTrackerDetail] = useState(false);
  
  // State for calendar month navigation
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const [displayMonth, setDisplayMonth] = useState(todayDate.getMonth());
  const [displayYear, setDisplayYear] = useState(todayDate.getFullYear());
  
  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        // Migrate from localStorage first
        await migrateSettingsFromLocalStorage(user.id);
        
        // Load from Supabase
        const settings = await loadUserSettings(user.id);
        if (settings) {
          if (settings.analytics_target) setTarget(parseFloat(settings.analytics_target));
          if (settings.analytics_period) setPeriod(settings.analytics_period);
          if (settings.analytics_start_date) setStartDate(settings.analytics_start_date);
        }
        setLoadingSettings(false);
      } else {
        // Fallback to localStorage if not logged in
        const savedTarget = localStorage.getItem('chatty_wallet_target');
        const savedPeriod = localStorage.getItem('chatty_wallet_period');
        const savedStartDate = localStorage.getItem('chatty_wallet_start_date');
        if (savedTarget) setTarget(parseFloat(savedTarget));
        if (savedPeriod) setPeriod(savedPeriod);
        if (savedStartDate) setStartDate(savedStartDate);
        setLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  // Period configuration
  const periodConfig = {
    week: { days: 7, label: '1 Week' },
    '2weeks': { days: 14, label: '2 Weeks' },
    '3weeks': { days: 21, label: '3 Weeks' },
    month: { days: 30, label: '1 Month' }
  };
  
  const currentPeriod = periodConfig[period];
  const daysInPeriod = currentPeriod.days;
  
  // Calculate actual data from transactions
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const saved = Math.max(0, target - totalExpenses);
  // Calculate spending percentage (지출 기준)
  const spendingPercentage = target > 0 ? Math.round((totalExpenses / target) * 100) : 0;
  const savedPercentage = target > 0 ? Math.round((saved / target) * 100) : 0;
  
  // Calculate progress bar color based on spending percentage
  // spendingPercentage = 지출한 금액 비율 (높을수록 많이 씀 = 나쁨)
  // 0-60%: Green (점점 진해지는 초록) - 적게 쓸 때
  // 60-80%: Yellow to Orange (노란색에서 주황색으로)
  // 80-100%: Orange to Red (점점 빨갛게, 100%가 제일 빨강) - 많이 쓸 때
  const progressGradientStops = useMemo(() => ({
    start: '#F35DC8',
    end: '#F35DC8'
  }), []);

  const formatCurrency = (value) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parseExpenseDate = (dateStr) => {
    if (!dateStr) return null;

    const hasFourDigitYear = /\d{4}/.test(dateStr);
    const directParse = hasFourDigitYear ? new Date(dateStr) : null;
    if (directParse && !isNaN(directParse)) {
      directParse.setHours(0, 0, 0, 0);
      return directParse;
    }

    const monthMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    if (monthMatch) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.findIndex(
        (name) => name.toLowerCase() === monthMatch[1].slice(0, 3).toLowerCase()
      );
      if (monthIndex !== -1) {
        const day = parseInt(monthMatch[2], 10);
        const reference = new Date();
        const currentYear = reference.getFullYear();
        const currentMonth = reference.getMonth();
        let year = currentYear;
        if (monthIndex > currentMonth) {
          year -= 1;
        }
        const parsedDate = new Date(year, monthIndex, day);
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
      }
    }

    const slashParts = dateStr.split('/');
    if (slashParts.length >= 2) {
      const month = parseInt(slashParts[0], 10) - 1;
      const day = parseInt(slashParts[1], 10);
      let year = slashParts.length >= 3 ? parseInt(slashParts[2], 10) : new Date().getFullYear();
      if (!isNaN(month) && !isNaN(day)) {
        if (slashParts.length < 3) {
          const reference = new Date();
          const currentMonth = reference.getMonth();
          if (month > currentMonth) {
            year -= 1;
          }
        } else if (!isNaN(year) && year < 100) {
          year += year >= 70 ? 1900 : 2000;
        }
        const parsedDate = new Date(year, month, day);
        parsedDate.setHours(0, 0, 0, 0);
        return parsedDate;
      }
    }

    return null;
  };

  const monthlyTotalsMap = {};

  expenses.forEach((expense) => {
    const expenseDate = parseExpenseDate(expense.date);
    if (!expenseDate) return;

    const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyTotalsMap[monthKey]) {
      monthlyTotalsMap[monthKey] = {
        total: 0,
        date: new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1),
      };
    }
    monthlyTotalsMap[monthKey].total += Math.abs(expense.amount);
  });

  const monthlyData = Object.entries(monthlyTotalsMap)
    .map(([key, value]) => ({
      key,
      total: value.total,
      date: value.date,
      label: value.date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    }))
    .sort((a, b) => b.date - a.date);

  const monthlyMap = useMemo(() => new Map(monthlyData.map((item) => [item.key, item])), [monthlyData]);
  const formatYearMonthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

  const getMonthlyEntry = useMemo(
    () =>
      (year, month) => {
        let adjustedYear = year;
        let adjustedMonth = month;

        while (adjustedMonth < 0) {
          adjustedYear -= 1;
          adjustedMonth += 12;
        }

        while (adjustedMonth > 11) {
          adjustedYear += 1;
          adjustedMonth -= 12;
        }

        const key = formatYearMonthKey(adjustedYear, adjustedMonth);
        const existing = monthlyMap.get(key);
        if (existing) {
          return existing;
        }

        const date = new Date(adjustedYear, adjustedMonth, 1);
        return {
          key,
          total: 0,
          date,
          label: date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        };
      },
    [monthlyMap]
  );

  const currentDateReference = useMemo(() => new Date(), []);
  const defaultYear = currentDateReference.getFullYear();
  const defaultMonth = currentDateReference.getMonth();

  const yearsAvailable = useMemo(() => {
    const years = Array.from(new Set(monthlyData.map((item) => item.date.getFullYear()))).sort((a, b) => b - a);
    if (years.length === 0) {
      return [defaultYear];
    }
    return years;
  }, [monthlyData, defaultYear]);

  const [selectedYear, setSelectedYear] = useState(yearsAvailable[0]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    if (monthlyData[0]) {
      return monthlyData[0].date.getMonth();
    }
    return defaultMonth;
  });

  useEffect(() => {
    if (!yearsAvailable.includes(selectedYear) && yearsAvailable.length > 0) {
      setSelectedYear(yearsAvailable[0]);
    }
  }, [yearsAvailable, selectedYear]);

  const monthOptions = useMemo(() => {
    // Always show all 12 months (0-11: January to December)
    const options = [];
    for (let month = 0; month <= 11; month += 1) {
      options.push(month);
    }
    return options;
  }, []);

  useEffect(() => {
    if (monthOptions.length === 0) {
      return;
    }
    if (!monthOptions.includes(selectedMonthIndex)) {
      setSelectedMonthIndex(monthOptions[0]);
    }
  }, [monthOptions, selectedMonthIndex]);

  const maxMonthlyTotal = monthlyData.reduce((max, item) => Math.max(max, item.total), 0);

  // Get today's date for comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  // Calculate daily spending from transactions
  const dailyGoal = Math.round(target / daysInPeriod);
  // Parse the selected start date (for goal calculation only)
  // Parse YYYY-MM-DD format to avoid timezone issues
  const startDateParts = startDate.split('-');
  const selectedStartDate = new Date(
    parseInt(startDateParts[0]), // year
    parseInt(startDateParts[1]) - 1, // month (0-indexed)
    parseInt(startDateParts[2]) // day
  );
  selectedStartDate.setHours(0, 0, 0, 0);
  
  // Calculate the end date based on period (starting from selected start date) - for progress display
  const calendarStartDate = new Date(selectedStartDate);
  calendarStartDate.setHours(0, 0, 0, 0);
  const calendarEndDate = new Date(selectedStartDate);
  calendarEndDate.setDate(selectedStartDate.getDate() + daysInPeriod - 1);
  calendarEndDate.setHours(23, 59, 59, 999); // Set to end of day for inclusive comparison
  
  // Generate array of dates for DISPLAYED MONTH (can navigate to previous/next months)
  const currentMonth = displayMonth;
  const currentYear = displayYear;
  const currentMonthLabel = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' });
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const trackerYearOptions = useMemo(() => {
    const yearSet = new Set([displayYear, defaultYear]);
    yearsAvailable.forEach((year) => yearSet.add(year));
    yearSet.add(displayYear - 1);
    yearSet.add(displayYear + 1);
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [displayYear, defaultYear, yearsAvailable]);
  
  const dateArray = [];
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0); // Ensure time is set to midnight
    dateArray.push(date);
  }
  
  // Group expenses by actual date (YYYY-MM-DD format for matching)
  const expensesByDate = {};
  expenses.forEach(expense => {
    if (expense.date) {
      // Try to parse the date from various formats
      let expenseDate = null;
      
      // Format like "Nov 4" or "Nov 04"
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dateMatch = expense.date.match(/(\w+)\s+(\d+)/);
      if (dateMatch) {
        const monthName = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        const monthIndex = monthNames.findIndex(m => m === monthName);
        if (monthIndex !== -1) {
          // Match expenses from any month, but prioritize the displayed month/year
          // Try to determine the year - if month is in the past relative to today, use current year
          // Otherwise, check if it matches the displayed month
          let expenseYear = currentYear;
          if (monthIndex === currentMonth) {
            expenseYear = currentYear;
          } else {
            // For other months, try to infer the year
            const todayMonth = new Date().getMonth();
            const todayYear = new Date().getFullYear();
            if (monthIndex <= todayMonth) {
              expenseYear = currentYear; // Same year
            } else {
              expenseYear = currentYear - 1; // Previous year
            }
          }
          expenseDate = new Date(expenseYear, monthIndex, day);
          expenseDate.setHours(0, 0, 0, 0);
        }
      }
      
      // Also try MM/DD format (e.g., "11/07" or "11/7")
      if (!expenseDate) {
        const mmddMatch = expense.date.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
        if (mmddMatch) {
          const month = parseInt(mmddMatch[1]) - 1; // 0-indexed
          const day = parseInt(mmddMatch[2]);
          const year = mmddMatch[3] ? parseInt(mmddMatch[3]) : currentYear;
          expenseDate = new Date(year, month, day);
          expenseDate.setHours(0, 0, 0, 0);
        }
      }
      
      // If we have a date, format it as YYYY-MM-DD for matching
      // Only include expenses from the displayed month/year
      if (expenseDate && expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        const dateKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;
        if (!expensesByDate[dateKey]) {
          expensesByDate[dateKey] = 0;
        }
        expensesByDate[dateKey] += Math.abs(expense.amount);
        
        // Debug for Nov 7
        if (dateKey === `${currentYear}-11-07` && currentMonth === 10) {
          console.log('Nov 7 expense found:', {
            originalDate: expense.date,
            parsedDate: dateKey,
            amount: expense.amount,
            totalForDate: expensesByDate[dateKey],
            currentYear,
            currentMonth
          });
        }
      } else {
        // Debug: log if date couldn't be parsed
        if (expense.date.includes('Nov') || expense.date.includes('7')) {
          console.log('Failed to parse date:', expense.date);
        }
      }
    }
  });
  
  // Activity data based on actual spending and dates
  const activityData = {};
  
  dateArray.forEach((date, index) => {
    const startTimestamp = selectedStartDate.getTime();
    const endTimestamp = calendarEndDate.getTime();
    const todayTimestamp = today.getTime();
    const dayNumber = date.getDate();
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const daySpending = expensesByDate[dateKey] || 0;
    
    // Compare dates by timestamp to ensure accurate comparison
    const dateTimestamp = date.getTime();
    
    // Check if the date is within the goal period (from selected start date)
    const isInGoalPeriod = dateTimestamp >= startTimestamp && dateTimestamp <= endTimestamp;
    
    // Debug for day 7 (index 6) and day 8 (index 7)
    if (index === 6 || index === 7) {
      console.log(`Day ${dayNumber} (index ${index}) calculation:`, {
        dateKey,
        daySpending,
        expensesByDate: expensesByDate[dateKey],
        dateTimestamp,
        startTimestamp,
        endTimestamp,
        todayTimestamp,
        isInGoalPeriod,
        dailyGoal,
        allExpensesByDate: expensesByDate
      });
    }
    
    // Color logic: Only dates within goal period show colors
    // If outside the goal period, mark as inactive
    if (!isInGoalPeriod) {
      activityData[index] = 'inactive';
    } else if (dateTimestamp > todayTimestamp) {
      // Within goal period but future date
      activityData[index] = 'future';
    } else if (daySpending > dailyGoal) {
      // Within goal period, exceeded daily goal
      activityData[index] = 'exceeded';
    } else if (daySpending > 0) {
      // Within goal period, has spending but within goal
      activityData[index] = 'good';
    } else {
      // Within goal period, no spending (also good)
      activityData[index] = 'good';
    }
  });

  const goalStreak = (() => {
    if (!dailyGoal || dailyGoal <= 0) return 0;
    const streakStartDate = new Date(today);
    streakStartDate.setHours(0, 0, 0, 0);
    let streak = 0;
    const cursor = new Date(streakStartDate);
    while (cursor.getTime() >= calendarStartDate.getTime()) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const spending = expensesByDate[key] || 0;
      if (spending <= dailyGoal) {
        streak += 1;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  })();
  
  // Get the first day of the month to align calendar properly
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Weekday labels (Sunday first)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper functions
  const getColorClass = (day) => {
    const level = activityData[day];
    if (day === 6 || day === 7) { // Debug for day 7 (index 6) and day 8 (index 7)
      console.log(`Day ${day === 6 ? '7' : '8'} (index ${day}) - level:`, level, 'activityData:', activityData[day]);
    }
    switch(level) {
      case 'future': return 'bg-[#F7F3F1]';
      case 'exceeded': return 'bg-[#F35DC8]';
      case 'good': return 'bg-[#A4F982]';
      case 'inactive': return 'bg-gray-100';
      default: return 'bg-gray-200';
    }
  };
  
  const getBackgroundColor = (level) => {
    switch(level) {
      case 'future': return '#F7F3F1';
      case 'exceeded': return '#F35DC8';
      case 'good': return '#A4F982';
      case 'inactive': return '#E5E7EB';
      default: return '#E5E7EB';
    }
  };
  
  const getTextColor = (day) => {
    const level = activityData[day];
    if (level === 'future' || level === 'inactive') {
      return 'text-gray-400';
    }
    return 'text-black';
  };

  const renderCalendar = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month (Sunday-based)
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full"></div>
        </div>
      );
    }
    
    // Add cells for each day of the month
    dateArray.forEach((date, index) => {
      const dayNumber = date.getDate();
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      // Only past dates (including today) are clickable, regardless of goal period
      // Compare dates using getTime() for accurate comparison
      const isClickable = date.getTime() <= today.getTime();
      
      // Check if date is within goal period for highlight effect
      const dateTimestamp = date.getTime();
      const startTimestamp = selectedStartDate.getTime();
      const endTimestamp = calendarEndDate.getTime();
      const isInGoalPeriod = dateTimestamp >= startTimestamp && dateTimestamp <= endTimestamp;
      
      const level = activityData[index] || 'inactive';
      if (dayNumber) {
        // dayStatusMap[dayNumber] = level; // This line is removed as per the edit hint
      }
      const baseColor = getBackgroundColor(level);
      
      days.push(
        <div key={index} className="flex flex-col items-center justify-center relative">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClass(index)} transition-all relative ${isClickable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
            style={{
              ...(isInGoalPeriod && {
                border: '2px solid rgba(17, 24, 39, 0.14)',
                boxShadow: '0 0 10px rgba(15, 23, 42, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.35)'
              })
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isClickable && onDateClick) {
                console.log('Date clicked:', dateKey, 'isClickable:', isClickable);
                setShowTrackerDetail(false);
                onDateClick(dateKey);
              } else {
                console.log('Date not clickable:', dateKey, 'isClickable:', isClickable, 'onDateClick:', !!onDateClick);
              }
            }}
          >
            <span className={`text-sm font-medium ${getTextColor(index)}`}>{dayNumber}</span>
          </div>
        </div>
      );
    });
    return days;
  };

  const renderTrackerContent = () => (
    <>
      <div className="mb-6 text-left">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative inline-flex items-center">
            <select
              value={displayYear}
              onChange={(e) => setDisplayYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold text-gray-600 focus:outline-none cursor-pointer"
            >
              {trackerYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ▼
            </span>
          </div>
          <div className="relative inline-flex items-center">
            <select
              value={currentMonth}
              onChange={(e) => setDisplayMonth(parseInt(e.target.value, 10))}
              className="appearance-none bg-transparent pr-7 text-2xl font-bold text-black focus:outline-none cursor-pointer"
            >
              {MONTH_LABELS.map((label, monthIndex) => (
                <option key={label} value={monthIndex}>
                  {label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ▼
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">Daily Goal: ${formatCurrency(Number.isFinite(dailyGoal) ? dailyGoal : 0)}</p>
      </div>
      <div className="grid grid-cols-7 gap-3 mb-4">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-xs text-gray-500 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3 mb-6">
        {renderCalendar()}
      </div>
      
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#F35DC8]"></div>
          <span className="text-gray-700 font-medium">Over Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#A4F982]"></div>
          <span className="text-gray-700 font-medium">On Budget</span>
        </div>
      </div>
    </>
  );

  // Calculate start and end dates based on period (from selected start date)
  const getDateRange = () => {
    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    };
    
    return {
      start: formatDate(calendarStartDate),
      end: formatDate(calendarEndDate)
    };
  };
  
  const dateRange = getDateRange();

  const handleSetTarget = async () => {
    const newTarget = parseFloat(targetInput);
    const newStartDate = startDateInput || startDate;
    
    if (newTarget && newTarget > 0) {
      setTarget(newTarget);
      setStartDate(newStartDate);
      
      // Save to Supabase if logged in, otherwise localStorage
      if (user) {
        await saveUserSettings(user.id, {
          analytics_target: newTarget,
          analytics_start_date: newStartDate
        });
      } else {
        localStorage.setItem('chatty_wallet_target', newTarget.toString());
        localStorage.setItem('chatty_wallet_start_date', newStartDate);
      }
      
      setShowModal(false);
      setTargetInput('');
      setStartDateInput('');
    }
  };
  
  // Save target, period, and startDate to Supabase whenever they change
  useEffect(() => {
    if (loadingSettings) return; // Don't save during initial load
    
    const saveSettings = async () => {
      if (user) {
        await saveUserSettings(user.id, {
          analytics_target: target,
          analytics_period: period,
          analytics_start_date: startDate
        });
      } else {
        // Fallback to localStorage if not logged in
        localStorage.setItem('chatty_wallet_target', target.toString());
        localStorage.setItem('chatty_wallet_period', period);
        localStorage.setItem('chatty_wallet_start_date', startDate);
      }
    };
    
    saveSettings();
  }, [target, period, startDate, user, loadingSettings]);

  const renderMonthlySpending = () => {
    if (monthOptions.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-black rounded-full text-sm font-medium px-4 py-2 focus:outline-none border-none"
            >
              {yearsAvailable.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={0}
              onChange={() => {}}
              className="bg-transparent text-black rounded-full text-sm font-medium px-4 py-2 focus:outline-none border-none opacity-60 cursor-not-allowed"
              disabled
            >
              <option value={0}>No months available</option>
            </select>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-black">No months to display yet.</p>
          </div>
        </div>
      );
    }

    const safeMonthIndex = monthOptions.includes(selectedMonthIndex)
      ? selectedMonthIndex
      : monthOptions[0];
    const selectedEntry = getMonthlyEntry(selectedYear, safeMonthIndex);
    const selectedTotal = selectedEntry.total ?? 0;

    // Get expenses for selected month
    const selectedMonthExpenses = expenses.filter(expense => {
      try {
        const expenseDate = parseExpenseDate(expense.date);
        if (!expenseDate) return false;
        return expenseDate.getMonth() === safeMonthIndex && expenseDate.getFullYear() === selectedYear;
      } catch (e) {
        return false;
      }
    });

    // Group by category
    const categoryTotals = {};
    selectedMonthExpenses.forEach(expense => {
      const category = expense.category || 'other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Math.abs(expense.amount);
    });

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: selectedTotal > 0 ? (amount / selectedTotal) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Colors for pie chart
    const categoryColors = {
      shopping: '#FFB5E8',
      food: '#B5E8B5',
      transport: '#B5D4FF',
      entertainment: '#FFE8B5',
      other: '#E5E7EB'
    };

    // Generate pie chart SVG
    const pieSize = 200;
    const radius = pieSize / 2 - 10;
    const centerX = pieSize / 2;
    const centerY = pieSize / 2;
    let currentAngle = -90; // Start from top

    const pieSlices = sortedCategories.map((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      currentAngle += angle;

      return {
        ...item,
        path: pathData,
        color: categoryColors[item.category] || categoryColors.other
      };
    });

    return (
      <div className="space-y-4">
        <div className="text-left">
          <p className="text-4xl font-extrabold text-black tracking-tight">
            ${formatCurrency(selectedTotal)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-600">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer"
            >
              {yearsAvailable.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">
              ▼
            </span>
          </div>
          <div className="relative">
            <select
              value={safeMonthIndex}
              onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value, 10))}
              className="appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer"
            >
              {monthOptions.map((idx) => (
                <option key={idx} value={idx}>
                  {new Date(selectedYear, idx, 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">
              ▼
            </span>
          </div>
        </div>

        {selectedTotal > 0 ? (
          <>
            {/* Pie Chart */}
            <div className="flex justify-center mb-6">
              <svg width={pieSize} height={pieSize} viewBox={`0 0 ${pieSize} ${pieSize}`}>
                {pieSlices.map((slice, index) => (
                  <path
                    key={index}
                    d={slice.path}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {sortedCategories.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoryColors[item.category] || categoryColors.other }}
                    ></div>
                    <span className="text-sm font-medium text-black capitalize">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-black">
                      ${formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">
              No spending recorded for this month yet.
            </p>
          </div>
        )}
      </div>
    );
  };
;

  if (showTrackerDetail) {
    return (
      <div className="p-6 pb-24 min-h-screen space-y-6 bg-[#F8F9FB]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setShowTrackerDetail(false)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Back to analytics"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L6 10L12 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-[18px] bg-black text-white flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3L13.6 9.4L20 11L13.6 12.6L12 19L10.4 12.6L4 11L10.4 9.4L12 3Z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-3xl font-semibold text-black tracking-tight">Tracker</p>
          </div>
          <div className="w-10 h-10" />
        </div>
 
        <div className="bg-white rounded-[32px] p-6 shadow-sm">
          {renderTrackerContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 min-h-screen space-y-6">
      {/* Header */}
      <div className="-mx-6 -mt-6 px-6 pt-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <LoadingIcon size={28} strokeWidth={2} />
            <h1 className="text-2xl font-bold text-black">Budget Pulse</h1>
          </div>
          <button 
            onClick={() => {
              setStartDateInput(startDate);
              setTargetInput(target.toString());
              setShowModal(true);
            }}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="6.25" cy="6.25" r="1.75" stroke="currentColor" strokeWidth="1.6" />
              <line x1="8.75" y1="6.25" x2="16" y2="6.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="13.75" cy="13.75" r="1.75" stroke="currentColor" strokeWidth="1.6" />
              <line x1="4" y1="13.75" x2="11.25" y2="13.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="rounded-[32px] px-6 pt-8 pb-10 relative overflow-hidden bg-black">
        <div
          className="relative flex justify-center items-end mb-3 mx-auto"
          style={{ height: '150px', width: '100%', maxWidth: '300px' }}
        >
          <svg viewBox="0 0 340 180" className="absolute bottom-0 w-full h-auto">
            <defs>
              <pattern
                id="scratchPattern"
                patternUnits="userSpaceOnUse"
                width="12"
                height="12"
                patternTransform="rotate(20)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="12"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  strokeLinecap="square"
                  opacity="0.7"
                />
              </pattern>
              <mask id="progressMask">
                <path
                  d="M 20 180 A 150 150 0 0 1 320 180"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="28"
                  strokeLinecap="square"
                  strokeDasharray={`${spendingPercentage * 4.71} 471`}
                />
              </mask>
            </defs>
            <path
              d="M 20 180 A 150 150 0 0 1 320 180"
              fill="none"
              stroke="url(#scratchPattern)"
              strokeWidth="28"
              strokeLinecap="square"
            />
            <path
              d="M 20 180 A 150 150 0 0 1 320 180"
              fill="none"
              stroke="#F35DC8"
              strokeWidth="28"
              strokeLinecap="square"
              mask="url(#progressMask)"
            />
          </svg>
          
          <div
            className="absolute left-1/2 text-center w-full flex flex-col items-center"
            style={{ top: '67%', transform: 'translate(-50%, -50%)' }}
          >
            <p className="text-xs text-white/70 mb-1">${totalExpenses.toFixed(2)} Spent</p>
            <p className="text-5xl font-bold text-white mb-1">{spendingPercentage}%</p>
            <p className="text-sm text-white/70">Target • ${target}</p>
          </div>
        </div>
        
        <div
          className="flex justify-between text-xs text-white/60"
          style={{
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <p className="font-semibold text-white">{dateRange.start}</p>
            <p>Start</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="font-semibold text-white">{dateRange.end}</p>
            <p>End</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setActivityView('tracker');
            setShowTrackerDetail(true);
          }}
          className="rounded-[20px] border border-gray-200 bg-white px-6 py-5 flex flex-col gap-6 text-left transition hover:border-black/30 focus:outline-none"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-gray-600">Daily Goal</p>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#FACC15] text-[#FACC15] bg-white">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 6L16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold text-black tracking-tight">
            ${formatCurrency(Number.isFinite(dailyGoal) ? dailyGoal : 0)}
          </p>
        </button>

        <div className="rounded-[20px] border border-gray-200 bg-white px-6 py-5 flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-gray-600">Current Streak</p>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#34D399] text-[#34D399] bg-white">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-semibold text-black tracking-tight">
            {goalStreak} {goalStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Activity Section */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm -mx-6">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-[18px] p-1 flex gap-1 w-full max-w-md">
            <button
              type="button"
              onClick={() => setActivityView('tracker')}
              className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
                activityView === 'tracker'
                  ? 'bg-white text-black shadow'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Tracker
            </button>
            <button
              type="button"
              onClick={() => setActivityView('monthly')}
              className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
                activityView === 'monthly'
                  ? 'bg-white text-black shadow'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {activityView === 'tracker' ? (
          <>
            {renderTrackerContent()}
          </>
        ) : (
          <div className="mt-4">
            {renderMonthlySpending()}
          </div>
        )}
      </div>

      {/* Target Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 mx-4">
            <h2 className="text-xl font-bold text-black mb-2" style={{ fontFamily: 'sans-serif' }}>Set Target Goal</h2>
            <p className="text-sm text-gray-600 mb-6">Enter your savings goal and period</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white text-black font-normal"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '40px',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="week">1 Week</option>
                <option value="2weeks">2 Weeks</option>
                <option value="3weeks">3 Weeks</option>
                <option value="month">1 Month</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDateInput || startDate}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10 text-black"
                  style={{ 
                    colorScheme: 'light'
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount ($)
              </label>
              <input
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
              {targetInput && !isNaN(parseFloat(targetInput)) && parseFloat(targetInput) > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Daily Goal: ${Math.round(parseFloat(targetInput) / daysInPeriod)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTargetInput('');
                  setStartDateInput('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                style={{ fontFamily: 'sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetTarget}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                style={{ fontFamily: 'sans-serif' }}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AnalyticsPage;
