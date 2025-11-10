import React, { useMemo, useState } from 'react';
import LoadingIcon from './LoadingIcon';

function MoodPage({ transactions = [] }) {
  const expenses = useMemo(() => transactions.filter((t) => t.type === 'expense'), [transactions]);
  const expensesWithMood = useMemo(() => expenses.filter((t) => t.mood), [expenses]);

  const progressGradientStops = useMemo(
    () => ({
      start: '#FFE68A',
      end: '#FF6B6B',
    }),
    []
  );

  const moodStats = useMemo(() => {
    const base = {
      happy: { count: 0, total: 0, emoji: '🙂', label: 'Happy' },
      neutral: { count: 0, total: 0, emoji: '😐', label: 'Neutral' },
      sad: { count: 0, total: 0, emoji: '🫠', label: 'Sad' },
    };

    expensesWithMood.forEach((expense) => {
      const key = expense.mood;
      if (key && base[key]) {
        base[key].count += 1;
        base[key].total += Math.abs(expense.amount);
      }
    });

    return base;
  }, [expensesWithMood]);

  const totalMoodCount = useMemo(
    () => expensesWithMood.reduce((sum, t) => sum + (t.mood ? 1 : 0), 0),
    [expensesWithMood]
  );
  const totalMoodExpenses = useMemo(
    () => expensesWithMood.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [expensesWithMood]
  );

  const [selectedMood, setSelectedMood] = useState(null);

  const formatCurrency = (value) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const moodTransactions = useMemo(() => {
    if (!selectedMood) return [];
    return expensesWithMood.filter((t) => t.mood === selectedMood);
  }, [expensesWithMood, selectedMood]);

  return (
    <div className="p-6 pb-24 min-h-screen relative">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <LoadingIcon size={28} strokeWidth={2} />
          <h1 className="text-3xl font-semibold text-black mb-2">Mood Statistics</h1>
        </div>
        <p className="text-sm text-gray-500">
          Track how your spending habits align with your feelings.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(moodStats).map(([moodKey, stats]) => {
          const countPercentage =
            totalMoodCount > 0 ? Math.round((stats.count / totalMoodCount) * 100) : 0;
          const amountPercentage =
            totalMoodExpenses > 0 ? Math.round((stats.total / totalMoodExpenses) * 100) : 0;

          return (
            <div
              key={moodKey}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer transition hover:shadow-md"
              onClick={() => setSelectedMood(moodKey)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{stats.emoji}</span>
                  <div>
                    <p className="text-lg font-semibold text-black">{stats.label}</p>
                    <p className="text-xs text-gray-500">{stats.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-black">${formatCurrency(stats.total)}</p>
                  <p className="text-xs text-gray-500">{amountPercentage}% of total</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${countPercentage}%`,
                    background: `linear-gradient(90deg, ${progressGradientStops.start}, ${progressGradientStops.end})`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}

        {totalMoodCount === 0 && (
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100">
            <p className="text-sm text-gray-500">
              No mood data yet. Add moods to your expenses to see insights.
            </p>
          </div>
        )}
      </div>

      {selectedMood && (
        <>
          <div
            className="absolute inset-0 bg-black bg-opacity-40 z-[100]"
            onClick={() => setSelectedMood(null)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[101] max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedMood === 'happy' ? '🙂' : selectedMood === 'neutral' ? '😐' : '🫠'}
                </span>
                <h3 className="text-lg font-semibold text-black capitalize">
                  {selectedMood} expenses
                </h3>
              </div>
              <button
                onClick={() => setSelectedMood(null)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {moodTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No transactions found for this mood.
              </p>
            ) : (
              <div className="space-y-3">
                {moodTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-black break-words">
                            {transaction.description || 'Untitled'}
                          </h4>
                          <span className="text-base flex-shrink-0">
                            {selectedMood === 'happy'
                              ? '🙂'
                              : selectedMood === 'neutral'
                              ? '😐'
                              : '🫠'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(transaction.category || 'uncategorized')
                            .toString()
                            .replace(/^\w/, (c) => c.toUpperCase())}
                        </p>
                        {transaction.notes && (
                          <p className="text-xs text-gray-400 mt-2 italic break-words">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <p className="text-sm font-bold text-black">
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(transaction.time || '00:00')} {(transaction.date || 'Jan 1')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MoodPage;

