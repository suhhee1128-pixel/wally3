import { supabase } from './supabase';

/**
 * Load user settings from Supabase
 */
export const loadUserSettings = async (userId) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user settings:', error);
    return null;
  }
};

/**
 * Save or update user settings in Supabase
 */
export const saveUserSettings = async (userId, settings) => {
  if (!userId) return false;

  try {
    // Check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const settingsData = {
      ...settings,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update(settingsData)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...settingsData
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
};

/**
 * Migrate settings from localStorage to Supabase
 */
export const migrateSettingsFromLocalStorage = async (userId) => {
  if (!userId) return;

  try {
    // Check if settings already exist in Supabase
    const existing = await loadUserSettings(userId);
    if (existing) return; // Already migrated

    // Load from localStorage
    const analyticsTarget = localStorage.getItem('chatty_wallet_target');
    const analyticsPeriod = localStorage.getItem('chatty_wallet_period');
    const analyticsStartDate = localStorage.getItem('chatty_wallet_start_date');
    const spendingSummaryPeriod = localStorage.getItem('chatty_wallet_summary_period');
    
    // Build settings object
    const settings = {};
    if (analyticsTarget) settings.analytics_target = parseFloat(analyticsTarget);
    if (analyticsPeriod) settings.analytics_period = analyticsPeriod;
    if (analyticsStartDate) settings.analytics_start_date = analyticsStartDate;
    if (spendingSummaryPeriod) settings.spending_summary_period = spendingSummaryPeriod;

    // Save to Supabase if any settings exist
    if (Object.keys(settings).length > 0) {
      await saveUserSettings(userId, settings);
      
      // Clear localStorage after migration
      localStorage.removeItem('chatty_wallet_target');
      localStorage.removeItem('chatty_wallet_period');
      localStorage.removeItem('chatty_wallet_start_date');
      localStorage.removeItem('chatty_wallet_summary_period');
    }
  } catch (error) {
    console.error('Error migrating settings from localStorage:', error);
  }
};

