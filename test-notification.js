/**
 * Quick test script to trigger a notification
 * Run this in your app's console or add a button to trigger it
 */

// Import the function
import { triggerTestNotification } from './utils/notifications';

// Trigger the test notification
triggerTestNotification()
  .then(() => {
    console.log('✅ Test notification triggered!');
  })
  .catch((error) => {
    console.error('❌ Failed to trigger notification:', error);
  });
