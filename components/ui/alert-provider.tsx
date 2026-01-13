import React, { useState, useCallback, useEffect } from 'react';
import { CustomAlert, setAlertInstance, type AlertButton } from './custom-alert';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

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
        onDismiss={hideAlert}
      />
    </>
  );
}
