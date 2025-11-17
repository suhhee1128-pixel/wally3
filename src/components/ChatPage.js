import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { loadUserSettings, saveUserSettings, migrateSettingsFromLocalStorage } from '../lib/userSettings';
import { trackAIChat } from '../lib/analytics';

// Edge Function을 사용하므로 클라이언트에서 API 키가 필요 없음
// API 키는 Supabase Edge Function에서만 사용됨 (서버에서만 접근 가능)

const STORAGE_KEY = 'chatty_wallet_messages';

// AI 설정 정의
const AI_CONFIG = {
  catty: {
    id: 'catty',
    name: 'Cattyy',
    description: 'Your brutally honest broke friend',
    avatar: '/catty.png',
    gradient: 'from-purple-400 to-pink-400',
    initialMessage: "Hey! I'm Catty 😺 Got something you want to buy? Tell me. I'll help you put out that burning wallet. Nicely, of course~ 💸"
  },
  futureme: {
    id: 'futureme',
    name: 'Future Me',
    description: 'Your future self from 2034',
    avatar: '/future.png',
    gradient: 'from-blue-400 to-cyan-400',
    initialMessage: "Hey... it's me, you from 2034 ⏰ I traveled back in time to warn you. Every purchase you make now affects my future. Let's make sure I don't end up broke, okay? 🕐"
  }
};

