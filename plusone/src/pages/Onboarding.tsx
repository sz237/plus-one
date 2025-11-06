import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/profileService";
import type { Profile, ProfileResponse, Gender } from "../types/profile";
import { GENDER_VALUES } from "../types/profile";
import type { Location } from "../types/profile";
import "../styles/Onboarding.css";

type StoredUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

const DEFAULT_AVATAR =
  "https://avatars.dicebear.com/api/initials/PlusOne.svg?scale=110&background=%23f5f5f5";

const STEP_META = [
  { id: 1, title: "Demographics", subtitle: "Tell us a bit about yourself" },
  { id: 2, title: "Career", subtitle: "Share what you work on" },
  { id: 3, title: "Interests", subtitle: "Let others know what you enjoy" },
  { id: 4, title: "Profile Photo", subtitle: "Put a face to your name" },
] as const;

const CITY_OPTIONS: Array<Location> = [
  { city: "Nashville", state: "TN", country: "US" },
  { city: "Atlanta", state: "GA", country: "US" },
  { city: "Chicago", state: "IL", country: "US" },
  { city: "New York", state: "NY", country: "US" },
  { city: "San Francisco", state: "CA", country: "US" },
  { city: "Austin", state: "TX", country: "US" },
  { city: "Boston", state: "MA", country: "US" },
  { city: "Seattle", state: "WA", country: "US" },
  { city: "Miami", state: "FL", country: "US" },
  { city: "Los Angeles", state: "CA", country: "US" },
];

const INTEREST_OPTIONS = [
  "Live Music & Concerts",
  "Game Nights",
  "Outdoor Adventures",
  "Coffee Chats",
  "Fitness & Wellness",
  "Volunteer Work",
  "Art & Museums",
  "Foodie Finds",
  "Sports & Intramurals",
  "Hackathons",
] as const;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const ages = Array.from({ length: 108 }, (_, i) => i + 13);

