import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/Dialog"
import sparkle from "@/assets/icons/sparkle.svg"
import { Link } from "react-router-dom"
import { Button } from "@/components/Button"

/* 
    Usage: child should be a button or link with "asChild property"
*/
export default function LoanTermsDialog({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-w-[400px]"
        aria-description="Jireh Loan Terms"
      >
        <DialogHeader>
          <DialogTitle>Jireh Loan Terms</DialogTitle>
          <DialogDescription className="sr-only">
            Jireh loan terms
          </DialogDescription>
        </DialogHeader>

        <section className="flex flex-col gap-3  py-5 bg-primary-30">
          <div className="flex flex-col gap-3 bg-primary/10 p-3 rounded-md">
            <p className="flex justify-between font-medium mt-2">
              Loan Duration: <span>2 weeks</span>
            </p>
            <p className="flex justify-between font-medium mt-2">
              Interest Amount: <span>0 KES</span>
            </p>
            <p className="flex justify-between font-medium mt-2">
              Service Fee: <span>0 KES</span>
            </p>
          </div>
          <p className="flex text-red-500 mt-3 items-center gap-2 text-sm">
            <img
              src={sparkle}
              alt="sparkle"
              className="w-3 h-3"
              aria-hidden="true"
            />
            If your loan payment is delayed, there will be a penalty fee of KES
            500
          </p>
        </section>

        <DialogFooter>
          <Button className="w-full" size="lg">
            <Link
              to="request-medical-info"
              className="no-underline w-full h-full grid place-content-center text-white"
            >
              Request Medical Information
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
