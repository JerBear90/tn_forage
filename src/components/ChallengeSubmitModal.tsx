'use client';

/**
 * ForageWise — ChallengeSubmitModal Component
 *
 * Full-screen modal for submitting a photo to a challenge.
 * Features:
 * - Camera/gallery photo picker
 * - Photo preview after selection
 * - Submit button disabled until photo is selected
 * - Loading state during upload
 * - Success/error feedback
 * - Close button (X) in top-right
 *
 * Requirements: 8.1, 8.7
 */

import { useState, useRef } from 'react';
import { submitChallenge } from '@/services/challengeSubmissionService';

interface ChallengeSubmitModalProps {
  challengeId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ChallengeSubmitModal({
  challengeId,
  onClose,
  onSubmitted,
}: ChallengeSubmitModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      await submitChallenge(challengeId, selectedFile);
      setSuccess(true);

      // Notify parent after brief delay for user to see success
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Submit challenge photo"
    >
      <div className="relative w-full h-full max-w-lg mx-auto flex flex-col bg-white dark:bg-dark-surface overflow-y-auto">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-brand-charcoal/10 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-brand-forest dark:text-brand-moss">
            Submit Challenge
          </h2>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-full hover:bg-brand-charcoal/10 dark:hover:bg-dark-border transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6 text-brand-charcoal dark:text-dark-text"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-teal/10 dark:bg-brand-teal/20">
                <svg
                  className="w-8 h-8 text-brand-teal"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-base font-medium text-brand-forest dark:text-brand-moss">
                Submitted for review!
              </p>
            </div>
          ) : (
            <>
              {/* Photo preview or picker */}
              {previewUrl ? (
                <div className="w-full max-w-sm">
                  <img
                    src={previewUrl}
                    alt="Selected photo preview"
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="mt-3 text-sm text-brand-earth dark:text-brand-earth-200 underline min-h-[44px] min-w-[44px]"
                    aria-label="Remove selected photo"
                  >
                    Choose a different photo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-charcoal/5 dark:bg-dark-border">
                    <svg
                      className="w-10 h-10 text-brand-charcoal/40 dark:text-dark-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted text-center">
                    Take a photo or choose from your gallery to submit this challenge.
                  </p>

                  {/* Camera and Gallery buttons */}
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 rounded-lg bg-brand-teal text-white font-medium text-sm hover:bg-brand-teal/90 transition-colors"
                      aria-label="Take a photo with camera"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 rounded-lg border border-brand-teal text-brand-teal dark:text-brand-teal-200 font-medium text-sm hover:bg-brand-teal/10 transition-colors"
                      aria-label="Choose photo from gallery"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      Gallery
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center" role="alert">
                  {error}
                </p>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || loading}
                className="w-full max-w-sm min-h-[44px] px-6 py-3 rounded-lg bg-brand-teal text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-teal/90 transition-colors flex items-center justify-center gap-2"
                aria-label={loading ? 'Submitting challenge photo' : 'Submit challenge photo'}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
