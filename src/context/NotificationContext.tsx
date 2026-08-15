'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppAlert, BrowserNotificationStatus, NotificationPreferences } from '../lib/types';
import { useSubscriptions } from './SubscriptionContext';
import {
  deriveAppAlerts,
  getDismissedAlerts,
  saveDismissedAlert,
} from '../lib/utils/reminders';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  dispatchLocalNotification,
} from '../lib/utils/notifications';

interface NotificationContextType {
  alerts: AppAlert[];
  urgentAlertsCount: number;
  totalAlertsCount: number;
  permissionStatus: BrowserNotificationStatus;
  isAlertPanelOpen: boolean;
  preferences: NotificationPreferences;
  openAlertPanel: () => void;
  closeAlertPanel: () => void;
  toggleAlertPanel: () => void;
  dismissAlert: (id: string) => void;
  requestPermission: () => Promise<BrowserNotificationStatus>;
  sendTestNotification: () => boolean;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { subscriptions, profile, updateProfile } = useSubscriptions();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<BrowserNotificationStatus>('unsupported');
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);

  // Initialize dismissed alerts and permission state on client mount
  useEffect(() => {
    setDismissedIds(getDismissedAlerts());
    setPermissionStatus(getBrowserNotificationPermission());
  }, []);

  const preferences: NotificationPreferences = useMemo(() => {
    return {
      enabled: profile?.notifications_enabled !== false,
      notifyRenewals: profile?.notify_renewals !== false,
      notifyTrials: profile?.notify_trials !== false,
      offsets: profile?.default_reminder_days || [7, 3, 1],
    };
  }, [profile]);

  const alerts = useMemo(() => {
    if (!preferences.enabled) return [];
    return deriveAppAlerts(subscriptions, preferences, dismissedIds);
  }, [subscriptions, preferences, dismissedIds]);

  const urgentAlertsCount = useMemo(() => {
    return alerts.filter((a) => a.severity === 'urgent').length;
  }, [alerts]);

  const totalAlertsCount = alerts.length;

  const dismissAlert = useCallback((id: string) => {
    saveDismissedAlert(id);
    setDismissedIds((prev) => [...prev, id]);
  }, []);

  const handleRequestPermission = useCallback(async (): Promise<BrowserNotificationStatus> => {
    const res = await requestBrowserNotificationPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      dispatchLocalNotification('Sift Notifications Active', {
        body: 'You will receive calm reminders before upcoming renewals and trial expirations.',
      });
    }
    return res;
  }, []);

  const handleSendTestNotification = useCallback((): boolean => {
    return dispatchLocalNotification('Sift Reminder Test', {
      body: 'Your subscription renewal alerts are configured and active.',
    });
  }, []);

  const handleUpdatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      await updateProfile({
        notifications_enabled: updates.enabled !== undefined ? updates.enabled : preferences.enabled,
        notify_renewals:
          updates.notifyRenewals !== undefined ? updates.notifyRenewals : preferences.notifyRenewals,
        notify_trials:
          updates.notifyTrials !== undefined ? updates.notifyTrials : preferences.notifyTrials,
        default_reminder_days: updates.offsets || preferences.offsets,
      });
    },
    [preferences, updateProfile]
  );

  return (
    <NotificationContext.Provider
      value={{
        alerts,
        urgentAlertsCount,
        totalAlertsCount,
        permissionStatus,
        isAlertPanelOpen,
        preferences,
        openAlertPanel: () => setIsAlertPanelOpen(true),
        closeAlertPanel: () => setIsAlertPanelOpen(false),
        toggleAlertPanel: () => setIsAlertPanelOpen((prev) => !prev),
        dismissAlert,
        requestPermission: handleRequestPermission,
        sendTestNotification: handleSendTestNotification,
        updatePreferences: handleUpdatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
