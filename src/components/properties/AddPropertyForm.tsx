'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft } from 'lucide-react'
import { propertySchema, type PropertyFormData } from './schema'
import { createPropertyAction } from '@/actions/properties'

// Import isolated steps
import Step1BasicInfo from './steps/Step1BasicInfo'
import Step2Details from './steps/Step2Details'
import Step3Pricing from './steps/Step3Pricing'
import Step4Media from './steps/Step4Media'
import Step5Documents from './steps/Step5Features' // Ensure this matches your actual filename
import Step6Preview from './steps/Step6Preview'
import SuccessScreen from './SuccessScreen'

export default function AddPropertyForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

const methods = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema) as any, // <-- Add "as any" here
    defaultValues: {
      listingType: 'RENTAL',
      propertyType: 'APARTMENT',
      title: '',
      description: '',
      state: 'Lagos',
      locationArea: 'Lekki',
      address: '',
      latitude: 6.5244,
      longitude: 3.3792,
      bedrooms: 0,
      bathrooms: 0,
      toilets: 0,
      parkingSpaces: 0,
      basePrice: 0,
      serviceCharge: 0,
      cautionFee: 0,
      legalFee: 0,       // Agreement Fee
      agencyFee: 0,      // Agency Fee
      commissionPct: 0,
      documents: []
    }
  })

  const listingType = methods.watch('listingType')
  const isSale = listingType === 'SALE'

  const STEPS = isSale ? [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Details' },
    { id: 3, name: 'Pricing' },
    { id: 4, name: 'Media' },
    { id: 5, name: 'Documents' }, 
    { id: 6, name: 'Preview' }
  ] : [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Details' },
    { id: 3, name: 'Pricing' },
    { id: 4, name: 'Media' },
    { id: 5, name: 'Preview' }
  ]

  const isPreviewStep = currentStep === STEPS.length

  useEffect(() => {
    if (currentStep > STEPS.length) {
      setCurrentStep(STEPS.length)
    }
  }, [STEPS.length, currentStep])

  // STRICT VALIDATION GATEKEEPER
  const nextStep = async () => {
    const values = methods.getValues()
    let fieldsToValidate: any = []

    // --- STEP 1 VALIDATION ---
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'address']
    }

    // --- STEP 2 VALIDATION ---
    if (currentStep === 2) {
      const isRentApartment = values.listingType === 'RENTAL' && values.propertyType === 'APARTMENT'
      const isLand = values.propertyType === 'LAND'
      const isShortletApartment = values.listingType === 'SHORTLET' && values.propertyType === 'APARTMENT'
      const isSellHouse = values.listingType === 'SALE' && values.propertyType === 'HOUSE'

      if (isRentApartment) {
        if (!values.bedroomTypes || values.bedroomTypes.length === 0) return alert("Please select at least one bedroom type.")
        if (!values.totalUnits || isNaN(values.totalUnits)) return alert("Please enter the total number of units.")
        if (values.availableUnits === undefined || isNaN(values.availableUnits as number)) return alert("Please enter the available units.")
      } else if (isLand) {
        if (!values.size || isNaN(values.size)) return alert("Please enter the land size in sqm.")
      } else if (isShortletApartment) {
        if (!values.shortletBedrooms) return alert("Please select the number of bedrooms.")
      } else if (!isSellHouse) {
        // Fallback for commercial/others
        fieldsToValidate = ['bedrooms', 'bathrooms', 'toilets', 'parkingSpaces']
      }
    }

    // --- STEP 3 VALIDATION ---
    if (currentStep === 3) {
      if (!values.basePrice || isNaN(values.basePrice) || values.basePrice <= 0) {
        return alert("Please enter a valid price.")
      }
      if (values.listingType === 'RENTAL' && !values.tenancyDuration) {
        return alert("Please select a tenancy duration (e.g., 1 Year).")
      }
    }

    // --- STEP 4 VALIDATION ---
    if (currentStep === 4) {
      if (imageFiles.length === 0) {
        return alert("Please upload at least one property image before proceeding.")
      }
    }

    // --- STEP 5 VALIDATION (SALE ONLY) ---
    if (isSale && currentStep === 5) {
      if (!values.documents || values.documents.length === 0) {
        return alert("Please select at least one legal document (e.g., Receipt, Contract of Sale, or C of O).")
      }
    }

    const isValid = fieldsToValidate.length > 0 ? await methods.trigger(fieldsToValidate) : true
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }
  
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const onSubmit = async (data: PropertyFormData) => {
    if (!isPreviewStep || isSubmitting) return

    if (imageFiles.length === 0) {
      alert("Please upload at least one image.")
      return setCurrentStep(4)
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify(data))
      imageFiles.forEach(file => formData.append('images', file))
      
      const result = await createPropertyAction(formData)
      if (result.success) setIsSuccess(true)
      else alert(result.error)
    } catch (error) {
      alert("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- ERROR CATCHER ADDED HERE ---
  const onValidationError = (errors: any) => {
    console.error("Zod Validation Errors:", errors)
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0]
      // This will pop up exactly what is blocking your submission!
      alert(`Submission blocked by hidden rule on "${firstKey}": ${errors[firstKey].message}`)
    }
  }

  if (isSuccess) return <SuccessScreen />

  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen pt-0 px-4 md:px-0">
      
      {/* 1. TOP NAVIGATION */}
      <div className="flex items-center justify-between mb-2 -mt-2">
        <button type="button" onClick={prevStep} disabled={currentStep === 1 || isSubmitting} className="p-2 -ml-2 rounded-full hover:bg-gray-50 disabled:opacity-30">
          <ChevronLeft className="w-6 h-6 text-[#091F11]" />
        </button>
        
        <div className="flex items-center justify-center -mt-4 scale-125 origin-top">
           <img src="/logo.png" alt="Impact Link" className="h-16 w-auto object-contain" />
        </div>
        
        <div className="w-10" /> 
      </div>

      {/* 2. PAGE HEADER */}
      {currentStep === 1 && (
        <div className="mb-4 mt-0">
          <h1 className="text-[26px] font-extrabold text-[#091F11] mb-1 tracking-tight">List a New Property</h1>
          <p className="text-gray-500 text-[14px] leading-relaxed">Fill in the details below to list your property on Impact Link.</p>
        </div>
      )}

      {/* 3. DYNAMIC STEPPER COMPONENT */}
      <div className="flex justify-between items-start w-full mb-7 mt-0">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            {idx < STEPS.length - 1 && (
              <div className={`absolute top-3.5 left-[50%] w-full h-[2px] ${currentStep > step.id ? 'bg-[#005C3A]' : 'bg-gray-100'}`} />
            )}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold relative z-10 transition-colors ${currentStep >= step.id ? 'bg-[#005C3A] text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step.id}
            </div>
            <span className={`text-[10px] mt-2 whitespace-nowrap absolute top-7 ${currentStep >= step.id ? 'text-[#005C3A] font-bold' : 'text-gray-400 font-medium'}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {/* 4. FORM CONTENT */}
      <FormProvider {...methods}>
        {/* ADDED onValidationError HERE */}
        <form
          className="space-y-0"
          onSubmit={(event) => {
            event.preventDefault()
            const submitter = (event.nativeEvent as SubmitEvent).submitter

            // Only the preview's submit button can start an upload.
            if (
              !isPreviewStep ||
              isSubmitting ||
              !(submitter instanceof HTMLButtonElement) ||
              submitter.name !== 'submitProperty'
            ) return

            void methods.handleSubmit(onSubmit, onValidationError)(event)
          }}
        >
          
          {currentStep === 1 && <Step1BasicInfo />}
          {currentStep === 2 && <Step2Details />}
          {currentStep === 3 && <Step3Pricing />}
          {currentStep === 4 && <Step4Media imageFiles={imageFiles} setImageFiles={setImageFiles} />}
          
          {isSale && currentStep === 5 && <Step5Documents />}
          {(isSale ? currentStep === 6 : currentStep === 5) && <Step6Preview imageFiles={imageFiles} />}

          <div className={`flex flex-col gap-3 ${currentStep === 2 ? 'mt-6 px-4 md:px-6' : 'mt-6'}`}>
            {!isPreviewStep ? (
              <button key="next" type="button" onClick={(event) => { event.preventDefault(); void nextStep() }} disabled={isSubmitting} className="w-full bg-[#005C3A] hover:bg-[#004b2f] text-white py-4 rounded-[14px] text-[15px] font-bold transition-colors shadow-sm">
                Next
              </button>
            ) : (
              <button key="submit" type="submit" name="submitProperty" disabled={isSubmitting} className="w-full bg-[#005C3A] hover:bg-[#004b2f] text-white py-4 rounded-[14px] text-[15px] font-bold transition-colors disabled:opacity-50 shadow-md">
                {isSubmitting ? 'Uploading & Saving...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}