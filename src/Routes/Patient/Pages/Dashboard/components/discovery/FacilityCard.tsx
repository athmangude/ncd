import {  ChevronRight, Star, Tag, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/Button"
import { Facility } from "./types"

interface FacilityCardProps {
  facility: Facility
  onClick: (facility: Facility) => void
}

export function FacilityCard({ facility, onClick }: FacilityCardProps) {
  return (
    <div 
      className="bg-white rounded-xl p-3 shadow-sm border border-neutral-100 cursor-pointer hover:border-purple-200 transition-colors"
      onClick={() => onClick(facility)}
    >
      {/* Header: Icon, Recently Visited, Arrow */}
      <div className="flex items-start justify-between mb-2 capitalize">
        <div className="flex gap-3">

          <div>
            <h3 className="font-semibold text-neutral-900">{facility.name.toLocaleLowerCase()}</h3>

            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 flex-wrap">
              <div className=" items-center gap-0.5">
                  <span> {facility?.distance?.toFixed(1)} km</span> &nbsp;
                <span>•</span>
              </div>

              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 ">
              {facility.county ? `${facility.county.toLocaleLowerCase()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 flex-wrap ">
              {facility.facilityType && (
                <div className="flex items-center gap-0.5">
                  <span>{facility.facilityType.toLocaleLowerCase()}</span>
                  <span>•</span>
                </div>
              )}
              {facility.facilityLevel && (
                <div className="flex items-center gap-0.5 ">
                  <span>{facility.facilityLevel.toLocaleLowerCase()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 flex-wrap">
            {facility.rating &&  (
              <> 
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-neutral-400 text-neutral-400" />
                  <span>{facility.rating}</span>
                </div>
                <span>•</span>
              </>

            )}
              {facility.closingTime && (
                <div className="flex items-center gap-0.5">
                  <span>Closes {facility.closingTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-300" />
      </div>

      {/* Badges — cashback/discount only for verified partners */}
      {facility.verificationStatus === "APPROVED" && (
        <div className="flex gap-2 mb-3 pl-0 sm:pl-[52px] flex-wrap">
          {facility.discountPercentage && (
            <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-full font-medium">
              <Tag className="h-3 w-3" />
              {facility.discountPercentage}
            </div>
          )}
          <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-full font-medium">
            <Tag className="h-3 w-3" />
            Earn 5% cashback here
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 ">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          onClick={(e) => {
            e.stopPropagation()
            if (facility.latitude && facility.longitude) {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`,
                '_blank'
              )
            }
          }}
        >
          
          <MapPin className="h-3.5 w-3.5 mr-1.5" />
          Directions
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          onClick={(e) => {
            e.stopPropagation()
            if (facility.phoneNumber) {
              window.location.href = `tel:${facility.phoneNumber}`
            }
          }}
        >
          
          <Phone className="h-3.5 w-3.5 mr-1.5" />
          Call
        </Button>
      </div>
    </div>
  )
}
