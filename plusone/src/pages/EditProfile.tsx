import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/profileService";
import type { Profile } from "../types/profile";
import "../styles/Onboarding.css";

import {
  DemographicsStep,
  CareerStep,
  InterestsStep,
  PhotoStep,
  normalizeProfile,
  normalizeProfileForRequest,
  DEFAULT_AVATAR,
} from "./Onboarding";

type StoredUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export default function EditProfile() {
  const navigate = useNavigate();

  const user = useMemo<StoredUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [profile, setProfile] = useState<Profile>(normalizeProfile(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [customInterest, setCustomInterest] = useState("");
  const [photoPreview, setPhotoPreview] = useState(DEFAULT_AVATAR);

  // Redirect to login if no user
  useEffect(() => {
    if (!user?.userId) {
      navigate("/login", { replace: true });
    }
  }, [user?.userId, navigate]);

  // Load existing profile
  useEffect(() => {
    if (!user?.userId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await profileService.getProfile(user.userId);
        const incoming = normalizeProfile(response.profile);
        setProfile(incoming);
        setPhotoPreview(incoming.profilePhoto.url || DEFAULT_AVATAR);
      } catch (err) {
        setError((err as Error).message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  // Keep preview in sync with profile changes
  useEffect(() => {
    if (profile?.profilePhoto?.url) {
      setPhotoPreview(profile.profilePhoto.url);
    } else {
      setPhotoPreview(DEFAULT_AVATAR);
    }
  }, [profile?.profilePhoto?.url]);

  const toggleInterest = (interest: string) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return prev;
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
    if (!profile) return;
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    toggleInterest(trimmed);
    setCustomInterest("");
  };

  const handlePhotoUpload = (file: File | null) => {
    if (!file || !profile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              profilePhoto: {
                storage: "inline-base64",
                key: `upload-${Date.now()}`,
                url: dataUrl,
              },
            }
          : prev
      );
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            profilePhoto: {
              storage: "stock",
              key: "default",
              url: DEFAULT_AVATAR,
            },
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!user?.userId || !profile) return;
    setIsSaving(true);
    setError(null);
    try {
      const normalized = normalizeProfileForRequest(profile);
      await profileService.updateProfile(user.userId, {
        profile: normalized,
        step: 4,
        completed: true,
      });
      navigate("/myPage", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user?.userId) {
    return null;
  }

  if (loading || !profile) {
    return (
      <div className="container py-5 text-center">
        <div>Loading your profile…</div>
      </div>
    );
  }

  return (
    <div className="onboarding-bg">
      <div className="container py-5">
        <div className="mx-auto onboarding-shell">
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold">Edit Your Profile</h1>
            <p className="text-muted mb-0">
              Update the details you shared during onboarding.
            </p>
          </div>

          {error ? (
            <div className="alert alert-danger mb-3">{error}</div>
          ) : null}

          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              {/* Reuse the same step components, but all on one page */}
              <section className="mb-4">
                <h2 className="h5 mb-3">Demographics</h2>
                <DemographicsStep profile={profile} setProfile={setProfile} />
              </section>

              <hr className="my-4" />

              <section className="mb-4">
                <h2 className="h5 mb-3">Career</h2>
                <CareerStep profile={profile} setProfile={setProfile} />
              </section>

              <hr className="my-4" />

              <section className="mb-4">
                <h2 className="h5 mb-3">Interests</h2>
                <InterestsStep
                  profile={profile}
                  setProfile={setProfile}
                  toggleInterest={toggleInterest}
                  customInterest={customInterest}
                  setCustomInterest={setCustomInterest}
                  addCustomInterest={addCustomInterest}
                />
              </section>

              <hr className="my-4" />

              <section className="mb-4">
                <h2 className="h5 mb-3">Profile Photo</h2>
                <PhotoStep
                  photoPreview={photoPreview}
                  profile={profile}
                  handleUpload={handlePhotoUpload}
                  resetToDefault={handleResetPhoto}
                />
              </section>

              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={() => navigate("/myPage")}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}