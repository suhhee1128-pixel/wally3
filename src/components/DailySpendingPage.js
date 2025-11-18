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
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="mb-6 pl-6 pr-6 pt-6">
        <button
          onClick={() => {
            if (onBack && typeof onBack === 'function') {
              onBack(null);
            }
          }}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L6 10L12 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-black">Daily Spending</h1>
      </div>

      {/* Week Days */}
      <div className="mb-6 px-6">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const date = weekDates[index];
            if (!date || isNaN(date)) return null;
            const isSelected = date === actualSelectedDate;
            const status = dayStatuses ? dayStatuses[date] : undefined;
            const isDisabled = date > actualCurrentDay;
            
            // 선택된 날짜의 원 색상 결정 (상태에 따라)
            let buttonClasses = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ';
            if (isDisabled) {
              buttonClasses += 'bg-gray-100 text-gray-400 cursor-not-allowed';
            } else if (isSelected) {
              // 선택된 날짜는 상태에 따라 색상 변경
              if (status === 'exceeded') {
                buttonClasses += 'bg-[#F35DC8] text-white';
              } else if (status === 'good') {
                buttonClasses += 'bg-[#A4F982] text-black';
              } else {
                buttonClasses += 'bg-black text-white';
              }
            } else if (status === 'exceeded') {
              buttonClasses += 'bg-[#F35DC8] text-white hover:brightness-110';
            } else if (status === 'good') {
              buttonClasses += 'bg-[#A4F982] text-black hover:brightness-110';
            } else if (status === 'inactive') {
              buttonClasses += 'bg-[#ECEFF3] text-gray-400';
            } else {
              buttonClasses += 'bg-[#F1F5F9] text-gray-600 hover:bg-gray-200';
            }
            
            // 선택된 날짜의 배경 박스 색상 결정
            let backgroundBoxClass = '';
            let textColorClass = 'text-gray-500';
            if (isSelected) {
              if (status === 'exceeded') {
                backgroundBoxClass = 'bg-[#F35DC8]/20'; // 연한 핑크색
                textColorClass = 'text-gray-700';
              } else if (status === 'good') {
                backgroundBoxClass = 'bg-[#A4F982]/30'; // 연한 녹색
                textColorClass = 'text-gray-700';
              } else {
                backgroundBoxClass = 'bg-gray-100'; // 기본 회색
              }
            }
            
            return (
              <div 
                key={day} 
                className={`flex flex-col items-center px-2 pt-2 pb-2 mx-1 transition-all`}
              >
                <div className={`text-xs ${textColorClass} mb-2 h-6 flex items-center justify-center ${isSelected && backgroundBoxClass ? `${backgroundBoxClass} rounded-[8px] px-2 py-1` : ''}`}>{day}</div>
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
      <div className="mb-6 px-6">
        <h2 className="text-xl font-bold text-black mb-4">Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {allCategories.slice(0, 3).map(({ category, amount, colorInfo }) => {
            // 최대 금액 계산 (0이 아닌 경우)
            const maxAmount = Math.max(...allCategories.slice(0, 3).map(c => c.amount), 1);
            // 비율 계산 (최소 5%는 표시)
            const percentage = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, amount > 0 ? 5 : 0) : 0;
            
            return (
              <div
                key={category}
                className="rounded-[12px] bg-gray-100 flex flex-col justify-end relative overflow-hidden"
                style={{ 
                  minHeight: '120px',
                  height: '120px'
                }}
              >
                {/* 색상이 차오르는 부분 */}
                <div
                  className="w-full flex flex-col items-center justify-end relative"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: colorInfo.bg,
                    transition: 'height 0.3s ease'
                  }}
                >
                  {/* 카테고리 이름과 금액 */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-center justify-center">
                    <div className="text-xs text-black opacity-60 mb-1">{colorInfo.name}</div>
                    <div className="text-xl font-bold text-black">${Math.round(amount)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Transactions */}
      <div className="mb-6 px-6">
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
                        borderRadius: '12px',
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
      <div className="mt-8 px-6">
        <button className="w-full bg-black text-white py-4 rounded-[12px] font-medium hover:bg-gray-800 transition-colors">
          Add a transaction
        </button>
      </div>
    </div>
  );
}

export default DailySpendingPage;
