import SplashScreenProgressBar from "@/Routes/SplashScreenProgressBar"
import { useNavigate } from "react-router-dom"

export default function AccountSplashScreen() {
  const navigate = useNavigate()
  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{
        backgroundImage: `url("background-gradient.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="h-screen overflow-hidden"
        style={{
          backgroundImage: `url("background-contours.png")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="h-[60%]  ">
          <div className="flex items-center justify-between w-full max-w-screen-lg  p-4">
            <img src="/jireh-white.svg" alt="Jireh Logo" className="h-8" />
            <SplashScreenProgressBar currentStep={4} />
          </div>
          <div className="relative flex flex-col items-start space-y-10 p-6">
            <div className="absolute top-20 bottom-10 left-[32px] w-[0.8px] bg-[#06C270]"></div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full place-content-center flex items-center w-4 h-4 bg-[#C4FFE6]">
                <div className="rounded-full place-content-center flex items-center w-2 h-2 bg-[#06C270]"></div>
              </div>
              <span className="text-white font-medium">
                Sign up for Jireh Health Membership
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full place-content-center flex items-center w-4 h-4 bg-[#C4FFE6]">
                <div className="rounded-full place-content-center flex items-center w-2 h-2 bg-[#06C270]"></div>
              </div>
              <span className="text-white font-medium">Get approved</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full place-content-center flex items-center w-4 h-4 bg-[#C4FFE6]">
                <div className="rounded-full place-content-center flex items-center w-2 h-2 bg-[#06C270]"></div>
              </div>
              <span className="text-white font-medium">
                Request treatment funding
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full place-content-center flex items-center w-4 h-4 bg-[#C4FFE6]">
                <div className="rounded-full place-content-center flex items-center w-2 h-2 bg-[#06C270]"></div>
              </div>
              <span className="text-white font-medium">
                Jireh pays for your medical bill
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full place-content-center flex items-center w-4 h-4 bg-[#C4FFE6]">
                <div className="rounded-full place-content-center flex items-center w-2 h-2 bg-[#06C270]"></div>
              </div>
              <span className="text-white font-medium">
                Get the quality care you deserve
              </span>
            </div>
          </div>
        </div>
        <div className="curved-edge px-6 pt-10 flex flex-col items-center justify-evenly text-center text-white h-[40%]">
          <p className="text-xl text-white text-center font-semibold">
            How it works?
          </p>
          <div className=" flex flex-row justify-center gap-4">
            <button
              role="link"
              onClick={() => navigate("/patients/auth/login")}
              className="w-[170px] text-white border border-white py-2 px-4 rounded-lg font-semibold text-base"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
