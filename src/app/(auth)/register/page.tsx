'use client'

import { useState } from 'react'
import RoleSelection from '@/components/auth/RoleSelection'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  // Track which step the user is on and their selected role
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<string>('TENANT')

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole)
    setStep(2) // Move to the form
  }

  // Step 1: The UI/UX Designer's Role Selection Screen
  if (step === 1) {
    return <RoleSelection onContinue={handleRoleSelection} />
  }

  // Step 2: The actual registration form (pre-filled with the selected role)
  // RegisterForm now natively handles the full-screen layout and the Back button logic.
  return (
    <RegisterForm 
      defaultRole={role} 
      onBack={() => setStep(1)} 
    />
  )
}