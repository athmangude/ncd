import { useToast } from "@/hooks/useToast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import AccordionMenu from "./AccordionMenu"
import { CloudUpload } from "lucide-react"
import { Input } from "./Input"
import { Progress } from "./Progress"
import Loader from "./Loader"
import { getFinancialStatementsQueryKey } from "@/Routes/Patient/Pages/Onboarding/PatientFinancialStatements"
import PasscodeDialog from "./PasscodeDialog"

const allowedFileTypes = ["application/pdf"]

type UploadedFile = {
  id: number
  fileName: string
  passcode: string
}

type Inputs = {
  file: FileList
}
export default function StatementUploadForm({
  title,
  description,
  files,
}: {
  title: string
  description: string
  files: UploadedFile[]
}) {
  const { toast } = useToast()
  const [active, setActive] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const queryClient = useQueryClient()

  const { reset } = useForm<Inputs>()

  const mutation = useMutation({
    mutationFn: async ({
      file: _file,
      passcode: _passcode,
    }: {
      file: File
      passcode?: string
    }) => {
      // Stub: simulate upload progress without a real network call.
      // Replace with a Supabase Storage upload when the backend is ready.
      setUploadProgress(0)

      for (const pct of [25, 50, 75, 100]) {
        await new Promise((r) => setTimeout(r, 200))
        setUploadProgress(pct)
      }

      return { success: true }
    },
    onSuccess: () => {
      reset()
      setUploadProgress(0)
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      queryClient.invalidateQueries({
        queryKey: [getFinancialStatementsQueryKey],
      })
    },
    onError: (error: unknown) => {
      reset()
      setUploadProgress(0)
      const err = error as { message?: string }
      toast({
        title: "Error",
        description: err.message || "Upload failed",
        variant: "destructive",
      })
    },
  })

  return (
    <AccordionMenu
      title={title}
      description={description}
      onClick={() => setActive(!active)}
      buttonLabel="show upload form"
      icon={<CloudUpload className="w-7 h-7 text-muted-foreground" />}
      active={active}
      isRequired={true}
      buttonDisabled={mutation.isPending}
    >
      <div className="text-muted-foreground text-xs mt-3 -mb-3 font-medium flex justify-between items-center pb-2">
        Files uploaded ({files?.length})
      </div>

      {active && (
        <>
          {files.length > 0 && (
            <div className="mt-5 py-3 border-y ">
              <div className="max-h-[200px] overflow-y-scroll flex flex-col gap-2">
                {files.map((file: any) => (
                  <div
                    key={file.id}
                    className="flex gap-2 items-center bg-muted px-3 py-2 text-xs border border-dashed rounded-md"
                  >
                    {file.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}
          <form className="mt-5 text-muted-foreground flex flex-col gap-4">
            <div className={`${mutation.isPending && "hidden"}`}>
              <p className="text-xs text-center pb-1">
                Browse to select a document, then click to upload to save it.
              </p>
              <Input
                type="file"
                className={`w-full my-3`}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 1024 * 1024 * 10) {
                      toast({
                        title: "Error",
                        description: "File size must be less than 10MB",
                        variant: "destructive",
                      })
                      return
                    }

                    if (!allowedFileTypes.includes(file.type)) {
                      toast({
                        title: "Error",
                        description: "File type must be PDF",
                        variant: "destructive",
                      })
                      return
                    }

                    setSelectedFile(file)
                    setIsDialogOpen(true)
                  }
                }}
                disabled={mutation.isPending}
              />
            </div>

            {mutation.isPending && (
              <div>
                <Progress value={uploadProgress} className="mb-2" />

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Loader /> Uploading...
                  </div>
                  <span className="text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
            )}
          </form>

          <PasscodeDialog
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false)
              setSelectedFile(null)
            }}
            onSubmit={(data) => {
              if (selectedFile) {
                mutation.mutate({
                  file: selectedFile,
                  passcode: data.requiresPasscode ? data.passcode : undefined,
                })
                setIsDialogOpen(false)
                setSelectedFile(null)
              }
            }}
            selectedFileName={selectedFile?.name}
          />
        </>
      )}
    </AccordionMenu>
  )
}
