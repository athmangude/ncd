import { useState, useEffect } from 'react';
import { Check, Settings, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/Button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationHelpDialog } from '@/components/EnableNotificationsCard';
import { usePatientAuthStore } from '@/Routes/Patient/stores/patientAuthStore';
import { useNavigate } from 'react-router-dom';
import useNextPWAOnboardingStep from '../../hooks/useNextPWAOnboardingStep';
import { trackEvent, EVENTS } from '@/analytics';

const STEP_ID = "02";

export default function EnableNotificationsPage() {
  const user = usePatientAuthStore((state: any) => state.user);
  const userType: string = 'PATIENT';
  const navigate = useNavigate();
  
  const {
    notificationPermission,
    requestPermission,
    error: permissionError,
  } = usePushNotifications(
    user?.id,
    userType
  );

  const [isRequesting, setIsRequesting] = useState(false);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  const nextStep = useNextPWAOnboardingStep();

  useEffect(() => {
    trackEvent(EVENTS.NOTIFICATIONS.PAGE_VIEW)
  }, [])

  // Automatically show help modal when there's a notification error
  useEffect(() => {
    if (permissionError) {
      trackEvent(EVENTS.NOTIFICATIONS.HELP_DIALOG_OPEN)
      setShowNotificationHelp(true);
    }
  }, [permissionError]);

  const handleNext = () => {
    if (nextStep) {
        navigate(nextStep);
    } else {
        navigate("/patients");
    }
  };

  const handleSkip = () => {
      trackEvent(EVENTS.NOTIFICATIONS.SKIP_TAP)
      // Record skip, but step remains incomplete in status check
      localStorage.setItem(`pwa_skip_${STEP_ID}`, 'true');
      handleNext();
  };

  const handleEnable = async () => {
      trackEvent(EVENTS.NOTIFICATIONS.ENABLE_TAP)
      setIsRequesting(true);
      try {
          const result = await requestPermission();
          if (result === 'granted') {
              trackEvent(EVENTS.NOTIFICATIONS.PERMISSION_GRANTED)
              handleNext();
          } else {
              trackEvent(EVENTS.NOTIFICATIONS.PERMISSION_DENIED)
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsRequesting(false);
      }
  };
  

  const isDenied = notificationPermission === 'denied';
  const isGranted = notificationPermission === 'granted';

  return (
      <div className="flex flex-col min-h-screen bg-white">


          <div className="flex-1 flex flex-col items-center px-6 pt-2 max-w-md mx-auto w-full text-center">
              
              <h1 className="text-2xl  text-neutral-900 mb-3">Stay in the loop</h1>
              <p className="text-center text-neutral-500 mb-1">
                  Turn on notifications to get instant alerts for payments, loan approvals, and important care reminders.
              </p>

              <div className="w-full text-left">
                  <p className="text-neutral-500 text-sm mb-4">Why?</p>
                  
                  <div className="space-y-3">
                      <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-xl">
                          <Check className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-900 font-medium text-sm">Keep SMS for urgent alerts</span>
                      </div>
                      <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-xl">
                          <Check className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-900 font-medium text-sm">Keep track of every transaction</span>
                      </div>
                      <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-xl">
                          <Check className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-900 font-medium text-sm">Get progress reminders and reports</span>
                      </div>
                  </div>
              </div>
              
              {isDenied && (
                   <div className="mt-6 bg-red-50 p-4 rounded-lg text-sm text-left w-full border border-red-100 text-red-800">
                      <p className="font-medium mb-1">Notifications are blocked</p>
                      <p>Please go to your browser settings and allow notifications for Jireh Health.</p>
                   </div>
              )}
          </div>

          <div className="p-6 w-full max-w-md mx-auto mt-auto pb-8">
            {!isDenied && !isGranted && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
                <div className="max-w-md mx-auto w-full flex gap-4">
                  <Button
                    className="w-1/3 "
                    variant="secondary"
                    type="button"
                    onClick={handleSkip}
                    >
                        Skip
                    </Button>
                    <Button 
                        className="w-2/3"
                        size="lg"
                        onClick={handleEnable}
                        disabled={isRequesting}
                    >
                        {isRequesting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enabling...
                            </>
                        ) : (
                            <> <Bell className="w-4 h-4 mr-2" /> Enable updates</>
                        )}
                    </Button>
                </div>
                </div>
            )}

            {isGranted && (
                <Button className="w-full bg-[#A855F7] hover:bg-[#9333EA] h-12 rounded-xl" onClick={handleNext}>
                    Continue
                </Button>
            )}

            {isDenied && (
                
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
                <div className="max-w-md mx-auto w-full flex gap-4">
                  <Button
                    className="w-1/3 "
                    variant="secondary"
                    type="button"
                        onClick={handleSkip}
                    >
                        Skip
                    </Button>
                    <Button
                        className="w-2/3"
                        size="lg"
                        onClick={() => {
                          trackEvent(EVENTS.NOTIFICATIONS.HELP_DIALOG_OPEN)
                          setShowNotificationHelp(true)
                        }}
                    >
                        <Settings className="mr-2 w-4 h-4"/>How to unblock
                    </Button>

                 </div>
                 </div>
            )}
          </div>
          
          <NotificationHelpDialog
            open={showNotificationHelp}
            onOpenChange={setShowNotificationHelp}
          />
      </div>
  )
}
