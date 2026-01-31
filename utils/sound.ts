import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Local WAV – loads instantly, works offline. .wav and .mp3 both work with expo-audio.
const COMPLETION_SOUND = require('../assets/sounds/complete-sound.wav');

const completedGroupsPlayed = new Set<string>();

/**
 * Play a short celebration sound when an Ayuuto group completes.
 * Uses bundled complete-sound.wav for reliable playback.
 */
export async function playCompletionSound(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });

    const player = createAudioPlayer(COMPLETION_SOUND);

    const removeWhenDone = (): void => {
      try {
        player.remove();
      } catch {
        // ignore
      }
    };

    let hasPlayed = false;
    const safePlay = (): void => {
      try {
        player.seekTo(0);
        player.play();
      } catch (err) {
        // Session activation can fail (e.g. iOS background, audio conflict)
        console.warn('Completion sound play failed:', err);
      }
    };

    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        removeWhenDone();
      }
      if (status.isLoaded && !hasPlayed) {
        hasPlayed = true;
        safePlay();
      }
    });

    // Fallback: play when loaded (local .wav often loads in one tick)
    const fallback = setTimeout(() => {
      if (!hasPlayed && player.isLoaded) {
        hasPlayed = true;
        safePlay();
      }
    }, 100);
    setTimeout(removeWhenDone, 5000);
  } catch (error) {
    console.warn('Could not play completion sound:', error);
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
