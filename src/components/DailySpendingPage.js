import React from 'react';

function DailySpendingPage({ transactions = [], selectedDate, onBack, currentDay, dayStatuses = {} }) {
  // Set default selectedDate to today if not provided
  const today = new Date();
  const actualSelectedDate = selectedDate !== undefined && selectedDate !== null ? selectedDate : today.getDate();
  const actualCurrentDay = currentDay !== undefined ? currentDay : today.getDate();
  // Week days
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Category colors
  const palette = ['#F35DC8', '#A4F982', '#AFF2FC'];
  const categoryOrder = ['shopping', 'food', 'transport', 'entertainment'];
  const categoryColors = categoryOrder.reduce((acc, category, index) => {
    acc[category] = {
      bg: palette[index % palette.length],
      name:
        category === 'shopping'
          ? 'Shopping'
          : category === 'food'
          ? 'Food'
          : category === 'transport'
          ? 'Transport'
          : 'Entertainment',
    };
    return acc;
  }, {});

  // Get transactions for selected date
  const getTransactionsForDate = (day) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    
    // Format as "Nov 4" to match transaction date format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${monthNames[targetDate.getMonth()]} ${targetDate.getDate()}`;
    
    return transactions.filter(t => {
      if (!t.date) return false;
      // Match both "Nov 4" format and "MM/DD" format
      if (t.date === formattedDate) return true;
      // Also check MM/DD format
      const mmddFormat = `${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(targetDate.getDate()).padStart(2, '0')}`;
      return t.date === mmddFormat;
    });
  };

  // Get category summary for selected date
  const getCategorySummary = (day) => {
    const dayTransactions = getTransactionsForDate(day);
    const summary = {};
    
    dayTransactions.forEach(t => {
      // Only include expenses in category summary
      if (t.type === 'expense') {
        const category = t.category || 'other';
        summary[category] = (summary[category] || 0) + Math.abs(t.amount);
      }
    });
    
    return summary;
  };

  // Group transactions by time of day
  const groupByTimeOfDay = (dayTransactions) => {
    const groups = {
      Morning: [],
      Afternoon: [],
      Evening: []
    };
    
    dayTransactions.forEach(t => {
      // Parse transaction time if available
      let hour = 12; // default to afternoon
      if (t.time) {
        const timeParts = t.time.split(':');
        hour = parseInt(timeParts[0], 10);
      }
      
      if (hour < 12) {
        groups.Morning.push(t);
      } else if (hour < 18) {
        groups.Afternoon.push(t);
      } else {
        groups.Evening.push(t);
      }
    });
    
    return groups;
  };

  // Get week range for selected date
  const getWeekDays = () => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), actualSelectedDate);
    if (isNaN(targetDate.getTime())) {
      // If date is invalid, use today
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay();
      const startOfWeek = new Date(todayDate);
      startOfWeek.setDate(todayDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date.getDate());
      }
      return weekDates;
    }
    
    const dayOfWeek = targetDate.getDay();
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date.getDate());
    }
    return weekDates;
  };

  // Main render logic
  const dayTransactions = getTransactionsForDate(actualSelectedDate);
  const categorySummary = getCategorySummary(actualSelectedDate);
  const groupedTransactions = groupByTimeOfDay(dayTransactions);
  const weekDates = getWeekDays();
  
  // Get all categories with amounts (show 0 if no spending)
  const allCategories = Object.keys(categoryColors).map(category => ({
    category,
    amount: categorySummary[category] || 0,
    colorInfo: categoryColors[category]
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="p-6 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (onBack && typeof onBack === 'function') {
              onBack(null);
            }
          }}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L6 10L12 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-black">Daily Spending</h1>
        <div className="w-10 h-10"></div>
      </div>

      {/* Week Days */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const date = weekDates[index];
            if (!date || isNaN(date)) return null;
            const isSelected = date === actualSelectedDate;
            const status = dayStatuses ? dayStatuses[date] : undefined;
            const isDisabled = date > actualCurrentDay;
            let buttonClasses = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ';
            if (isDisabled) {
              buttonClasses += 'bg-gray-100 text-gray-400 cursor-not-allowed';
            } else if (isSelected) {
              buttonClasses += 'bg-black text-white';
            } else if (status === 'exceeded') {
              buttonClasses += 'bg-[#F35DC8] text-white hover:brightness-110';
            } else if (status === 'good') {
              buttonClasses += 'bg-[#A4F982] text-black hover:brightness-110';
            } else if (status === 'inactive') {
              buttonClasses += 'bg-[#ECEFF3] text-gray-400';
            } else {
              buttonClasses += 'bg-[#F1F5F9] text-gray-600 hover:bg-gray-200';
            }
            return (
              <div key={day} className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-2">{day}</div>
                <button
                  onClick={() => {
                    if (!isDisabled && onBack) {
                      // onBack이 함수인 경우 날짜를 전달, 아니면 null 전달
                      if (typeof onBack === 'function' && onBack.length === 0) {
                        onBack();
                      } else if (typeof onBack === 'function') {
                        onBack(date);
                      }
                    }
                  }}
                  disabled={isDisabled}
                  className={buttonClasses}
                >
                  {date}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-4">Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {allCategories.slice(0, 3).map(({ category, amount, colorInfo }) => {
            return (
              <div
                key={category}
                className="rounded-3xl p-4 flex flex-col items-center justify-center"
                style={{ 
                  backgroundColor: colorInfo.bg,
                  minHeight: '100px'
                }}
              >
                <div className="text-xs text-black opacity-60 mb-1">{colorInfo.name}</div>
                <div className="text-xl font-bold text-black">${Math.round(amount)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Transactions */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-4">Today's Transactions</h2>
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([timeOfDay, txns]) => (
            txns.length > 0 && (
              <div key={timeOfDay}>
                <div className="text-sm font-semibold text-gray-700 mb-3">{timeOfDay}</div>
                <div className="space-y-3">
                  {txns.map((txn) => (
                    <div
                      key={txn.id}
                      className="transaction-card group"
                      style={{
                        background: '#F8F8F8',
                        borderRadius: '16px',
                        padding: '16px',
                        position: 'relative'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        {/* Left: Title and Category */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-base font-semibold text-black mb-1">{txn.description}</h3>
                          <p className="text-xs text-gray-500">
                            {txn.type === 'expense' ? 'Expense' : 'Income'} / {txn.category ? (txn.category.charAt(0).toUpperCase() + txn.category.slice(1)) : 'Uncategorized'}
                          </p>
                        </div>
                        {/* Right: Amount and Date/Time */}
                        <div className="flex flex-col items-end">
                          <p className={`text-base font-bold mb-1 ${txn.type === 'expense' ? 'amount-red' : 'amount-green'}`}>
                            ${Math.abs(txn.amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {txn.time || '00:00'} {txn.date || 'Jan 1'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {dayTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions for this day
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="mt-8">
        <button className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
          Add a transaction
        </button>
      </div>
    </div>
  );
}

export default DailySpendingPage;
