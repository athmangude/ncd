import { Button } from "@/components/Button"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

export default function FinalScreen({
  setCurrentScreen,
  currentScreen,
}: {
  currentScreen: number
  setCurrentScreen: (value: number) => void
}) {
  return (
    <div className="h-screen flex flex-col bg-white px-4 py-6">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          setCurrentScreen(currentScreen - 1)
        }}
        className="flex items-center justify-between mb-6 cursor-pointer"
        role="link"
        aria-label="Previous screen"
      >
        <ChevronLeft />
      </a>
      <main className="flex flex-col space-y-6">
        <div>
          <h3 className="text-black  font-medium text-xl">
            Your Jireh Health Membership - What you’ll need to get started{" "}
          </h3>
        </div>
        <div className="space-y-4 ">
          <div className="flex items-start">
            <img
              src="/Phone-permission.png"
              alt="Step 1"
              className="h-6 w-6 mr-3"
            />
            <div>
              <h3 className="font-bold text-neutral-800">
                Step 1: Set Up Your Account
              </h3>
              <p className="text-neutral-600 text-sm">You'll need:</p>
              <ul className="text-neutral-600 text-sm list-disc pl-6 leading-6">
                <li>A Kenyan mobile number.</li>
                <li>A valid ID (National ID or passport) for verification.</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start">
            <img
              src="/Phone-permission.png"
              alt="Step 2"
              className="h-6 w-6 mr-3"
            />
            <div>
              <h3 className="font-bold text-neutral-800 text-nowrap">
                Step 2: Apply for Jireh Health Membership
              </h3>
              <p className="text-neutral-600 text-sm leading-6">
                In this process you will need a few key mandatory items ready
                before hand:
              </p>
              <ol className="text-neutral-600 text-sm space-y-4 pl-6">
                <li className="mt-6">
                  <span className="font-semibold">1) Financial Statements:</span>
                  <ul className="list-disc pl-6 leading-8 font-semibold">
                    <li>Bank statements (past 12 months)</li>
                    <li>Mpesa statements (past 12 months)</li>
                  </ul>
                </li>
                <a
                  className="text-[#29AB0B] underline py-4 cursor-pointer"
                  onClick={() => setCurrentScreen(currentScreen + 1)}
                >
                  Not sure how to get these?
                  <span className=" cursor-pointer">[Click here for help]</span>
                </a>
                <li>
                  <span className=" font-semibold">2) Guarantor:</span>
                  <p className="text-neutral-600 text-sm leading-6">
                    A guarantor is a person who agrees to support paying for
                    your loan if you cannot repay it.
                  </p>
                  <p className="text-neutral-600 text-sm pt-4 leading-6">
                    <span className="font-semibold">Choose a Guarantor: </span>
                    Invite someone (local or international) who can support your
                    application if needed.
                  </p>
                  <p className="text-red-600 font-medium flex gap-2 flex-row items-center pb-4 leading-6">
                    <img
                      src="/Star.png"
                      alt="Warning"
                      className="h-2 w-2 mt-0 "
                    />
                    Must be a credit card holder.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-auto">
        <Link to="/patients/auth">
          <Button className="w-full py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700">
            Proceed
          </Button>
        </Link>
      </footer>
    </div>
  )
}