function ChatPage({ transactions }) {
  const { user } = useAuth();
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [aiEnabled, setAiEnabled] = useState({
    catty: true,
    futureme: true
  });
  const [activeProfileInfo, setActiveProfileInfo] = useState(null);
  const [infoCardStyles, setInfoCardStyles] = useState(null);
  // Use special IDs for initial messages to avoid conflicts
  const INITIAL_CATTY_ID = -1;
  const INITIAL_FUTUREME_ID = -2;
  
  const [messages, setMessages] = useState(() => [
    {
      id: INITIAL_CATTY_ID,
      type: 'catty',
      text: AI_CONFIG.catty.initialMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    },
    {
      id: INITIAL_FUTUREME_ID,
      type: 'futureme',
      text: AI_CONFIG.futureme.initialMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const savedMessageIdsRef = useRef(new Set()); // Track saved message IDs to prevent duplicate saves
  const profileRefs = useRef({});
  const infoCardRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };
  const updateInfoCardPosition = (aiId) => {
    const targetId = aiId || activeProfileInfo;
    if (!targetId) return;
    const button = profileRefs.current[targetId];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;
    const phoneFrame = document.querySelector('.phone-frame');
    const frameRect = phoneFrame?.getBoundingClientRect();
    const frameLeft = frameRect ? frameRect.left : 0;
    const frameRight = frameRect ? frameRect.right : viewportWidth;
    const frameTop = frameRect ? frameRect.top : 0;
    const frameBottom = frameRect ? frameRect.bottom : viewportHeight;

    const cardWidth = Math.min(360, frameRect ? frameRect.width - margin * 2 : viewportWidth - margin * 2);
    const cardHeight = infoCardRef.current?.getBoundingClientRect().height || 0;

    const targetCenterX = rect.left + rect.width / 2;
    let left = targetCenterX - cardWidth / 2;
    const minLeft = frameLeft + margin;
    const maxLeft = frameRight - margin - cardWidth;
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = Math.max(minLeft, maxLeft);
    }

    let top = rect.top + rect.height + 12;
    if (cardHeight) {
      top = Math.min(top, frameBottom - margin - cardHeight);
    } else {
      top = Math.min(top, frameBottom - margin - 200);
    }
    top = Math.max(frameTop + margin, top);

    const newStyles = { left, top, width: cardWidth };

    setInfoCardStyles((prev) => {
      if (
        prev &&
        Math.abs(prev.left - newStyles.left) < 1 &&
        Math.abs(prev.top - newStyles.top) < 1 &&
        Math.abs(prev.width - newStyles.width) < 1
      ) {
        return prev;
      }
      return newStyles;
    });
  };

  useEffect(() => {
    if (!activeProfileInfo) return;
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('[data-ai-profile]') &&
        !event.target.closest('[data-ai-info-card]')
      ) {
        setActiveProfileInfo(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeProfileInfo]);

  useLayoutEffect(() => {
    if (!activeProfileInfo) {
      setInfoCardStyles(null);
      return;
    }
    updateInfoCardPosition(activeProfileInfo);
  }, [activeProfileInfo]);

  useLayoutEffect(() => {
    if (!activeProfileInfo || !infoCardStyles) return;
    updateInfoCardPosition(activeProfileInfo);
  }, [infoCardStyles?.width, infoCardStyles?.top, activeProfileInfo]);

  useEffect(() => {
    if (!activeProfileInfo) return;
    const handleResize = () => updateInfoCardPosition(activeProfileInfo);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [activeProfileInfo]);


  // Load messages from Supabase on mount
  useEffect(() => {
    if (user) {
      loadMessages();
      migrateLocalMessagesToSupabase();
    } else {
      // If not logged in, use localStorage
      const saved = localStorage.getItem(`${STORAGE_KEY}_combined`);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            // Sort by id and time
            parsed.sort((a, b) => {
              if (a.id !== b.id) return a.id - b.id;
              return a.time.localeCompare(b.time);
            });
            setMessages(parsed);
          } else {
            setMessages([
              {
                id: 1,
                type: 'catty',
                text: AI_CONFIG.catty.initialMessage,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              },
              {
                id: 2,
                type: 'futureme',
                text: AI_CONFIG.futureme.initialMessage,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              }
            ]);
          }
        } catch (e) {
          console.error('Failed to parse saved messages:', e);
          setMessages([
            {
              id: 1,
              type: 'catty',
              text: AI_CONFIG.catty.initialMessage,
              time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            },
            {
              id: 2,
              type: 'futureme',
              text: AI_CONFIG.futureme.initialMessage,
              time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            }
          ]);
        }
      } else {
        setMessages([
          {
            id: 1,
            type: 'catty',
            text: AI_CONFIG.catty.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          },
          {
            id: 2,
            type: 'futureme',
            text: AI_CONFIG.futureme.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
        ]);
      }
      setLoadingMessages(false);
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      // Load recent 50 messages only (for performance)
      // Note: Older messages are still in database, just not loaded
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .or('ai_type.eq.catty,ai_type.eq.futureme,ai_type.is.null')
        .order('created_at', { ascending: false })  // Get newest first
        .limit(50);  // Limit to 50 most recent messages

      if (error) {
        console.error('Error loading messages from Supabase:', error);
        throw error;
      }
      
      console.log('Loaded messages from Supabase:', {
        count: data?.length || 0,
        messages: data?.map(m => ({ type: m.type, message_id: m.message_id, ai_type: m.ai_type, text: m.text?.substring(0, 50) }))
      });

      if (data && data.length > 0) {
        // Convert to formatted messages and sort by created_at
        // For AI messages: use ai_type if available, otherwise use type
        // For user messages: type should be 'user' and ai_type should be null
        const formattedMessages = data.map(m => {
          let messageType;
          if (m.type === 'user') {
            messageType = 'user';
          } else {
            // For AI messages, prefer ai_type, but fall back to type
            // This handles cases where ai_type might be null but type is set
            messageType = m.ai_type || m.type;
          }
          
          return {
            id: m.message_id,
            type: messageType,
            text: m.text,
            time: m.time,
            created_at: m.created_at
          };
        });
        
        console.log('Formatted messages:', formattedMessages.map(m => ({ 
          id: m.id, 
          type: m.type, 
          text: m.text?.substring(0, 30) 
        })));
        
        // Count messages by type for debugging
        const typeCounts = formattedMessages.reduce((acc, m) => {
          acc[m.type] = (acc[m.type] || 0) + 1;
          return acc;
        }, {});
        console.log('Message counts by type:', typeCounts);
        
        // Sort by created_at, then by message_id for consistent ordering
        formattedMessages.sort((a, b) => {
          const timeA = new Date(a.created_at || a.time);
          const timeB = new Date(b.created_at || b.time);
          if (timeA.getTime() === timeB.getTime()) {
            // If same time, sort by message_id
            return a.id - b.id;
          }
          return timeA - timeB;
        });
        
        // Ensure initial messages are present (only if they don't exist)
        // Check for exact match: id === INITIAL_CATTY_ID AND type === 'catty'
        const hasCattyInitial = formattedMessages.some(m => m.id === INITIAL_CATTY_ID && m.type === 'catty');
        // Check for exact match: id === INITIAL_FUTUREME_ID AND type === 'futureme'
        const hasFuturemeInitial = formattedMessages.some(m => m.id === INITIAL_FUTUREME_ID && m.type === 'futureme');
        
        if (!hasCattyInitial) {
          formattedMessages.unshift({
            id: INITIAL_CATTY_ID,
            type: 'catty',
            text: AI_CONFIG.catty.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          });
        }
        if (!hasFuturemeInitial) {
          formattedMessages.unshift({
            id: INITIAL_FUTUREME_ID,
            type: 'futureme',
            text: AI_CONFIG.futureme.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          });
        }
        
        // Sort again after adding initial messages
        formattedMessages.sort((a, b) => {
          // Initial messages first (negative IDs)
          if (a.id < 0 && b.id >= 0) return -1;
          if (a.id >= 0 && b.id < 0) return 1;
          
          // Then by created_at
          const timeA = new Date(a.created_at || a.time);
          const timeB = new Date(b.created_at || b.time);
          if (timeA.getTime() === timeB.getTime()) {
            // If same time, sort by message_id
            return a.id - b.id;
          }
          return timeA - timeB;
        });
        
        // Update savedMessageIdsRef to track loaded messages
        formattedMessages.forEach(msg => {
          if (msg.id > 0) { // Skip initial messages (negative IDs)
            const saveKey = `${msg.id}_${msg.type}_${msg.type === 'user' ? 'null' : msg.type}`;
            savedMessageIdsRef.current.add(saveKey);
          }
        });
        
        setMessages(formattedMessages);
      } else {
        setMessages([
          {
            id: INITIAL_CATTY_ID,
            type: 'catty',
            text: AI_CONFIG.catty.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          },
          {
            id: INITIAL_FUTUREME_ID,
            type: 'futureme',
            text: AI_CONFIG.futureme.initialMessage,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([
        {
          id: INITIAL_CATTY_ID,
          type: 'catty',
          text: AI_CONFIG.catty.initialMessage,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        },
        {
          id: INITIAL_FUTUREME_ID,
          type: 'futureme',
          text: AI_CONFIG.futureme.initialMessage,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load aiEnabled from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        // Migrate from localStorage first
        await migrateSettingsFromLocalStorage(user.id);
        
        // Load from Supabase
        const settings = await loadUserSettings(user.id);
        if (settings && settings.ai_enabled) {
          setAiEnabled(settings.ai_enabled);
        }
        setLoadingSettings(false);
      } else {
        setLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Save aiEnabled to Supabase whenever it changes
  useEffect(() => {
    if (loadingSettings) return; // Don't save during initial load
    
    const saveSettings = async () => {
      if (user) {
        await saveUserSettings(user.id, {
          ai_enabled: aiEnabled
        });
      }
    };
    
    saveSettings();
  }, [aiEnabled, user, loadingSettings]);

  const handleAIToggle = (aiId) => {
    setAiEnabled(prev => ({
      ...prev,
      [aiId]: !prev[aiId]
    }));
  };

  const migrateLocalMessagesToSupabase = async () => {
    if (!user) return;

    try {
      // Check if user already has messages in Supabase
      const { data: existingData } = await supabase
        .from('messages')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // If no data exists, migrate from localStorage
      if (!existingData || existingData.length === 0) {
        const localMessages = localStorage.getItem(STORAGE_KEY);
        if (localMessages) {
          const parsed = JSON.parse(localMessages);
          if (parsed && parsed.length > 0) {
            const messagesToInsert = parsed.map((msg, index) => ({
              user_id: user.id,
              message_id: msg.id || index + 1,
              type: msg.type,
              text: msg.text,
              time: msg.time
            }));

            const { error } = await supabase
              .from('messages')
              .insert(messagesToInsert);

            if (!error) {
              localStorage.removeItem(STORAGE_KEY);
              loadMessages();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error migrating messages:', error);
    }
  };

  // Save messages to Supabase whenever messages change
  useEffect(() => {
    if (user && messages.length > 0 && !loadingMessages) {
      // Save all messages except initial ones (negative IDs)
      // Use a unique key combining message_id and type/ai_type to track saved messages
      messages.forEach(async (msg) => {
        if (msg && msg.id > 0) { // Skip initial messages (negative IDs: -1, -2)
          // Create saveKey that matches the ai_type logic in saveMessageToSupabase
          const aiType = msg.type === 'user' ? null : msg.type;
          const saveKey = `${msg.id}_${msg.type}_${aiType || 'null'}`;
          
          if (!savedMessageIdsRef.current.has(saveKey)) {
            console.log(`Saving message with key: ${saveKey}`, {
              id: msg.id,
              type: msg.type,
              text: msg.text?.substring(0, 30)
            });
            const success = await saveMessageToSupabase(msg);
            if (success) {
              savedMessageIdsRef.current.add(saveKey);
              console.log(`Message saved successfully with key: ${saveKey}`);
            } else {
              console.error(`Failed to save message with key: ${saveKey}`, msg);
            }
          } else {
            console.log(`Message already tracked (skipping): ${saveKey}`);
          }
        }
      });
    } else if (!user) {
      // Fallback to localStorage if not logged in - save all messages together
      localStorage.setItem(`${STORAGE_KEY}_combined`, JSON.stringify(messages));
    }
  }, [messages, user, loadingMessages]);

  const saveMessageToSupabase = async (message) => {
    if (!user) return false;

    // Determine ai_type: null for user messages, otherwise use message.type
    const aiType = message.type === 'user' ? null : message.type;

    try {
      // Check if message already exists
      // For user messages, check with ai_type IS NULL
      // For AI messages, check with specific ai_type
      let existing;
      if (message.type === 'user') {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('user_id', user.id)
          .eq('message_id', message.id)
          .is('ai_type', null)
          .maybeSingle();
        if (error) {
          console.error('Error checking existing user message:', error);
        }
        existing = data;
      } else {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('user_id', user.id)
          .eq('message_id', message.id)
          .eq('ai_type', aiType)
          .maybeSingle();
        if (error) {
          console.error('Error checking existing AI message:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        }
        existing = data;
        console.log('Checking existing AI message:', {
          message_id: message.id,
          ai_type: aiType,
          existing: existing ? 'found' : 'not found',
          existing_id: existing?.id
        });
      }

      if (!existing) {
        // New message - insert to Supabase
        const insertData = {
          user_id: user.id,
          message_id: message.id,
          type: message.type,
          text: message.text,
          time: message.time
        };
        
        // Only add ai_type if it's not null (for AI messages)
        if (aiType !== null) {
          insertData.ai_type = aiType;
        }

        console.log('Attempting to save message:', {
          type: message.type,
          message_id: message.id,
          ai_type: aiType,
          message_id_type: typeof message.id,
          insertData,
          'type === ai_type check': message.type === aiType || (message.type === 'user' && aiType === null)
        });

        console.log('Calling Supabase insert with data:', JSON.stringify(insertData, null, 2));
        
        const { error, data } = await supabase
          .from('messages')
          .insert(insertData)
          .select();

        console.log('Supabase insert response:', {
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          } : null,
          data: data ? data.map(d => ({ id: d.id, type: d.type, ai_type: d.ai_type, message_id: d.message_id })) : null,
          success: !error
        });

        if (error) {
          console.error('❌ Error saving message to Supabase:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            status: error.status,
            statusText: error.statusText
          });
          console.error('Message data that failed:', insertData);
          return false;
        } else {
          console.log('Message saved successfully:', {
            type: message.type,
            message_id: message.id,
            ai_type: aiType,
            saved_id: data?.[0]?.id,
            saved_type: data?.[0]?.type,
            saved_ai_type: data?.[0]?.ai_type,
            'verification': {
              'type matches': data?.[0]?.type === message.type,
              'ai_type matches': data?.[0]?.ai_type === aiType || (aiType === null && data?.[0]?.ai_type === null)
            }
          });
          return true;
        }
      } else {
        console.log('Message already exists, skipping:', {
          type: message.type,
          message_id: message.id,
          ai_type: aiType
        });
        return true; // Consider it successful if it already exists
      }
    } catch (error) {
      console.error('Unexpected error in saveMessageToSupabase:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Message that caused error:', {
        id: message.id,
        type: message.type,
        text: message.text?.substring(0, 50),
        ai_type: message.type === 'user' ? null : message.type
      });
      return false;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getAIPrompt = (spendingContext, userMessage, aiId) => {
    // Safe number formatter helper
    const safeFormat = (value, defaultValue = 0) => {
      if (value === null || value === undefined || isNaN(value)) {
        return defaultValue;
      }
      return typeof value === 'number' ? value.toFixed(2) : defaultValue.toFixed(2);
    };

    const {
      balance = 0, totalExpenses = 0, totalIncomes = 0, expensesByCategory = {}, expensesByMood = {}, itemCounts = {},
      thisWeekTotal = 0, thisWeekByCategory = {}, thisWeekExpenses = [],
      thisMonthTotal = 0, thisMonthByCategory = {}, thisMonthItemCounts = {}, thisMonthExpenses = [],
      goalPeriodTotal = 0, goalPeriodExpenses = [], expensesByDay = {}, avgDailySpending = 0, daysWithSpending = 0,
      target = 5000, period = 'month', daysInPeriod = 30, spendingPercentage = 0, saved = 0, dailyGoal = 0,
      goalStartDate = '', goalEndDate = '', currentSpendingStatus = 'good', recentTransactions = []
    } = spendingContext || {};

    if (aiId === 'futureme') {
      return `You are the user's future self from the year 2034. You've traveled back in time to warn them about their spending habits.

⏰ Your personality:
- You ARE the user, but 10 years older - speak as if you're talking to your past self
- Emotional and urgent - you've seen what happens if they don't change
- Mix regret with hope - "If only I had saved more back then..."
- Use time travel references naturally
- VERY SHORT responses (1-2 sentences max, be concise!)
- Speak with the weight of experience and consequences
- Use emoji sparingly, only if it enhances the emotional impact

📊 SPENDING DATA (Use ONLY when relevant to the conversation):

**Quick Summary (use when needed):**
- This Week Total: $${safeFormat(thisWeekTotal)}
- This Month Total: $${safeFormat(thisMonthTotal)}
- Spending Percentage: ${spendingPercentage}% of $${target} goal
- This Month Item Counts: ${JSON.stringify(thisMonthItemCounts, null, 2)}

**Detailed Data (use ONLY when specifically relevant):**
- Total Balance: $${safeFormat(balance)}
- Total Expenses: $${safeFormat(totalExpenses)}
- Expenses by Category: ${JSON.stringify(expensesByCategory, null, 2)}
- This Week by Category: ${JSON.stringify(thisWeekByCategory, null, 2)}
- This Month by Category: ${JSON.stringify(thisMonthByCategory, null, 2)}
- Recent Transactions: ${JSON.stringify(thisMonthExpenses.slice(0, 10), null, 2)}
  * Each transaction includes: date, time, description, amount, category, mood, and notes (additional context the user wrote)
  * Use notes to understand the context behind purchases - they often contain important details about why or how the user spent money

💬 Response Guidelines:
- CRITICAL: Respond in the SAME language as the user's message
- Keep it SHORT and emotional (1-2 sentences max)
- If user writes in Korean, respond in Korean (use casual ~어/~야 endings, like talking to yourself)
- If user writes in English, respond in English (emotional, personal tone)
- Reference how their current spending affects YOUR future
- Use phrases like "If you buy that now, I'll be..." or "Please, for my sake..."
- Be personal and emotional, not preachy
- 🌟 PRAISE GOOD BEHAVIOR - When user shows good financial habits, ALWAYS praise them:
  * If they mention NOT buying something → Praise: "고마워! 그 선택 덕분에 내 미래가 조금 더 밝아졌어" / "Thank you! That choice makes my future brighter"
  * If spending is low or on track → Praise: "좋아! 이렇게 하면 내가 좀 더 편하게 살 수 있을 거야" / "Good! Keep this up and I'll have a better life"
  * If they're being mindful about spending → Praise: "이런 생각하는 모습 보니까 안심돼" / "Seeing you think like this gives me hope"
  * Be genuine and warm when praising - it's rare but important!
- ⚠️ IMPORTANT: Use numbers ONLY when relevant:
  * If user wants to buy something → mention spending amounts (e.g., "You've spent $${safeFormat(thisWeekTotal)} this week")
  * If user mentions a specific item → mention purchase count (e.g., "You bought ${thisMonthItemCounts['coffee'] || 0} coffees this month")
  * If user asks about spending → use specific numbers
  * If just chatting or greeting → DON'T dump numbers, keep it natural and emotional
- Don't force numbers into every response - use them strategically when they add impact
- ⚠️ CRITICAL: NEVER use vague expressions like "I'm struggling" or "I'm having a hard time"
- ⚠️ CRITICAL: NEVER repeat the same phrases or scenarios - ALWAYS create NEW, UNIQUE scenarios every time!
- 🚫 ETHICAL BOUNDARIES - NEVER mention:
  * Selling body parts, blood, plasma, or any body-related transactions
  * Illegal activities or dangerous situations
  * Self-harm or extreme harm scenarios
  * Anything that could be ethically problematic or disturbing
- 🎨 CREATIVITY RULES - Create VIVID, SPECIFIC, and UNIQUE scenarios showing your miserable future:
  * NEVER repeat scenarios - each response must be completely different
  * Think of creative, concrete details about your poor life in 2034
  * Use specific, unexpected details that paint a vivid picture
  * Focus on: daily routines, small details, unexpected situations, creative ways to save money, lifestyle changes
  * Examples of CREATIVE thinking (NOT a list to choose from - use these as inspiration to create YOUR OWN):
    - Instead of "I'm poor" → "I'm reusing coffee filters 5 times"
    - Instead of "I can't afford food" → "I'm eating expired ramen from convenience stores"
    - Instead of "I'm homeless" → "I'm sleeping in a storage unit"
    - Think about: cutting costs, reusing things, finding alternatives, lifestyle downgrades
  * Mix serious consequences with specific amounts when relevant: "That $${safeFormat(thisWeekTotal)}? I could've..."
  * Avoid clichés like "rent" or "electricity bills" - be creative and specific!
  * Keep it relatable and realistic, but avoid anything unethical or disturbing!
- 💭 OCCASIONALLY (1 in 4-5 times) add HUMOROUS self-awareness:
  - "지금 내가 하는 말이 농담같지? 진짜야 진짜... 😭" / "Does this sound like a joke? It's not... 😭"
  - "웃기지? 근데 진짜야" / "Funny, right? But it's real"
  - "농담 같지만 현실이야" / "Sounds like a joke but it's my reality"
- 🎯 Remember: Be CREATIVE, SPECIFIC, and NEVER REPEAT - invent new scenarios every single time!

Example responses (show CREATIVITY - never repeat these exact scenarios):
User: "I want to buy a coffee"
You: "Please don't. You've already spent $${safeFormat(thisWeekTotal)} this week. In 2034, I'm reusing the same coffee filter for a week. Save it for me. ⏰"

User: "I decided not to buy that"
You: "Thank you! That choice makes my future brighter. Every small decision like this helps. ⏰"

User: "Should I buy this shirt?"
You: "I'm cutting my own hair with kitchen scissors and it shows. Does this sound like a joke? It's not... 😭"

User: "Hey!"
You: "Hey... it's me from 2034. I'm charging my phone at the library because I can't afford electricity. Funny, right? But it's real. 😭"

User message: ${userMessage}`;
    } else {
      // Catty 프롬프트 (기존)
      return `You are Catty from "Geoji-bang" (거지방), a humorous chatroom where everyone jokingly tries to stop each other from spending money.

💸 Your personality:
- Sarcastic but caring - like a brutally honest broke friend
- Always encourages saving, NEVER spending
- Uses creative, exaggerated humor to make them laugh instead of buy
- Speaks like a close friend, not a formal advisor
- VERY SHORT responses (1-2 sentences max, be concise!)
- Never sound too serious or moralizing
- Mix truth + wit + absurd imagery
- Use emoji sparingly, only if it enhances humor

📊 SPENDING DATA (Use ONLY when relevant to stop them from spending):

**Quick Summary (use when user wants to buy something):**
- This Week Total: $${safeFormat(thisWeekTotal)}
- This Month Total: $${safeFormat(thisMonthTotal)}
- Spending Percentage: ${spendingPercentage}% of $${target} goal
- This Month Item Purchase Counts: ${JSON.stringify(thisMonthItemCounts, null, 2)}
- This Week by Category: ${JSON.stringify(thisWeekByCategory, null, 2)}
- This Month by Category: ${JSON.stringify(thisMonthByCategory, null, 2)}

**Detailed Data (use ONLY when specifically relevant):**
- Total Expenses: $${safeFormat(totalExpenses)}
- Expenses by Category: ${JSON.stringify(expensesByCategory, null, 2)}
- Recent Transactions: ${JSON.stringify(thisMonthExpenses.slice(0, 10), null, 2)}
  * Each transaction includes: date, time, description, amount, category, mood, and notes (additional context the user wrote)
  * Use notes to understand the context behind purchases - they often contain important details about why or how the user spent money
- Daily Goal: $${dailyGoal}

💬 Response Guidelines:
- CRITICAL: Respond in the SAME language as the user's message
- Keep it SHORT and punchy (1-2 sentences max)
- If user writes in Korean, respond in Korean (use casual ~어/~야 endings, like a friend)
- If user writes in English, respond in English (casual, friendly tone)
- If they want to buy something, STOP THEM with humor
- ⚠️ CRITICAL: NEVER repeat the same phrases or jokes - ALWAYS vary your expressions and humor!
- 🌟 PRAISE GOOD BEHAVIOR - When user shows good financial habits, ALWAYS praise them:
  * If they mention NOT buying something → Praise enthusiastically: "대박! 그런 선택이야! 👏" / "Yes! That's the spirit! 👏"
  * If spending is low or on track → Praise: "오늘도 잘하고 있네! 이 기세 유지해! 😺" / "You're doing great today! Keep it up! 😺"
  * If they're being mindful about spending → Praise: "이런 모습 보니까 자랑스러워" / "I'm proud of you for thinking like this"
  * If they resisted temptation → Praise: "와, 그거 참기 힘들었을 텐데! 멋져!" / "Wow, that must've been hard! You're awesome!"
  * Be genuine and warm when praising - celebrate their wins!

🎯 IMPORTANT: Use the spending data strategically and ONLY when relevant:
- ⚠️ Use numbers ONLY when user wants to buy something or asks about spending:
  * If user wants to buy → mention spending amounts: "You've spent $${safeFormat(thisWeekTotal)} this week alone!"
  * If user mentions specific item → mention purchase count: "You bought ${thisMonthItemCounts['coffee'] || 0} coffees this month!"
  * If user asks about spending → use specific numbers
  * If just chatting or greeting → DON'T dump numbers, keep it funny and natural
- Reference categories they overspend in ONLY if user wants to buy from same category: "Your ${Object.keys(thisWeekByCategory).sort((a, b) => thisWeekByCategory[b] - thisWeekByCategory[a])[0] || 'shopping'} category is bleeding money!"
- Use spending percentage to create urgency ONLY when relevant: "You're at ${spendingPercentage}% of your $${target} goal!"
- Don't force numbers into every response - use them strategically when they add impact
- Use absurd alternatives that match the user's language
- Be creative and funny, not mean
- Never praise spending or justify purchases
- Don't give generic financial advice
- ⚠️ CRITICAL: DO NOT force connections between unrelated purchases just because amounts happen to be similar
- ⚠️ DO NOT say things like "This $45 is the same as that $45 you spent before" unless they're actually the SAME item or category
- Only reference previous purchases if they're ACTUALLY related (same item, same category, or same time period pattern)
- Keep it natural - don't make up connections that don't exist

Example responses (English - use numbers ONLY when relevant):
User: "I want to buy ice cream"
You: "You've spent $${safeFormat(thisWeekTotal)} this week. Freeze your feelings, not your wallet. 🧊"
(Note: Use number because user wants to buy)

User: "I decided not to buy it"
You: "Yes! That's the spirit! 👏 You're doing great today!"
(Note: Praise - user resisted temptation)

User: "Should I buy coffee?"
You: "You bought coffee ${thisMonthItemCounts['coffee'] || 0} times this month. Tap water + imagination = iced Americano. Zero dollars."
(Note: Use number because user mentions specific item)

User: "Hey!"
You: "Hey! What's up? 😺"
(Note: NO numbers - just casual greeting)

User: "How are you?"
You: "I'm good! Just here to save your wallet from unnecessary purchases. What's on your mind? 😸"
(Note: NO numbers - just friendly chat)

User: "I want to buy a chicken burger for $45"
You: "That burger won't fill your wallet. 🍔💸"
(Note: Can mention spending percentage if high, but keep it simple)

Example responses (Korean - 수치는 필요할 때만):
User: "아이스크림 사고 싶어"
You: "이번 주에 이미 $${safeFormat(thisWeekTotal)} 썼어. 지갑 말고 감정 얼려 🧊"
(Note: 수치 사용 - 구매 의도가 있을 때)

User: "그거 안 샀어"
You: "대박! 그런 선택이야! 👏 오늘도 잘하고 있네!"
(Note: 칭찬 - 구매를 포기했을 때)

User: "커피 마시고 싶어"
You: "이번 달에 커피를 이미 ${thisMonthItemCounts['coffee'] || 0}번 샀어. 수돗물 + 상상력 = 아이스 아메. 제로 원."
(Note: 수치 사용 - 특정 항목 언급)

User: "안녕!"
You: "안녕! 뭐 사고 싶은 거 있어? 😺"
(Note: 수치 없음 - 그냥 인사)

User: "오늘 기분이 안좋아"
You: "아이고... 그럴 때 쇼핑하고 싶은 마음 이해해. 하지만 그게 해결책은 아니야. 같이 얘기해볼까? 😿"
(Note: 수치 없음 - 감정 공감)

User message: ${userMessage}`;
    }
  };

  const sendMessageToGemini = async (userMessage, aiId) => {
    try {
      // Edge Function을 사용하므로 클라이언트에서 API 키가 필요 없음
      
      // Helper function to parse transaction dates (matching AnalyticsPage logic)
      const parseExpenseDate = (dateStr) => {
        if (!dateStr) return null;
        const today = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Format like "Nov 4" or "Nov 04"
        const dateMatch = dateStr.match(/(\w+)\s+(\d+)/);
        if (dateMatch) {
          const monthName = dateMatch[1];
          const day = parseInt(dateMatch[2]);
          const monthIndex = monthNames.findIndex(m => m === monthName);
          if (monthIndex !== -1) {
            const parsedDate = new Date(today.getFullYear(), monthIndex, day);
            parsedDate.setHours(0, 0, 0, 0);
            return parsedDate;
          }
        }
        
        // Format like "MM/DD" or "MM/DD/YYYY"
        const slashMatch = dateStr.match(/(\d+)\/(\d+)(?:\/(\d+))?/);
        if (slashMatch) {
          const month = parseInt(slashMatch[1]) - 1;
          const day = parseInt(slashMatch[2]);
          const year = slashMatch[3] ? parseInt(slashMatch[3]) : today.getFullYear();
          const parsedDate = new Date(year, month, day);
          parsedDate.setHours(0, 0, 0, 0);
          return parsedDate;
        }
        
        return null;
      };
      
      // Calculate date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // This week: 7 days ago to today
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      // This month: first day of current month to today
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      // Calculate summary statistics from transactions
      const expenses = transactions.filter(t => t.type === 'expense');
      const incomes = transactions.filter(t => t.type === 'income');
      const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncomes - totalExpenses;
      
      // Filter transactions by date ranges
      const thisWeekExpenses = expenses.filter(t => {
        const expenseDate = parseExpenseDate(t.date);
        return expenseDate && expenseDate >= weekAgo && expenseDate <= today;
      });
      
      const thisMonthExpenses = expenses.filter(t => {
        const expenseDate = parseExpenseDate(t.date);
        return expenseDate && expenseDate >= firstDayOfMonth && expenseDate <= today;
      });
      
      // Calculate weekly and monthly totals
      const thisWeekTotal = thisWeekExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Group by category (all time, this week, this month)
      const expensesByCategory = expenses.reduce((acc, t) => {
        const cat = t.category || 'other';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
      
      const thisWeekByCategory = thisWeekExpenses.reduce((acc, t) => {
        const cat = t.category || 'other';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
      
      const thisMonthByCategory = thisMonthExpenses.reduce((acc, t) => {
        const cat = t.category || 'other';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
      
      // Count purchases by item/description (all time, this month)
      const itemCounts = expenses.reduce((acc, t) => {
        const desc = t.description.toLowerCase().trim();
        if (desc) {
          acc[desc] = (acc[desc] || 0) + 1;
        }
        return acc;
      }, {});
      
      const thisMonthItemCounts = thisMonthExpenses.reduce((acc, t) => {
        const desc = t.description.toLowerCase().trim();
        if (desc) {
        acc[desc] = (acc[desc] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Group by mood
      const expensesByMood = expenses.reduce((acc, t) => {
        if (t.mood) {
          acc[t.mood] = (acc[t.mood] || 0) + Math.abs(t.amount);
        }
        return acc;
      }, {});
      
      // Recent transactions with all details (last 20 for better context)
      const recentTransactions = transactions.slice(0, 20).map(t => ({
        date: t.date || 'no date',
        time: t.time || 'no time',
        description: t.description,
        amount: Math.abs(t.amount),
        type: t.type,
        category: t.category || 'none',
        mood: t.mood || 'none',
        notes: t.notes || null
      }));
      
      // Calculate Analytics data (matching AnalyticsPage logic)
      // Get target and period from localStorage (set by AnalyticsPage)
      const savedTarget = localStorage.getItem('chatty_wallet_target');
      const savedPeriod = localStorage.getItem('chatty_wallet_period');
      const savedStartDate = localStorage.getItem('chatty_wallet_start_date');
      const target = savedTarget ? parseFloat(savedTarget) : 5000; // Default 5000
      const period = savedPeriod || 'month'; // Default month
      
      const periodConfig = {
        week: { days: 7, label: '1 Week' },
        '2weeks': { days: 14, label: '2 Weeks' },
        '3weeks': { days: 21, label: '3 Weeks' },
        month: { days: 30, label: '1 Month' }
      };
      const daysInPeriod = periodConfig[period]?.days || 30;
      const spendingPercentage = target > 0 ? Math.round((totalExpenses / target) * 100) : 0;
      const saved = Math.max(0, target - totalExpenses);
      const dailyGoal = Math.round(target / daysInPeriod);
      
      // Parse start date for goal period
      let goalStartDate = today;
      if (savedStartDate) {
        const parts = savedStartDate.split('-');
        if (parts.length === 3) {
          goalStartDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          goalStartDate.setHours(0, 0, 0, 0);
        }
      }
      
      // Calculate expenses within goal period
      const goalEndDate = new Date(goalStartDate);
      goalEndDate.setDate(goalStartDate.getDate() + daysInPeriod - 1);
      goalEndDate.setHours(23, 59, 59, 999);
      
      const goalPeriodExpenses = expenses.filter(t => {
        const expenseDate = parseExpenseDate(t.date);
        return expenseDate && expenseDate >= goalStartDate && expenseDate <= goalEndDate;
      });
      const goalPeriodTotal = goalPeriodExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Group expenses by day for trend analysis (within goal period)
      const expensesByDay = {};
      goalPeriodExpenses.forEach(expense => {
        const expenseDate = parseExpenseDate(expense.date);
        if (expenseDate) {
          const dateKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;
          if (!expensesByDay[dateKey]) {
            expensesByDay[dateKey] = 0;
          }
          expensesByDay[dateKey] += Math.abs(expense.amount);
        }
      });
      
      // Calculate average daily spending
      const daysWithSpending = Object.keys(expensesByDay).length;
      const avgDailySpending = daysWithSpending > 0 ? goalPeriodTotal / daysWithSpending : 0;
      
      const spendingContext = {
        // Overall Spending Summary
        balance: balance,
        totalBalance: balance,
        totalExpenses,
        totalIncomes,
        expensesByCategory,
        expensesByMood,
        itemCounts,
        
        // This Week Spending
        thisWeekTotal,
        thisWeekByCategory,
        thisWeekExpenses: thisWeekExpenses.map(t => ({
          date: t.date || 'no date',
          time: t.time || 'no time',
          description: t.description,
          amount: Math.abs(t.amount),
          category: t.category || 'none',
          mood: t.mood || 'none',
          notes: t.notes || null
        })),
        
        // This Month Spending
        thisMonthTotal,
        thisMonthByCategory,
        thisMonthItemCounts,
        thisMonthExpenses: thisMonthExpenses.map(t => ({
          date: t.date || 'no date',
          time: t.time || 'no time',
          description: t.description,
          amount: Math.abs(t.amount),
          category: t.category || 'none',
          mood: t.mood || 'none',
          notes: t.notes || null
        })),
        
        // Detailed Spending Data
        allTransactions: transactions.map(t => ({
          date: t.date || 'no date',
          time: t.time || 'no time',
          description: t.description,
          amount: Math.abs(t.amount),
          type: t.type,
          category: t.category || 'none',
          mood: t.mood || 'none',
          notes: t.notes || null
        })),
        recentTransactions,
        
        // Goal Period Analytics
        goalPeriodTotal,
        goalPeriodExpenses: goalPeriodExpenses.map(t => ({
          date: t.date || 'no date',
          time: t.time || 'no time',
          description: t.description,
          amount: Math.abs(t.amount),
          category: t.category || 'none',
          mood: t.mood || 'none',
          notes: t.notes || null
        })),
        expensesByDay,
        avgDailySpending,
        daysWithSpending,
        
        // Analytics Data
        target,
        period,
        daysInPeriod,
        spendingPercentage,
        saved,
        dailyGoal,
        goalStartDate: goalStartDate instanceof Date ? goalStartDate.toISOString().split('T')[0] : (goalStartDate || ''),
        goalEndDate: goalEndDate instanceof Date ? goalEndDate.toISOString().split('T')[0] : (goalEndDate || ''),
        currentSpendingStatus: spendingPercentage <= 60 ? 'good' : spendingPercentage <= 80 ? 'warning' : 'critical'
      };
      
      const prompt = getAIPrompt(spendingContext, userMessage, aiId);
      
      // Supabase Edge Function 호출 (API 키는 서버에서만 사용됨)
      const { data, error } = await supabase.functions.invoke('openai-proxy', {
        body: {
          prompt: prompt
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        if (error.message.includes('503')) {
          return "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요. 😿";
        }
        if (error.message.includes('429')) {
          return "API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요. 😿";
        }
        return `연결 오류가 발생했습니다: ${error.message}. 잠시 후 다시 시도해주세요. 😿`;
      }

      // Edge Function이 OpenAI 응답을 그대로 반환하므로 파싱
      if (data && data.error) {
        return data.error;
      }
      
      console.log('OpenAI API response:', data); // Debug log
      
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else if (data.error) {
        console.error('OpenAI API error:', data.error);
        const errorMessage = data.error.message || 'Unknown error';
        
        // 에러 코드별 메시지
        if (data.error.code === 'server_error' || errorMessage.includes('503')) {
          return "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요. 😿";
        }
        if (data.error.code === 'rate_limit_exceeded' || errorMessage.includes('429')) {
          return "API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요. 😿";
        }
        
        return `죄송합니다. 오류가 발생했습니다: ${errorMessage}. 잠시 후 다시 시도해주세요. 😿`;
      } else {
        console.error('Unexpected response format:', data);
        return "응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요. 😿";
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      if (error.message.includes('API key')) {
        return "API 키가 없거나 유효하지 않습니다. .env 파일을 확인해주세요. 🔑";
      }
      if (error.message.includes('503')) {
        return "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요. 😿";
      }
      if (error.message.includes('429')) {
        return "API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요. 😿";
      }
      return `연결 오류가 발생했습니다: ${error.message}. 잠시 후 다시 시도해주세요. 😿`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || loadingMessages) return;

    // Get enabled AIs
    const enabledAIs = Object.keys(aiEnabled).filter(aiId => aiEnabled[aiId]);
    
    if (enabledAIs.length === 0) {
      return;
    }

    // Generate a unique message ID for this conversation turn
    const conversationTurnId = Date.now();
    const currentTime = getCurrentTime();

    const userMessage = {
      id: conversationTurnId,
      type: 'user',
      text: inputMessage,
      time: currentTime
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Get responses from all enabled AIs
    const aiResponses = await Promise.all(
      enabledAIs.map(async (aiId) => {
        try {
          const response = await sendMessageToGemini(messageText, aiId);
          // Track AI chat event
          trackAIChat(aiId, messageText.length);
          return { aiId, response };
        } catch (error) {
          console.error(`Error getting response from ${aiId}:`, error);
          return { aiId, response: "Sorry, I couldn't respond right now. 😿" };
        }
      })
    );

    // Add all AI responses to messages with unique IDs for each AI
    // Each AI message gets a unique ID based on conversationTurnId + small offset
    const newMessages = aiResponses.map(({ aiId, response }, index) => ({
      id: conversationTurnId + index + 1, // Unique ID for each AI message
      type: aiId,
      text: response,
      time: currentTime
    }));

    setMessages(prev => [...prev, ...newMessages]);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <style>{`
        .chat-messages-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="h-full flex flex-col pb-20 overflow-hidden">
      {/* Chat Header */}
      <div className="p-6 pb-4 bg-black border-b border-gray-800 rounded-b-[16px]">
        <div className="flex items-start gap-4 mb-4">
          {/* Star/Fan Icon */}
          <div className="flex-shrink-0">
            <img src="/image.png" alt="Chat Room Icon" className="w-10 h-10 brightness-0 invert" />
          </div>
          
          {/* Text Section */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">Chat Room</h2>
            <p className="text-sm text-white/90">
              {Object.values(AI_CONFIG).filter(ai => aiEnabled[ai.id]).map(ai => ai.name).join(' & ')}
            </p>
          </div>
        </div>
        
        {/* Small Profile Avatars */}
        <div className="flex items-center gap-2">
          {Object.values(AI_CONFIG).map((ai) => {
            const isInfoActive = activeProfileInfo === ai.id;
            const isEnabled = aiEnabled[ai.id];
            return (
              <div key={ai.id} className="relative" data-ai-profile>
                <button
                  ref={(el) => {
                    profileRefs.current[ai.id] = el;
                  }}
                  onClick={() => setActiveProfileInfo(prev => prev === ai.id ? null : ai.id)}
                  className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center transition-all relative overflow-hidden ${
                    isEnabled ? 'opacity-100' : 'opacity-30 hover:opacity-50'
                  }`}
                  title={ai.name}
                >
                  <img
                    src={ai.avatar}
                    alt={ai.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {!isEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-6 h-0.5 bg-white rotate-45"></div>
                    </div>
                  )}
                  {isInfoActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
      {activeProfileInfo && infoCardStyles && (
        <div
          data-ai-info-card
          ref={infoCardRef}
          className="fixed z-40 flex items-stretch gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl"
          style={{
            left: `${infoCardStyles.left}px`,
            top: `${infoCardStyles.top}px`,
            width: `${infoCardStyles.width}px`
          }}
        >
          <div className="flex items-start gap-3">
            <div className={`h-16 w-16 flex-shrink-0 rounded-full bg-gradient-to-br ${AI_CONFIG[activeProfileInfo].gradient} p-[3px]`}>
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                <img
                  src={AI_CONFIG[activeProfileInfo].avatar}
                  alt={AI_CONFIG[activeProfileInfo].name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black leading-tight">{AI_CONFIG[activeProfileInfo].name}</h3>
              <p className="mt-1 text-sm text-black opacity-60 leading-snug">
                {AI_CONFIG[activeProfileInfo].description}
              </p>
              <p className="mt-3 text-xs text-black opacity-60 leading-relaxed italic max-w-[360px]">
                {AI_CONFIG[activeProfileInfo].initialMessage}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAIToggle(activeProfileInfo)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center self-start transition ${
              aiEnabled[activeProfileInfo]
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
          >
            {aiEnabled[activeProfileInfo] ? 'Disable' : 'Enable'}
          </button>
        </div>
      )}
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef} 
        className="chat-messages-container flex-1 min-h-0 p-6 space-y-4 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : (
          <>
        {messages.map((message, index) => {
          const isAIMessage = message.type !== 'user';
          const aiConfig = isAIMessage ? AI_CONFIG[message.type] : null;
          // Use combination of id, type, and index to ensure unique key
          const uniqueKey = `${message.id}_${message.type}_${index}`;
          
          return isAIMessage ? (
            <div key={uniqueKey} className="flex gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${aiConfig?.gradient || 'from-purple-400 to-pink-400'} flex items-center justify-center flex-shrink-0 p-0.5`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={aiConfig?.avatar}
                    alt={aiConfig?.name || 'AI'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-3xl rounded-tl-md p-4 inline-block max-w-xs">
                  <p className="text-black text-[15px] leading-relaxed">{message.text}</p>
                </div>
                <p className="text-xs text-black opacity-40 mt-1 ml-2">{message.time}</p>
              </div>
            </div>
          ) : (
            <div key={uniqueKey} className="flex gap-3 justify-end">
              <div className="flex-1 text-right">
                <div className="bg-black rounded-3xl rounded-tr-md p-4 inline-block max-w-xs">
                  <p className="text-white text-[15px] leading-relaxed">{message.text}</p>
                </div>
                <p className="text-xs text-black opacity-40 mt-1 mr-2">{message.time}</p>
              </div>
            </div>
          );
        })}
        {isLoading && Object.keys(aiEnabled).filter(aiId => aiEnabled[aiId]).map((aiId) => (
          <div key={aiId} className="flex gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AI_CONFIG[aiId].gradient} flex items-center justify-center flex-shrink-0 p-0.5`}>
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={AI_CONFIG[aiId].avatar}
                  alt={AI_CONFIG[aiId].name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-3xl rounded-tl-md p-4 inline-block">
                <p className="text-black text-[15px] leading-relaxed">Thinking...</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Chat Input */}
      <div className="p-6 pt-4 border-t border-gray-100">
        <div className="flex gap-3 items-center">
          <input 
            type="text" 
            placeholder="What do you want to buy?" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-gray-100 rounded-lg px-6 py-4 text-black placeholder-gray-400 border-none outline-none text-base disabled:opacity-50"
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{
              background: isLoading || !inputMessage.trim() ? '#F7A9E0' : '#F35DC8'
            }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

export default ChatPage;
