import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CustomAlert, setAlertInstance, type AlertButton, type ShowAlertOptions } from './custom-alert';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  autoDismissMs?: number;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[], options?: ShowAlertOptions) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      autoDismissMs: options?.autoDismissMs,
    });
  }, []);

  const hideAlert = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Auto-dismiss when autoDismissMs is set
  useEffect(() => {
    if (!alertState.visible || alertState.autoDismissMs == null) return;
    autoDismissTimerRef.current = setTimeout(() => {
      autoDismissTimerRef.current = null;
      hideAlert();
    }, alertState.autoDismissMs);
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
        autoDismissTimerRef.current = null;
      }
    };
  }, [alertState.visible, alertState.autoDismissMs, hideAlert]);

  // Set global instance immediately and on mount
  useEffect(() => {
    setAlertInstance({
      show: showAlert,
      hide: hideAlert,
    });

    return () => {
      setAlertInstance(null);
    };
  }, [showAlert, hideAlert]);

  return (
    <>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        autoDismissMs={alertState.autoDismissMs}
        onDismiss={hideAlert}
      />
    </>
  );
}
