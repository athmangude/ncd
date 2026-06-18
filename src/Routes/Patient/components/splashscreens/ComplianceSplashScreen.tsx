import SplashScreenProgressBar from "@/Routes/SplashScreenProgressBar"
import { useNavigate } from "react-router-dom"
export default function ComplianceSplashScreen() {
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
        <div className="h-[60%] flex flex-col items-center ">
          <div className="flex items-center justify-between w-full max-w-screen-lg  p-4">
            <img src="/jireh-white.svg" alt="Jireh Logo" className="h-8" />
            <SplashScreenProgressBar currentStep={5} />
          </div>
          <div className=" text-white text-center">
            <h2 className="text-lg font-medium text-white mb-4">
              We are compliant with:
            </h2>
            <div className="flex items-center justify-center mb-8">
              <img
                src="/kenya-court-of-arms.png"
                alt="Court of Arms"
                className="max-h-36"
              />
            </div>

            <h3 className="text-lg font-medium mb-6">Our team's worked at:</h3>
            <div className="flex items-center justify-center">
              <img
                src="/world-bank.png"
                alt="World Bank Logo"
                className=" max-h-44"
              />
            </div>
          </div>
        </div>
        <div className="curved-edge px-6 pt-10 flex flex-col items-center justify-evenly text-center text-white h-[40%]">
          <p className="text-xl text-white text-center font-semibold">
            We take your protection very seriously
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
