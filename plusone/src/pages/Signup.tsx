import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService, isVanderbiltEmail } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
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

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) {
      return "First name is required";
    }
    if (!formData.lastName.trim()) {
      return "Last name is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!isVanderbiltEmail(formData.email)) {
      return "Please use your Vanderbilt email (@vanderbilt.edu)";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const response = await authService.signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (response.message === "Signup successful") {
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

        // Redirect into onboarding flow
        navigate("/onboarding", { replace: true });
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
          <h1 className="h3 fw-bold mb-3 text-center">Create your account</h1>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <form className="vstack gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control"
              placeholder="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              className="form-control"
              placeholder="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              className="form-control"
              placeholder="Email (@vanderbilt.edu)"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              className="form-control"
              placeholder="Password (min 6 characters)"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign up"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-3">
            <small className="text-muted">
              Already have an account?{" "}
              <Link to="/login" className="text-primary">
                Log in
              </Link>
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