const defaultProfile: Profile = {
  gender: null,
  age: null,
  location: {
    city: "",
    state: "",
    country: "US",
    latitude: null,
    longitude: null,
  },
  job: {
    title: "",
    companiesName: "",
    companyId: "",
  },
  interests: [],
  profilePhoto: {
    storage: "stock",
    key: "default",
    url: DEFAULT_AVATAR,
  },
  numConnections: 0,
  numRequests: 0,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useMemo<StoredUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const [photoPreview, setPhotoPreview] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    if (!user?.userId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await profileService.getProfile(user.userId);
        hydrateFromResponse(response);
      } catch (err) {
        setError((err as Error).message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user?.userId]);

  useEffect(() => {
    setPhotoPreview(profile.profilePhoto?.url || DEFAULT_AVATAR);
  }, [profile.profilePhoto?.url]);

  if (!user?.userId) {
    return null;
  }

  const currentMeta = STEP_META[step - 1];
  const canGoBack = step > 1;

  const handleNext = async () => {
    const nextStep = Math.min(step + 1, STEP_META.length);
    await persistProfile(nextStep, false);
  };

  const handleBack = () => {
    if (canGoBack) {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleFinish = async () => {
    await persistProfile(STEP_META.length, true);
  };

  const toggleInterest = (interest: string) => {
    setProfile((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    toggleInterest(trimmed);
    setCustomInterest("");
  };

  const handlePhotoUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setProfile((prev) => ({
        ...prev,
        profilePhoto: {
          storage: "inline-base64",
          key: `upload-${Date.now()}`,
          url: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const persistProfile = async (nextStep: number, markComplete: boolean) => {
    if (!user?.userId) return;
    setIsSaving(true);
    setError(null);
    try {
      const normalizedProfile = normalizeProfileForRequest(profile);
      const response = await profileService.updateProfile(user.userId, {
        profile: normalizedProfile,
        step: nextStep,
        completed: markComplete,
      });
      hydrateFromResponse(response);
      if (response.onboarding?.completed) {
        navigate("/home", { replace: true });
      } else {
        setStep(Math.min(response.onboarding?.step ?? nextStep, STEP_META.length));
      }
    } catch (err) {
      setError((err as Error).message || "Failed to save your progress");
    } finally {
      setIsSaving(false);
    }
  };

  const hydrateFromResponse = (response: ProfileResponse) => {
    const incoming = normalizeProfile(response.profile);
    setProfile(incoming);
    setPhotoPreview(incoming.profilePhoto.url || DEFAULT_AVATAR);

    if (response.onboarding?.completed) {
      navigate("/home", { replace: true });
      return;
    }

    const serverStep = response.onboarding?.step ?? 1;
    setStep(Math.max(1, Math.min(serverStep, STEP_META.length)));
  };

  return (
    <div className="onboarding-bg">
      <div className="container py-5">
        <div className="mx-auto onboarding-shell">
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold">Welcome, {user.firstName}!</h1>
            <p className="text-muted mb-0">Let&apos;s personalize your PlusOne experience.</p>
          </div>

          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-center py-5">Loading your onboarding…</div>
          ) : (
            <div className="card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">
                <StepHeader
                  currentStep={step}
                  meta={currentMeta}
                  totalSteps={STEP_META.length}
                />

                <div className="mt-4">
                  {step === 1 ? (
                    <DemographicsStep profile={profile} setProfile={setProfile} />
                  ) : null}
                  {step === 2 ? (
                    <CareerStep profile={profile} setProfile={setProfile} />
                  ) : null}
                  {step === 3 ? (
                    <InterestsStep
                      profile={profile}
                      toggleInterest={toggleInterest}
                      customInterest={customInterest}
                      setCustomInterest={setCustomInterest}
                      addCustomInterest={addCustomInterest}
                    />
                  ) : null}
                  {step === 4 ? (
                    <PhotoStep
                      photoPreview={photoPreview}
                      profile={profile}
                      handleUpload={handlePhotoUpload}
                      resetToDefault={() =>
                        setProfile((prev) => ({
                          ...prev,
                          profilePhoto: {
                            storage: "stock",
                            key: "default",
                            url: DEFAULT_AVATAR,
                          },
                        }))
                      }
                    />
                  ) : null}
                </div>

                <StepFooter
                  step={step}
                  totalSteps={STEP_META.length}
                  onBack={handleBack}
                  onNext={handleNext}
                  onFinish={handleFinish}
                  canGoBack={canGoBack}
                  isSaving={isSaving}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StepHeaderProps = {
  currentStep: number;
  totalSteps: number;
  meta: (typeof STEP_META)[number];
};

function StepHeader({ currentStep, totalSteps, meta }: StepHeaderProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <span className="badge rounded-pill onboarding-badge">
            Step {currentStep} of {totalSteps}
          </span>
          <h2 className="h4 mt-2 mb-1">{meta.title}</h2>
          <p className="text-muted mb-0">{meta.subtitle}</p>
        </div>
        <div className="onboarding-progress-value">{percentage}%</div>
      </div>

      <div className="progress mt-4 onboarding-progress">
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${percentage}%` }}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </>
  );
}

type DemographicsProps = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

function DemographicsStep({ profile, setProfile }: DemographicsProps) {
  const onGenderChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      gender: value ? (value as Gender) : null,
    }));
  };

  const onAgeChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      age: value ? Number(value) : null,
    }));
  };

  const onCityChange = (value: string) => {
    setProfile((prev) => {
      const match = CITY_OPTIONS.find(
        (opt) => opt.city.toLowerCase() === value.toLowerCase()
      );
      return {
        ...prev,
        location: {
          ...prev.location,
          city: value,
          state: match?.state || prev.location.state,
          country: match?.country || prev.location.country,
        },
      };
    });
  };

  const onStateChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        state: value,
      },
    }));
  };

  const onCountryChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        country: value,
      },
    }));
  };

  return (
    <div className="row g-4">
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Gender</label>
        <select
          className="form-select"
          value={profile.gender ?? ""}
          onChange={(e) => onGenderChange(e.target.value)}
        >
          <option value="">Select gender</option>
          {GENDER_VALUES.map((value) => (
            <option key={value} value={value}>
              {formatGenderLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Age</label>
        <select
          className="form-select"
          value={profile.age ?? ""}
          onChange={(e) => onAgeChange(e.target.value)}
        >
          <option value="">Select age</option>
          {ages.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">City</label>
        <input
          className="form-control"
          list="city-options"
          placeholder="Start typing your city…"
          value={profile.location.city}
          onChange={(e) => onCityChange(e.target.value)}
        />
        <datalist id="city-options">
          {CITY_OPTIONS.map(({ city, state }) => (
            <option key={city} value={city}>
              {city}, {state}
            </option>
          ))}
        </datalist>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">State/Province</label>
        <input
          className="form-control"
          list="state-options"
          placeholder="TN, NY, etc."
          value={profile.location.state}
          onChange={(e) => onStateChange(e.target.value.toUpperCase())}
        />
        <datalist id="state-options">
          {US_STATES.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Country</label>
        <select
          className="form-select"
          value={profile.location.country}
          onChange={(e) => onCountryChange(e.target.value)}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="MX">Mexico</option>
          <option value="GB">United Kingdom</option>
          <option value="IN">India</option>
          <option value="SG">Singapore</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  );
}

type CareerProps = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

function CareerStep({ profile, setProfile }: CareerProps) {
  const onTitleChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        title: value,
      },
    }));
  };

  const onCompanyChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        companiesName: value,
      },
    }));
  };

  const onCompanyIdChange = (value: string) => {
    setProfile((prev) => ({
      ...prev,
      job: {
        ...prev.job,
        companyId: value,
      },
    }));
  };

  return (
    <div className="vstack gap-4">
      <div>
        <label className="form-label fw-semibold">Role / Title</label>
        <input
          className="form-control"
          placeholder="e.g. Software Engineer"
          value={profile.job.title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div>
        <label className="form-label fw-semibold">Company</label>
        <input
          className="form-control"
          list="company-options"
          placeholder="Search or type your company"
          value={profile.job.companiesName}
          onChange={(e) => onCompanyChange(e.target.value)}
        />
        <datalist id="company-options">
          {[
            "Amazon",
            "Apple",
            "Google",
            "Meta",
            "Microsoft",
            "NVIDIA",
            "Vanderbilt University",
            "Deloitte",
            "Accenture",
            "Stripe",
            "Square",
            "Tesla",
          ].map((company) => (
            <option key={company} value={company} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="form-label fw-semibold">Company ID (optional)</label>
        <input
          className="form-control"
          placeholder="Internal identifier if available"
          value={profile.job.companyId ?? ""}
          onChange={(e) => onCompanyIdChange(e.target.value)}
        />
      </div>
    </div>
  );
}

type InterestsProps = {
  profile: Profile;
  toggleInterest: (interest: string) => void;
  customInterest: string;
  setCustomInterest: (value: string) => void;
  addCustomInterest: () => void;
};

function InterestsStep({
  profile,
  toggleInterest,
  customInterest,
  setCustomInterest,
  addCustomInterest,
}: InterestsProps) {
  return (
    <div className="vstack gap-4">
      <div>
        <p className="text-muted mb-2">
          Select a few activities so others can find their PlusOne match.
        </p>
        <div className="onboarding-chips">
          {INTEREST_OPTIONS.map((interest) => {
            const active = profile.interests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                className={`interest-chip ${active ? "active" : ""}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="form-label fw-semibold">Add your own</label>
        <div className="input-group">
          <input
            className="form-control"
            placeholder="e.g. Intramural ultimate frisbee"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={addCustomInterest}
          >
            Add
          </button>
        </div>
      </div>

      {profile.interests.length ? (
        <div className="small text-muted">
          Selected: {profile.interests.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

type PhotoProps = {
  photoPreview: string;
  profile: Profile;
  handleUpload: (file: File | null) => void;
  resetToDefault: () => void;
};

function PhotoStep({ photoPreview, profile, handleUpload, resetToDefault }: PhotoProps) {
  return (
    <div className="vstack gap-4">
      <div className="text-center">
        <div className="photo-frame mx-auto mb-3">
          <img
            src={photoPreview}
            alt="Profile preview"
            className="photo-frame-img"
          />
        </div>
        <p className="text-muted mb-0">
          Choose a clear photo where you feel confident. You can swap it later.
        </p>
      </div>

      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
        <div className="flex-grow-1">
          <label className="form-label fw-semibold mb-1">Upload a new photo</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => handleUpload(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="button"
          className="btn btn-outline-dark"
          onClick={resetToDefault}
        >
          Use stock image
        </button>
      </div>

      <div className="small text-muted">
        Current storage: <strong>{profile.profilePhoto?.storage || "stock"}</strong>
      </div>
    </div>
  );
}

type StepFooterProps = {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  canGoBack: boolean;
  isSaving: boolean;
};

function StepFooter({
  step,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  canGoBack,
  isSaving,
}: StepFooterProps) {
  const isLastStep = step === totalSteps;

  return (
    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
      <div>
        {canGoBack ? (
          <button
            type="button"
            className="btn btn-link text-decoration-none"
            onClick={onBack}
            disabled={isSaving}
          >
            ← Back
          </button>
        ) : (
          <span className="text-muted small">You can always edit later.</span>
        )}
      </div>

      <div className="d-flex gap-2">
        {!isLastStep ? (
          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={onNext}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save & Continue"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={onFinish}
            disabled={isSaving}
          >
            {isSaving ? "Finishing…" : "Finish onboarding"}
          </button>
        )}
      </div>
    </div>
  );
}

function normalizeProfile(profile?: Profile | null): Profile {
  if (!profile) return defaultProfile;
  return {
    gender: profile.gender ?? null,
    age: profile.age ?? null,
    location: {
      city: profile.location?.city ?? "",
      state: profile.location?.state ?? "",
      country: profile.location?.country ?? "US",
      latitude: profile.location?.latitude ?? null,
      longitude: profile.location?.longitude ?? null,
    },
    job: {
      title: profile.job?.title ?? "",
      companiesName: profile.job?.companiesName ?? "",
      companyId: profile.job?.companyId ?? "",
    },
    interests: profile.interests ?? [],
    profilePhoto: {
      storage: profile.profilePhoto?.storage ?? "stock",
      key: profile.profilePhoto?.key ?? "default",
      url: profile.profilePhoto?.url ?? DEFAULT_AVATAR,
    },
    numConnections: profile.numConnections ?? 0,
    numRequests: profile.numRequests ?? 0,
  };
}

function normalizeProfileForRequest(profile: Profile): Profile {
  return {
    ...profile,
    location: {
      ...profile.location,
      city: profile.location.city.trim(),
      state: profile.location.state.trim(),
      country: profile.location.country || "US",
    },
    job: {
      ...profile.job,
      title: profile.job.title.trim(),
      companiesName: profile.job.companiesName.trim(),
      companyId: profile.job.companyId?.toString().trim() ?? "",
    },
    interests: profile.interests,
    profilePhoto: {
      ...profile.profilePhoto,
      url: profile.profilePhoto?.url || DEFAULT_AVATAR,
    },
    numConnections: profile.numConnections ?? 0,
    numRequests: profile.numRequests ?? 0,
  };
}

function formatGenderLabel(gender: Gender) {
  switch (gender) {
    case "MALE":
      return "Male";
    case "FEMALE":
      return "Female";
    case "NON_BINARY":
      return "Non-binary";
    case "OTHER":
      return "Other";
    case "PREFER_NOT_TO_SAY":
      return "Prefer not to say";
    default:
      return gender;
  }
}
