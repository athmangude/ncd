import { useState } from 'react';
import Session from 'supertokens-web-js/recipe/session';

export interface SendNotificationParams {
  userId: string;
  userType: string;
  title: string;
  body: string;
}

export interface SendNotificationResult {
  isSending: boolean;
  error: string | null;
  success: boolean;
  sendNotification: (params: SendNotificationParams) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook to send push notifications to users
 * Uses SuperTokens authentication to securely send notifications via the backend API
 * 
 * @example
 * ```tsx
 * const { sendNotification, isSending, error, success } = useSendTestNotification();
 * 
 * const handleSend = async () => {
 *   await sendNotification({
 *     userId: 'user123',
 *     userType: 'PATIENT',
 *     title: 'Test Notification',
 *     body: 'This is a test message'
 *   });
 * };
 * ```
 */
export function useSendTestNotification(): SendNotificationResult {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendNotification = async ({
    userId,
    userType,
    title,
    body,
  }: SendNotificationParams) => {
    // Validation
    if (!userId?.trim()) {
      setError('User ID is required');
      return;
    }

    if (!userType?.trim()) {
      setError('User type is required');
      return;
    }

    if (!title?.trim()) {
      setError('Notification title is required');
      return;
    }

    if (!body?.trim()) {
      setError('Notification body is required');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if user has an active session
      const sessionExists = await Session.doesSessionExist();
      if (!sessionExists) {
        throw new Error('No active session. Please log in.');
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      const response = await fetch(`${apiUrl}/notifications/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: includes session cookies for SuperTokens auth
        body: JSON.stringify({
          userId,
          userType,
          title,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API error: ${response.status}`);
      }

      setSuccess(true);
      console.log('Notification sent successfully:', data);
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError(err.message || 'Failed to send notification');
      setSuccess(false);
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setIsSending(false);
  };

  return {
    sendNotification,
    isSending,
    error,
    success,
    reset,
  };
}

