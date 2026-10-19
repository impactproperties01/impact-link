import Image from 'next/image'
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react'
import type { Property } from '@prisma/client'

// Using a partial type since we might not fetch the entire relational graph every time
type PropertyCardProps = {
  property: Pick<Property, 'id' | 'title' | 'basePrice' | 'locationArea' | 'bedrooms' | 'bathrooms' | 'size' | 'images' | 'status'>
}

export default function PropertyCard({ property }: PropertyCardProps) {
  // Format the price to Nigerian Naira (₦)
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(property.basePrice)

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Image Container with Badges */}
      <div className="relative h-48 w-full">
        <Image 
          src={property.images[0] || '/placeholder-house.jpg'} 
          alt={property.title}
          fill
          className="object-cover"
        />
        
        {/* Verified Badge */}
        {property.status === 'VERIFIED' && (
          <div className="absolute top-3 left-3 bg-brand-forest text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-brand-forest text-[8px]">✓</span>
            </span>
            Verified
          </div>
        )}

        {/* Favorite Button */}
        <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition">
          <Heart className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg text-brand-dark">
            {formattedPrice} <span className="text-sm font-normal text-gray-500">/ year</span>
          </h3>
        </div>
        
        <p className="text-brand-dark font-medium mb-1">{property.title}</p>
        
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          {property.locationArea}
        </div>

        {/* Attributes Row */}
        <div className="flex items-center gap-4 text-gray-600 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {property.bedrooms} Beds
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {property.bathrooms} Baths
          </div>
          {property.size !== null && property.size > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" /> {property.size} sqm
            </div>
          )}
        </div>
      </div>
    </div>
  )
}