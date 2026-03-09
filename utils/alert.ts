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
 * @param buttonsOrCallback - Optional array of buttons OR callback function for OK button
 */
export const alert = (
  title: string, 
  message?: string, 
  buttonsOrCallback?: AlertButton[] | (() => void)
): void => {
  // Handle case where message might be undefined (Alert.alert can be called with just title)
  const alertMessage = message || title;
  const alertTitle = message ? title : 'Alert';
  
  // Handle callback shorthand - if third param is a function, wrap it as OK button
  let buttons: AlertButton[] | undefined;
  if (typeof buttonsOrCallback === 'function') {
    buttons = [{ text: 'OK', onPress: buttonsOrCallback }];
  } else {
    buttons = buttonsOrCallback;
  }
  
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

/**
 * Show a confirmation dialog with Yes/No buttons
 * @param title - Confirmation title
 * @param message - Confirmation message
 * @param onConfirm - Callback when user confirms (Yes)
 * @param onCancel - Optional callback when user cancels (No)
 */
export const confirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  setTimeout(() => {
    showCustomAlert(title, message, [
      {
        text: 'No',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  }, 10);
};
