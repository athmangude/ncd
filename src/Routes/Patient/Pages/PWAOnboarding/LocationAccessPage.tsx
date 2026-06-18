import { useState } from 'react';
import { Check, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/Button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import useNextPWAOnboardingStep from '../../hooks/useNextPWAOnboardingStep';

const STEP_ID = "03";

export default function LocationAccessPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  
  const nextStep = useNextPWAOnboardingStep();

  const handleNext = () => {
     if (nextStep) {
        navigate(nextStep);
    } else {
        navigate("/patients");
    }
  };

  const handleSkip = () => {
      // Record skip, but step remains incomplete in status check
      localStorage.setItem(`pwa_skip_${STEP_ID}`, 'true');
      handleNext();
  };

  const handleEnable = () => {
      setIsRequesting(true);
      if (!navigator.geolocation) {
           toast({ title: "Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
           setIsRequesting(false);
           return;
      }

      navigator.geolocation.getCurrentPosition(
          (_position) => {
              // Success
              setIsRequesting(false);
              handleNext();
          },
          (error) => {
              console.error(error);
              setIsRequesting(false);
              toast({ title: "Location Access Denied", description: "Please allow location access in your browser settings.", variant: "destructive" });
          }
      );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-1 flex flex-col items-center px-6  max-w-md mx-auto w-full">

            <h1 className="text-2xl  text-center mb-4 text-neutral-900">Find care near you</h1>
            <p className="text-center text-neutral-500 mb-1">
                Enable location to instantly see verified hospitals and pharmacies in your area.
            </p>

            <div className="w-full">
                <p className="text-neutral-500 text-sm mb-4">Why?</p>
                
                <div className="space-y-4 bg-white rounded-xl">
                    <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
                        <Check className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-900">Find hospitals near you</span>
                    </div>
                    <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
                        <Check className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-900">Get notified of nearby offers</span>
                    </div>
                    <div className="flex items-center gap-1 p-3 bg-white border border-neutral-100 rounded-lg">
                        <Check className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-900">Save your care provider preferences for your next visit</span>
                    </div>
                </div>
            </div>
        </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white  z-50">
            <div className="max-w-md mx-auto w-full flex gap-4">
              <Button
                className="w-1/3 "
                variant="secondary"
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
                {isRequesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isRequesting ? "Requesting..." : <> <MapPin className="w-4 h-4 mr-2" /> Use my location</>}
            </Button>


        </div>
        </div>
    </div>
  );
}
