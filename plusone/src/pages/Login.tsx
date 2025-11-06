import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { profileService } from "../services/profileService";

export default function Login() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    setError("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.message === "Login successful") {
        // Store user info in localStorage (simple approach for now)
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: response.userId,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
          })
        );

        // Redirect based on onboarding progress
        try {
          if (response.userId) {
            const profile = await profileService.getProfile(response.userId);
            if (profile.onboarding?.completed) {
              navigate("/home");
            } else {
              navigate("/onboarding");
            }
          } else {
            navigate("/home");
          }
        } catch {
          navigate("/home");
        }
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-vh-100 d-flex align-items-center bg-white">
      <div className="container">
        <div className="mx-auto" style={{ maxWidth: 420 }}>
          <h1 className="h3 fw-bold mb-3 text-center">Log in</h1>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <form className="vstack gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center mt-3">
            <small className="text-muted">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary">
                Sign up
              </Link>
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
