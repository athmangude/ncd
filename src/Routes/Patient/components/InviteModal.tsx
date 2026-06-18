import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"

export default function InviteModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="text-purple-500 font-medium cursor-pointer">
          Send invite →
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Refer a friend</DialogTitle>
          <DialogDescription>
            Refer a friend to Jireh for affordable healthcare funding.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4">
          <div className="space-y-1">
            <label className="block text-neutral-700 text-sm font-medium">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter Full Name"
              className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-neutral-700 text-sm font-medium">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="Enter Phone Number"
                className="w-full p-3 pl-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="absolute top-3 left-3">🇰🇪</div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-neutral-700 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Insert Email"
              className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="button"
            className="w-full py-3 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition"
          >
            Invite
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
