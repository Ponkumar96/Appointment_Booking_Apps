import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Copy, User, Building2, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface TestCredential {
  phone: string
  role: 'Patient' | 'Clinic Admin' | 'Clinic Staff'
  clinic?: string
  description: string
  features: string[]
}

const testCredentials: TestCredential[] = [
  {
    phone: '+91 98765 43210',
    role: 'Patient',
    description: 'Regular patient with appointment history',
    features: ['Book appointments', 'View history', 'Manage family', 'Notifications']
  },
  {
    phone: '+91 98765 43211',
    role: 'Patient',
    description: 'New user (first-time experience)',
    features: ['Registration flow', 'Live search', 'Ad banners', 'Guided booking']
  },
  {
    phone: '+91 99900 00001',
    role: 'Clinic Admin',
    clinic: 'City General Hospital',
    description: 'Full administrative access',
    features: ['Manage all doctors', 'Patient queue', 'Add staff', 'Activity logs']
  },
  {
    phone: '+91 99900 00002',
    role: 'Clinic Admin',
    clinic: 'Heart Care Center',
    description: 'Cardiology clinic admin',
    features: ['Token management', 'Queue progression', 'Specialist workflow', 'Real-time updates']
  }
]

export default function TestCredentialsCard() {
  const [isVisible, setIsVisible] = useState(false)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Patient':
        return <User className="w-4 h-4" />
      case 'Clinic Admin':
        return <Shield className="w-4 h-4" />
      case 'Clinic Staff':
        return <Building2 className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Patient':
        return 'bg-blue-100 text-blue-800'
      case 'Clinic Admin':
        return 'bg-green-100 text-green-800'
      case 'Clinic Staff':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg bg-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          Test Credentials
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Test Login Credentials
              </CardTitle>
              <CardDescription>
                Use these credentials to test different user roles. Universal OTP: <strong>123456</strong>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {testCredentials.map((credential, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(credential.role)}
                      <div>
                        <CardTitle className="text-base">{credential.role}</CardTitle>
                        {credential.clinic && (
                          <p className="text-sm text-muted-foreground">{credential.clinic}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getRoleColor(credential.role)}>
                      {credential.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{credential.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Phone Number */}
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                        <p className="font-mono">{credential.phone}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credential.phone, 'Phone number')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* OTP */}
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">OTP Code</p>
                        <p className="font-mono">123456</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('123456', 'OTP code')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between text-xs h-auto p-2"
                        onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                      >
                        Features Available
                        <span className="text-xs">
                          {expandedCard === index ? '−' : '+'}
                        </span>
                      </Button>
                      
                      {expandedCard === index && (
                        <div className="space-y-1">
                          {credential.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick Testing Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use different phone numbers to test different user experiences</li>
              <li>• Open multiple tabs to test real-time features</li>
              <li>• Patient numbers start with different area codes for variety</li>
              <li>• Clinic admin numbers end in 999-000X for easy identification</li>
              <li>• All credentials work with the same OTP: 123456</li>
            </ul>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard('+91 98765 43210\n123456', 'Patient credentials')}
            >
              Copy Patient Login
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard('+91 99900 00001\n123456', 'Admin credentials')}
            >
              Copy Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}