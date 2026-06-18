import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "./ErrorBlock"

/* 
    This component is used to wrap a query result in a component.
    It renders the children if the query is successful, otherwise it renders an error block or a loading component.
    Use it to avoid conditional statements within JSX templates.
*/
export default function QueryWrapper({
  children,
  isLoading,
  error,
}: {
  children: any
  error: any
  isLoading: boolean
}) {
  if (isLoading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <ErrorBlock message={error.response?.data.message || error.message} />
    )
  }

  return children
}
