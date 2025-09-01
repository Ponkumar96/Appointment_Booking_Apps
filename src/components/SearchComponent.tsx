import React, { useState, useEffect } from 'react'
import { Search, ArrowLeft, Star, MapPin, Clock, ChevronRight } from 'lucide-react'
import type { Clinic } from '../App'
import AdBanner from './AdBanner'

interface SearchComponentProps {
  searchQuery: string
  dummyClinics: Clinic[]
  onClinicSelect: (clinic: Clinic) => void
  onBack: () => void
  showAds: boolean
}

export default function SearchComponent({
  searchQuery,
  dummyClinics,
  onClinicSelect,
  onBack,
  showAds
}: SearchComponentProps) {
  const [query, setQuery] = useState(searchQuery)
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([])

  useEffect(() => {
    if (query.trim()) {
      const filtered = dummyClinics.filter(clinic =>
        clinic.name.toLowerCase().includes(query.toLowerCase()) ||
        clinic.specialty.toLowerCase().includes(query.toLowerCase()) ||
        clinic.address.toLowerCase().includes(query.toLowerCase()) ||
        clinic.doctors.some(doctor => 
          doctor.name.toLowerCase().includes(query.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(query.toLowerCase())
        )
      )
      setFilteredClinics(filtered)
    } else {
      setFilteredClinics(dummyClinics)
    }
  }, [query, dummyClinics])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const popularSearches = [
    'General Medicine',
    'Cardiology', 
    'Pediatrics',
    'Emergency',
    'Dermatology',
    'Orthopedics'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <h1 className="text-xl font-bold text-primary">Search Clinics</h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search for clinics, doctors, or specialties..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-input bg-input-background rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </form>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {showAds && <AdBanner />}

        {/* Popular Searches */}
        {!query.trim() && (
          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Popular Searches</h2>
            <div className="grid grid-cols-2 gap-3">
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => setQuery(search)}
                  className="bg-muted hover:bg-primary/10 text-foreground p-4 rounded-2xl text-left transition-colors"
                >
                  <p className="font-semibold">{search}</p>
                  <p className="text-sm text-muted-foreground">Find specialists</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.trim() && (
          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Search Results for "{query}"
              </h2>
              <p className="text-muted-foreground">
                {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'} found
              </p>
            </div>

            {filteredClinics.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No clinics found</p>
                <p className="text-muted-foreground text-sm">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    onClick={() => onClinicSelect(clinic)}
                    className="w-full text-left border-2 border-border rounded-2xl p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={clinic.image} 
                        alt={clinic.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{clinic.name}</h3>
                            <p className="text-muted-foreground">{clinic.specialty}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{clinic.distance}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{clinic.address}</p>
                        
                        {clinic.doctors.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {clinic.doctors.slice(0, 2).map((doctor) => (
                              <span 
                                key={doctor.id}
                                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {doctor.name}
                              </span>
                            ))}
                            {clinic.doctors.length > 2 && (
                              <span className="text-primary text-sm">
                                +{clinic.doctors.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showAds && <AdBanner />}

        {/* Live Search Suggestions for first-time users */}
        {showAds && query.trim() && (
          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Live Suggestions</h3>
            <div className="space-y-3">
              {dummyClinics.slice(0, 3).map((clinic) => (
                <button
                  key={`suggestion-${clinic.id}`}
                  onClick={() => onClinicSelect(clinic)}
                  className="w-full text-left bg-muted/50 hover:bg-muted rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{clinic.name}</p>
                      <p className="text-sm text-muted-foreground">{clinic.specialty}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}