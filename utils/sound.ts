import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

// Local WAV – loads instantly, works offline. .wav and .mp3 both work with expo-audio.
const COMPLETION_SOUND = require('../assets/sounds/complete-sound.wav');

const completedGroupsPlayed = new Set<string>();

/**
 * Play a short celebration sound when an Ayuuto group completes.
 * Uses bundled complete-sound.wav for reliable playback.
 */
export async function playCompletionSound(): Promise<void> {
  try {
    console.log('[Sound] Starting to play completion sound...');
    
    // Set audio mode - Android needs different settings
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: Platform.OS === 'android' ? 'doNotMix' : 'mixWithOthers',
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('[Sound] Audio mode set');

    const player = createAudioPlayer(COMPLETION_SOUND);
    console.log('[Sound] Player created');

    const removeWhenDone = (): void => {
      try {
        player.remove();
        console.log('[Sound] Player removed');
      } catch (err) {
        console.warn('[Sound] Error removing player:', err);
      }
    };

    let hasPlayed = false;
    let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const safePlay = async (): Promise<void> => {
      if (hasPlayed) {
        console.log('[Sound] Already played, skipping');
        return;
      }
      
      try {
        console.log('[Sound] Attempting to play...');
        player.seekTo(0);
        await player.play();
        hasPlayed = true;
        console.log('[Sound] Playback started successfully');
        
        // Cleanup after sound finishes (estimate 2 seconds)
        cleanupTimeout = setTimeout(() => {
          removeWhenDone();
        }, 2000);
      } catch (err) {
        console.error('[Sound] Play failed:', err);
        hasPlayed = true; // Mark as attempted to prevent retries
      }
    };

    // Wait for player to be ready using a promise
    const waitForPlayerReady = (): Promise<void> => {
      return new Promise((resolve) => {
        if (player.isLoaded) {
          resolve();
          return;
        }

        const checkInterval = setInterval(() => {
          if (player.isLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);

        // Timeout after 1 second
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(); // Resolve anyway to attempt playback
        }, 1000);
      });
    };

    // Listen for status updates
    const statusListener = player.addListener('playbackStatusUpdate', (status) => {
      console.log('[Sound] Status update:', {
        isLoaded: status.isLoaded,
        didJustFinish: status.didJustFinish,
        isPlaying: status.isPlaying,
      });
      
      if (status.didJustFinish) {
        console.log('[Sound] Playback finished');
        removeWhenDone();
        try {
          player.removeListener(statusListener);
        } catch {
          // ignore
        }
      }
    });

    // Wait for player to be ready, then play
    waitForPlayerReady().then(() => {
      if (!hasPlayed) {
        console.log('[Sound] Player ready, attempting to play');
        safePlay();
      }
    }).catch((err) => {
      console.error('[Sound] Error waiting for player:', err);
    });
    
    // Safety cleanup after 5 seconds
    setTimeout(() => {
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
      }
      removeWhenDone();
      if (statusListener) {
        try {
          player.removeListener(statusListener);
        } catch {
          // ignore
        }
      }
    }, 5000);
  } catch (error) {
    console.error('[Sound] Error in playCompletionSound:', error);
  }
}

/**
 * Play completion sound once per group when the user first sees that group as completed.
 */
export function playCompletionSoundIfNeeded(groupId: string): void {
  if (completedGroupsPlayed.has(groupId)) return;
  completedGroupsPlayed.add(groupId);
  playCompletionSound();
}
