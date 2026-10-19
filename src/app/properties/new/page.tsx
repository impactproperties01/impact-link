import AddPropertyForm from '@/components/properties/AddPropertyForm'

export const metadata = {
  title: 'Add New Property | Impact Link',
}

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pt-8 px-4">
      <AddPropertyForm />
    </div>
  )
}