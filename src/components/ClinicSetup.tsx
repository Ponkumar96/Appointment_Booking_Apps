import React, { useState } from "react";
import {
  PlusCircle,
  Clock,
  Users,
  Settings,
  Phone,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import type { User, Clinic, Doctor, Handler } from "../App";

interface ClinicSetupProps {
  user: User;
  clinic: Clinic;
  onSetupComplete: (clinic: Clinic) => void;
  onLogout: () => void;
  onAddHandler: (handler: Handler) => void;
}

interface DoctorForm {
  name: string;
  specialty: string;
  experience: string;
  startTime: string;
  endTime: string;
  days: string[];
  maxTokensPerDay: number;
  consultationDurationMinutes: number;
}

interface HandlerForm {
  name: string;
  phone: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ClinicSetup({
  user,
  clinic,
  onSetupComplete,
  onLogout,
  onAddHandler,
}: ClinicSetupProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [doctors, setDoctors] = useState<DoctorForm[]>([]);
  const [handlers, setHandlers] = useState<HandlerForm[]>([]);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showHandlerForm, setShowHandlerForm] = useState(false);

  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    name: "",
    specialty: "",
    experience: "",
    startTime: "09:00",
    endTime: "17:00",
    days: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
    maxTokensPerDay: 20,
    consultationDurationMinutes: 15,
  });

  const [handlerForm, setHandlerForm] = useState<HandlerForm>({
    name: "",
    phone: "",
  });

  const handleHandlerPhoneChange = (value: string) => {
    // Allow completely empty input
    if (value === '') {
      setHandlerForm(prev => ({ ...prev, phone: '' }))
      return
    }
    
    // Extract only digits from the input
    const digitsOnly = value.replace(/\D/g, '')
    
    // Limit to 10 digits max (for Indian mobile numbers)
    const limitedDigits = digitsOnly.slice(0, 10)
    
    // Format as XXXXX XXXXX for better readability
    let formatted = ''
    if (limitedDigits.length === 0) {
      formatted = ''
    } else if (limitedDigits.length <= 5) {
      formatted = limitedDigits
    } else {
      formatted = `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`
    }
    
    setHandlerForm(prev => ({ ...prev, phone: formatted }))
  };

  const handleAddDoctor = () => {
    if (
      !doctorForm.name ||
      !doctorForm.specialty ||
      !doctorForm.experience
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setDoctors([...doctors, { ...doctorForm }]);
    setDoctorForm({
      name: "",
      specialty: "",
      experience: "",
      startTime: "09:00",
      endTime: "17:00",
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      maxTokensPerDay: 20,
      consultationDurationMinutes: 15,
    });
    setShowDoctorForm(false);
  };

  const handleAddHandler = () => {
    if (!handlerForm.name || !handlerForm.phone) {
      alert("Please fill in all required fields");
      return;
    }

    const newHandler: Handler = {
      id: `handler_${Date.now()}`,
      name: handlerForm.name,
      phone: handlerForm.phone,
      clinicId: clinic.id,
      canManageAllDoctors: true,
    };

    setHandlers([...handlers, handlerForm]);
    onAddHandler(newHandler);
    setHandlerForm({ name: "", phone: "" });
    setShowHandlerForm(false);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (doctors.length === 0) {
        alert("Please add at least one doctor to continue");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleCompleteSetup = () => {
    if (doctors.length === 0) {
      alert("Please add at least one doctor");
      return;
    }

    const setupDoctors: Doctor[] = doctors.map(
      (doc, index) => ({
        id: `doctor_${clinic.id}_${index + 1}`,
        name: doc.name,
        specialty: doc.specialty,
        experience: doc.experience,
        available: true,
        clinicId: clinic.id,
        clinicName: clinic.name,
        clinicAddress: clinic.address,
        status: "not_arrived" as const,
        timings: {
          startTime: doc.startTime,
          endTime: doc.endTime,
          days: doc.days,
        },
        maxTokensPerDay: doc.maxTokensPerDay,
        consultationDurationMinutes:
          doc.consultationDurationMinutes,
        currentToken: `${doc.name.charAt(3).toUpperCase()}01`,
        nextToken: `${doc.name.charAt(3).toUpperCase()}01`,
        totalPatientsToday: 0,
        completedToday: 0,
      }),
    );

    const updatedClinic: Clinic = {
      ...clinic,
      doctors: setupDoctors,
      isSetup: true,
    };

    onSetupComplete(updatedClinic);
  };

  const toggleDay = (day: string) => {
    setDoctorForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const removeDoctor = (index: number) => {
    setDoctors(doctors.filter((_, i) => i !== index));
  };

  const removeHandler = (index: number) => {
    setHandlers(handlers.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-primary truncate">
                {clinic.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Setup - Step {currentStep} of 2
              </p>
            </div>

            <button
              onClick={onLogout}
              className="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Mobile Progress Indicator */}
        <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
          <h2 className="text-xl font-bold text-primary mb-4">
            Clinic Setup
          </h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 1 ? (
                  <Check className="w-4 h-4" />
                ) : (
                  "1"
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-foreground flex-1">
                Add Doctors
              </span>
            </div>
            <div
              className={`h-0.5 w-8 ${currentStep > 1 ? "bg-primary" : "bg-muted"}`}
            />
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium text-foreground flex-1">
                Add Handlers
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Add Doctors */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Step 1: Add Doctors
                </h3>
                <p className="text-muted-foreground text-sm">
                  Add doctors who will work at your clinic
                </p>
              </div>

              <button
                onClick={() => setShowDoctorForm(true)}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Doctor
              </button>
            </div>

            {/* Doctor List */}
            {doctors.length === 0 ? (
              <div className="bg-background rounded-2xl shadow-sm border border-border p-6 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">
                  No doctors added yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Add at least one doctor to continue
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="bg-background rounded-2xl shadow-sm border border-border p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {doctor.name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {doctor.specialty}
                        </p>
                      </div>
                      <button
                        onClick={() => removeDoctor(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">
                          {doctor.experience}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {doctor.startTime} - {doctor.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">
                          {doctor.maxTokensPerDay} tokens/day
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {doctor.consultationDurationMinutes}{" "}
                          mins
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {doctor.days.slice(0, 3).join(", ")}
                        {doctor.days.length > 3 &&
                          ` +${doctor.days.length - 3} more`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Add Handlers */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Step 2: Add Handlers
                </h3>
                <p className="text-muted-foreground text-sm">
                  Add staff to manage appointments (optional)
                </p>
              </div>

              <button
                onClick={() => setShowHandlerForm(true)}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add Handler
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-primary font-semibold mb-2 text-sm">
                About Handlers:
              </p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• Login using phone number with OTP</li>
                <li>• Manage appointments for all doctors</li>
                <li>
                  • Optional but recommended for busy clinics
                </li>
                <li>
                  • Can be added later from admin dashboard
                </li>
              </ul>
            </div>

            {/* Handler List */}
            {handlers.length === 0 ? (
              <div className="bg-background rounded-2xl shadow-sm border border-border p-6 text-center">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">
                  No handlers added yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Handlers help manage patient queues
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {handlers.map((handler, index) => (
                  <div
                    key={index}
                    className="bg-background rounded-2xl shadow-sm border border-border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {handler.name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {handler.phone}
                        </p>
                        <span className="text-xs text-primary">
                          Can manage all doctors
                        </span>
                      </div>
                      <button
                        onClick={() => removeHandler(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="flex gap-3">
          {currentStep === 1 ? (
            <button
              onClick={handleNextStep}
              disabled={doctors.length === 0}
              className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Add Handlers
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-muted text-muted-foreground px-6 py-4 rounded-xl hover:bg-muted/80 transition-colors font-semibold flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleCompleteSetup}
                className="flex-1 bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                Complete Setup
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-0 z-50">
          <div className="bg-background rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background rounded-t-3xl border-b border-border p-4 z-10">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-foreground">
                  Add Doctor
                </h4>
                <button
                  onClick={() => setShowDoctorForm(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddDoctor();
              }}
              className="p-4 space-y-4 pb-24"
            >
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Dr. John Smith"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Specialty *
                </label>
                <input
                  type="text"
                  value={doctorForm.specialty}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      specialty: e.target.value,
                    })
                  }
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Cardiology"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Experience *
                </label>
                <input
                  type="text"
                  value={doctorForm.experience}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      experience: e.target.value,
                    })
                  }
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="10 years"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={doctorForm.startTime}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={doctorForm.endTime}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Working Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                        doctorForm.days.includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-2">
                    Max Tokens/Day
                  </label>
                  <input
                    type="number"
                    value={doctorForm.maxTokensPerDay}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        maxTokensPerDay: parseInt(
                          e.target.value,
                        ),
                      })
                    }
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-2">
                    Duration (mins)
                  </label>
                  <select
                    value={
                      doctorForm.consultationDurationMinutes
                    }
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        consultationDurationMinutes: parseInt(
                          e.target.value,
                        ),
                      })
                    }
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={20}>20 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDoctorForm(false)}
                  className="bg-muted text-muted-foreground py-4 px-6 rounded-xl hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDoctor}
                  className="flex-1 bg-primary text-primary-foreground py-4 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                >
                  Add Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handler Form Modal */}
      {showHandlerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-0 z-50">
          <div className="bg-background rounded-t-3xl w-full max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-background rounded-t-3xl border-b border-border p-4 z-10">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-foreground">
                  Add Handler
                </h4>
                <button
                  onClick={() => setShowHandlerForm(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddHandler();
              }}
              className="p-4 space-y-4 pb-24"
            >
              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Handler Name *
                </label>
                <input
                  type="text"
                  value={handlerForm.name}
                  onChange={(e) =>
                    setHandlerForm({
                      ...handlerForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Alice Johnson"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={handlerForm.phone}
                  onChange={(e) => handleHandlerPhoneChange(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter 10-digit mobile number
                </p>
              </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowHandlerForm(false)}
                  className="bg-muted text-muted-foreground py-4 px-6 rounded-xl hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHandler}
                  className="flex-1 bg-primary text-primary-foreground py-4 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                >
                  Add Handler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}