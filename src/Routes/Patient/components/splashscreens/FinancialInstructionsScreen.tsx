import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/Button';

export default function FinancialInstructionsScreen({
  setCurrentScreen,
  currentScreen,
}: {
  currentScreen: number;
  setCurrentScreen: (value: number) => void;
}) {
  return (
    <div className="h-screen flex flex-col bg-white px-4 py-6">
      <div
        onClick={() => setCurrentScreen(currentScreen - 1)}
        className="flex items-center justify-between mb-6"
      >
        <ChevronLeft />
      </div>
      <main className="flex flex-col space-y-6">
        <div>
          <h3 className="text-black  font-medium text-xl">
            How to download your Mpesa Statements
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start">
            <img
              src="/Phone-permission.png"
              alt="How to get Mpesa Statements via USSD"
              className="h-6 w-6 mr-3"
            />
            <div>
              <h3 className="font-bold text-neutral-800">
                How to get Mpesa Statements via USSD
              </h3>
              <ol className="text-neutral-600 text-sm list-decimal space-y-2 pl-6">
                <li>Dial *334#</li>
                <li>Dial 7- My Account</li>
                <li>Dial 3- Mpesa Statement </li>
                <li>Dial 1- Mpesa Statement</li>
                <li>Dial 1-Request Statement</li>
                <li>Dial 1- Full Statement </li>
                <li>Dial 6- Last 12 months </li>
                <li>Enter Email Address </li>
                <li>Re-enter Email Address</li>
                <li>Enter Mpesa Pin</li>
              </ol>
            </div>
          </div>
          <div className="flex items-start">
            <img
              src="/Phone-permission.png"
              alt="How to get Mpesa Statements via Mpesa App"
              className="h-6 w-6 mr-3"
            />
            <div>
              <h3 className="font-bold text-neutral-800">
                How to get Mpesa Statements via Mpesa App
              </h3>
              <ol className="text-neutral-600 text-sm list-decimal space-y-2 pl-6 mb-6">
                <li>Download &amp; install Mpesa app from play store or app store</li>
                <li>Log into the app using the Mpesa pin or biometrics</li>
                <li>On the home page, go to mpesa statements and tap see all</li>
                <li>Select the month to view</li>
                <li>Select export statements &amp; set the dates to view</li>
                <li>Select generate statement to download on your phone</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-auto">
        <Button
          onClick={() => setCurrentScreen(currentScreen - 1)}
          className="w-full py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700"
        >
          Done
        </Button>
      </footer>
    </div>
  );
}
