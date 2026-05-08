'use client';

/**
 * ForageWise — Challenge Submission Service
 *
 * Handles photo submissions for challenges via PocketBase.
 * Includes client-side image compression for large photos.
 *
 * Requirements: 8.1, 8.2, 8.6, 8.7
 */

import { pb } from '@/auth/authService';
import type { ChallengeSubmission } from '@/types';

// ---------------------------------------------------------------------------
// Image Compression
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

/**
 * Compress an image file if it exceeds 4MB.
 * Outputs JPEG at 70% quality with max dimension 1600px.
 */
async function compressPhoto(file: File): Promise<File> {
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down to fit within MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context for compression'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          const compressedFile = new File([blob], 'submission.jpg', {
            type: 'image/jpeg',
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Submit a challenge photo for review.
 *
 * - Validates that a photo file is present
 * - Compresses the photo if > 4MB (JPEG 70%, max 1600px)
 * - Uploads to PocketBase `challenge_submissions` collection
 * - Sets status to 'pending_review'
 *
 * @param challengeId - The ID of the challenge being submitted
 * @param photoFile - The photo file to upload
 * @returns The created ChallengeSubmission record
 * @throws Error if no photo is provided or upload fails
 */
export async function submitChallenge(
  challengeId: string,
  photoFile: File,
): Promise<ChallengeSubmission> {
  if (!photoFile) {
    throw new Error('A photo is required to submit a challenge.');
  }

  const userId = pb.authStore.record?.id;
  if (!userId) {
    throw new Error('You must be logged in to submit a challenge.');
  }

  // Compress if needed
  const processedFile = await compressPhoto(photoFile);

  // Build FormData for PocketBase file upload
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('challengeId', challengeId);
  formData.append('photoFile', processedFile);
  formData.append('status', 'pending_review');

  const record = await pb.collection('challenge_submissions').create(formData);

  // Build the photo URL from PocketBase file field
  const photoUrl = pb.files.getURL(record, record.photoFile as string);

  return {
    id: record.id,
    userId: record.userId as string,
    challengeId: record.challengeId as string,
    photoUrl,
    status: record.status as ChallengeSubmission['status'],
    reviewedAt: record.reviewedAt as string | undefined,
    reviewedBy: record.reviewedBy as string | undefined,
    createdAt: record.created as string,
  };
}

/**
 * Fetch all challenge submissions for a given user.
 *
 * @param userId - The user ID to fetch submissions for
 * @returns Array of ChallengeSubmission records
 */
export async function fetchUserSubmissions(
  userId: string,
): Promise<ChallengeSubmission[]> {
  const records = await pb.collection('challenge_submissions').getFullList({
    filter: `userId = "${userId}"`,
    sort: '-created',
  });

  return records.map((record) => {
    const photoUrl = pb.files.getURL(record, record.photoFile as string);

    return {
      id: record.id,
      userId: record.userId as string,
      challengeId: record.challengeId as string,
      photoUrl,
      status: record.status as ChallengeSubmission['status'],
      reviewedAt: record.reviewedAt as string | undefined,
      reviewedBy: record.reviewedBy as string | undefined,
      createdAt: record.created as string,
    };
  });
}
