/**
 * Voice pronunciation utilities using the Web Speech API SpeechSynthesis interface.
 * Works offline — SpeechSynthesis operates without a network connection.
 */

/**
 * Check if the Web Speech API SpeechSynthesis is available in the current browser.
 */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Speak the common name followed by the scientific name using the Web Speech API.
 *
 * - Cancels any in-progress speech before starting.
 * - If only one name is provided (the other is empty), speaks just that name.
 * - If both names are empty, resolves immediately without speaking.
 * - Resolves when speech finishes; rejects on error.
 */
export function speakName(
  commonName: string,
  scientificName: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const trimmedCommon = commonName.trim();
    const trimmedScientific = scientificName.trim();

    // Both empty — nothing to speak
    if (!trimmedCommon && !trimmedScientific) {
      resolve();
      return;
    }

    if (!isSpeechSupported()) {
      reject(new Error('SpeechSynthesis is not supported in this browser'));
      return;
    }

    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    // Build the text: common name followed by scientific name, separated by a pause (comma)
    let text: string;
    if (trimmedCommon && trimmedScientific) {
      text = `${trimmedCommon}, ${trimmedScientific}`;
    } else {
      text = trimmedCommon || trimmedScientific;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      // 'canceled' errors happen when we intentionally cancel — don't treat as failure
      if (event.error === 'canceled') {
        resolve();
        return;
      }
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Cancel any in-progress speech synthesis.
 */
export function cancelSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
