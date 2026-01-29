/**
 * Custom Alert utility that matches the app's UI design
 * Replaces React Native's Alert.alert with a custom styled modal
 */

import { showCustomAlert, type AlertButton } from '@/components/ui/custom-alert';

/**
 * Show a custom alert dialog
 * Matches React Native's Alert.alert API
 * @param title - Alert title
 * @param message - Alert message
 * @param buttons - Optional array of buttons (defaults to single "OK" button)
 */
export const alert = (title: string, message?: string, buttons?: AlertButton[]): void => {
  // Handle case where message might be undefined (Alert.alert can be called with just title)
  const alertMessage = message || title;
  const alertTitle = message ? title : 'Alert';
  
  // Use setTimeout to ensure AlertProvider is ready
  // This prevents issues if alert is called immediately on mount
  setTimeout(() => {
    showCustomAlert(alertTitle, alertMessage, buttons);
  }, 10);
};

/**
 * Show an alert that automatically dismisses after a delay (no OK button).
 * @param title - Alert title
 * @param message - Alert message
 * @param durationMs - How long to show before auto-dismiss (default 2500)
 */
export const showAutoDismissAlert = (
  title: string,
  message: string,
  durationMs: number = 2500
): void => {
  setTimeout(() => {
    showCustomAlert(title, message, undefined, { autoDismissMs: durationMs });
  }, 10);
};

/**
 * Convenience method that matches Alert.alert API exactly
 */
export const showAlert = alert;
