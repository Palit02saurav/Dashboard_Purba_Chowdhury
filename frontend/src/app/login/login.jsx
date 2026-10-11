"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth";
import "./login.css";

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const router = useRouter();

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");
    setLoading(true);
    const result = await login(signInForm.email, signInForm.password);
    setLoading(false);
    if (!result.success) {
      setSignInError(result.error);
      return;
    }
    router.replace("/");
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");
    setLoading(true);
    const result = await signup(signUpForm);
    setLoading(false);
    if (!result.success) {
      setSignUpError(result.error);
      return;
    }
    setSignUpForm({ firstName: "", lastName: "", email: "", phone: "" });
    setSignUpSuccess(result.message || "Request submitted!");
  };

  return (
    <div className="auth-body-wrapper">
      <div className={`container ${mode === "signup" ? "active" : ""}`} id="container">
        <div className="form-container sign-up">
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <span>Enter your details to get started</span>
            {signUpSuccess ? (
              <p className="auth-success-text">{signUpSuccess}</p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={signUpForm.firstName}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={signUpForm.lastName}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (10 digits)"
                  value={signUpForm.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setSignUpForm((f) => ({ ...f, phone: digitsOnly }));
                  }}
                  pattern="\d{10}"
                  maxLength={10}
                  title="Enter a 10 digit mobile number"
                  required
                />
                {signUpError && <p className="auth-error-text">{signUpError}</p>}
                <button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Sign Up"}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleSignIn}>
            <h1>Sign In</h1>
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={signInForm.email}
              onChange={(e) => setSignInForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signInForm.password}
              onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            {signInError && <p className="auth-error-text">{signInError}</p>}
            <a href="#">Forget Your Password?</a>
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button className="ghost" id="login" onClick={() => setMode("signin")}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button className="ghost" id="register" onClick={() => setMode("signup")}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}