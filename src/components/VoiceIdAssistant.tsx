"use client";

import { useState, useCallback } from "react";
import { parseVoiceDescription } from "@/utils/voiceIdParser";
import type { VoiceIdResult } from "@/types";

interface VoiceIdAssistantProps {
  onResults?: (result: VoiceIdResult) => void;
}

/**
 * Voice-based species identification assistant using Web Speech API + NLP parsing.
 * Requirements: 29.1–29.8
 */
export default function VoiceIdAssistant({ onResults }: VoiceIdAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceIdResult | null>(null);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      processTranscript(text);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, []);

  const processTranscript = useCallback((text: string) => {
    const features = parseVoiceDescription(text);
    const voiceResult: VoiceIdResult = {
      transcript: text,
      extractedFeatures: features,
      matches: [], // Matches would be populated by the scoring system
    };
    setResult(voiceResult);
    onResults?.(voiceResult);
  }, [onResults]);

  const handleTextSubmit = () => {
    if (transcript.trim()) {
      processTranscript(transcript.trim());
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Voice ID Assistant</h3>
      <p className="text-xs text-gray-600 mb-3">
        Describe the mushroom you found — color, shape, where it was growing, nearby trees.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium text-white ${
            isListening ? "bg-red-500 animate-pulse" : "bg-teal-600 hover:bg-teal-700"
          }`}
          aria-label={isListening ? "Listening..." : "Start voice input"}
        >
          {isListening ? "🎙 Listening..." : "🎤 Speak"}
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Or type your description..."
          className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
          aria-label="Mushroom description"
        />
        <button onClick={handleTextSubmit} className="rounded bg-gray-200 px-3 text-sm hover:bg-gray-300">
          Go
        </button>
      </div>

      {result && (
        <div className="rounded-md bg-gray-50 p-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Extracted Features:</h4>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {result.extractedFeatures.capColor && <li>Cap color: {result.extractedFeatures.capColor}</li>}
            {result.extractedFeatures.capShape && <li>Cap shape: {result.extractedFeatures.capShape}</li>}
            {result.extractedFeatures.undersideType && <li>Underside: {result.extractedFeatures.undersideType}</li>}
            {result.extractedFeatures.growthLocation && <li>Growing on: {result.extractedFeatures.growthLocation}</li>}
            {result.extractedFeatures.nearbyTree && <li>Near: {result.extractedFeatures.nearbyTree}</li>}
            {result.extractedFeatures.stemFeatures && result.extractedFeatures.stemFeatures.length > 0 && (
              <li>Stem: {result.extractedFeatures.stemFeatures.join(", ")}</li>
            )}
          </ul>
          <p className="text-[10px] text-amber-700 mt-2">
            These are possible matches only. Always verify with a qualified expert before consuming any wild mushroom.
          </p>
        </div>
      )}
    </div>
  );
}
