export default function CheckEmail() {
  return (
    <div className="flex flex-col gap-5 text-center items-center">
      <h1 className="text-3xl text-black font-medium">Email Verification</h1>

      <p className="max-w-[55ch] text-sm">
        An email has been sent to your email address.
      </p>

      <p>
        <b>Click on the link to complete the sign up process.</b>
      </p>
    </div>
  )
}
