import React from "react"

interface ChipIconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string
  height?: number | string
}

export const ChipIcon: React.FC<ChipIconProps> = ({ width = 45, height = 35, ...props }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 45 35" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="45" height="35" rx="4" fill="#FFFFFF" fillOpacity="0.15"/>
      <path d="M0 11H12" stroke="white" strokeOpacity="0.2"/>
      <path d="M0 24H12" stroke="white" strokeOpacity="0.2"/>
      <path d="M33 11H45" stroke="white" strokeOpacity="0.2"/>
      <path d="M33 24H45" stroke="white" strokeOpacity="0.2"/>
      <rect x="12" y="6" width="21" height="23" rx="4" stroke="white" strokeOpacity="0.2"/>
      <path d="M22.5 6V29" stroke="white" strokeOpacity="0.2"/>
      <path d="M12 17.5H33" stroke="white" strokeOpacity="0.2"/>
    </svg>
  )
}
