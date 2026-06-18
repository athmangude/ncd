export function highlightSearchTerm(text: string, searchTerm: string): JSX.Element {
  if (!text || !searchTerm) return <>{text}</>
  
  const regex = new RegExp(`(${searchTerm})(.+)`, "gi")
  const match = regex.exec(text)
  
  if (match) {
    const [, searchMatch, afterMatch] = match
    const beforeText = text.slice(0, text.toLowerCase().indexOf(searchMatch.toLowerCase()))
    
    return (
      <>
        {beforeText}
        <span>{searchMatch}</span>
        <strong>{afterMatch}</strong>
      </>
    )
  }
  
  return <>{text}</>
}

export function formatEnum(value: string) {
  if (!value) return ""
  return value.replace(/_/g, " ")
}

export function arrayToSelectOptions(array: string[]) {
  if (!array) return []
  return array.map((value) => ({
    name: value
      .toLowerCase()
      .replace(/_/g, " ") //Replace underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalize each word,
    value: value,
  }))
}

export function resolveOrdinal(number: number) {
  const lastDigit = number % 10
  if (lastDigit === 1) return `${number}st`
  if (lastDigit === 2) return `${number}nd`
  if (lastDigit === 3) return `${number}rd`
  return `${number}th`
}

export function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15)
}

export function formatParenthesizedText(text: string): JSX.Element {
  if (!text) return <>{text}</>

  return (
    <>
      {text.split(/(\(.*?\))/).map((part, index) =>
        /^\(.*\)$/.test(part) ? (
          <span key={index} className="text-primary">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}


