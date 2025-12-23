// src/pages/LoginPage.jsx

import React, { useState, useEffect } from "react";
import "../CSS/Login.css";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Loader from "../component/Loader"; 

const backendUrl = "http://localhost:5000/api/auth";
const MySwal = withReactContent(Swal);

// เพิ่ม onLoginSuccess เป็น prop ที่รับจาก App.jsx
const LoginPage = ({ onLoginSuccess, isSidebarOpen = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const navigate = useNavigate();

  const handleModeSwitch = (mode) => {
    setIsRegisterMode(mode);
    setAnimationKey(prev => prev + 1);
  }; 

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword && confirmPassword !== "");
  }, [password, confirmPassword]);

  // Password strength validation
  const validatePassword = (pwd) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    return { requirements, score, isValid: score >= 4 };
  };

  const passwordValidation = validatePassword(password);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await axios.post(`${backendUrl}/google-login-verify`, {
        idToken,
      });
      const { token, user, isNewUser } = response.data;

      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(user));
      
      // Ensure photoURL is properly stored for Google login
      if (user.photoURL) {
        localStorage.setItem("userPhotoURL", user.photoURL);
      }
      
      MySwal.fire({
        title: "Success!",
        text: isNewUser ? "Account created and logged in with Google successfully!" : "Login with Google successful.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        onLoginSuccess({ ...user, token });
      });

    } catch (error) {
      console.error("Login with Google error:", error);
      const errorMessage = error.response?.data?.msg || "Failed to login with Google. Please try again.";
      MySwal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!email || !password) {
      MySwal.fire({
        title: "Error!",
        text: "Please enter both email and password.",
        icon: "error",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      MySwal.fire({
        title: "Error!",
        text: "Please enter a valid email address.",
        icon: "error",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      // Check if 2FA is required
      if (response.data.requiresOtp) {
        // Navigate to OTP verification page
        navigate('/otp-verification', {
          state: {
            email: email.trim().toLowerCase(),
            password,
            tempUserId: response.data.tempUserId
          }
        });
        return;
      }

      const { token, user } = response.data;

      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(user));
      
      // Ensure photoURL is properly stored for manual login
      if (user.photoURL) {
        localStorage.setItem("userPhotoURL", user.photoURL);
      }

      MySwal.fire({
        title: "Success!",
        text: "Login successful.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        onLoginSuccess({ ...user, token });
      });
    } catch (error) {
      console.error("Manual login error:", error);
      const errorMessage = error.response?.data?.msg || "Invalid email or password.";
      MySwal.fire({
        title: "Login Failed",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleManualRegister = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address.',
      });
      return;
    }

    if (password.length < 6) {
      MySwal.fire({
        icon: 'error',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (!passwordsMatch) {
      MySwal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match.',
      });
      return;
    }

    if (!acceptTerms) {
      MySwal.fire({
        icon: 'error',
        title: 'Terms and Conditions',
        text: 'Please accept the Terms and Conditions to continue.',
      });
      return;
    }

    setIsRegisterLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/register`, {
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      });
      const { token, user } = response.data;
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(user));
      
      // Ensure photoURL is properly stored for registration
      if (user.photoURL) {
        localStorage.setItem("userPhotoURL", user.photoURL);
      }

      MySwal.fire({
        title: "Success!",
        text: "Registration successful. You are now logged in.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        onLoginSuccess({ ...user, token });
      });
    } catch (error) {
      console.error("Manual registration error:", error);
      const errorMessage = error.response?.data?.msg || "Registration failed. Please try again.";
      MySwal.fire({
        title: "Registration Failed",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      MySwal.fire({
        icon: "error",
        title: "Missing Email",
        text: "Please enter your email address.",
        confirmButtonColor: "#4CAF50"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      MySwal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#4CAF50"
      });
      return;
    }

    setIsForgotPasswordLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/forgot-password`, {
        email: forgotPasswordEmail
      });

      MySwal.fire({
        icon: "success",
        title: "Email Sent!",
        text: response.data.msg,
        confirmButtonColor: "#4CAF50",
        timer: 5000,
        timerProgressBar: true
      });

      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");

    } catch (error) {
      console.error("Forgot password error:", error);
      
      let errorMessage = "An error occurred while sending the reset email.";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      }

      MySwal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#4CAF50"
      });
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  return (
    <main className={`login-main ${isSidebarOpen ? 'shift' : ''}`}>
      <div className="login-container">
        <div className="form-wrapper">
          <div className="form-header">
            <button
              onClick={() => handleModeSwitch(false)}
              className={!isRegisterMode ? "active" : ""}
            >
              Login
            </button>
            <button
              onClick={() => handleModeSwitch(true)}
              className={isRegisterMode ? "active" : ""}
            >
              Register
            </button>
          </div>

          {isRegisterMode ? (
            <form key={`register-${animationKey}`} onSubmit={handleManualRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="registerDisplayName">Display Name</label>
                <input
                  type="text"
                  id="registerDisplayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerEmail">Email</label>
                <input
                  type="email"
                  id="registerEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="registerPassword">
                  Password 
                  <span className="password-hint">(min 8 chars, mixed case, numbers, symbols)</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="registerPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Simplified Password Strength Indicator */}
                {password && (
                  <div className="password-strength-simple">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${passwordValidation.score}`}
                        style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="strength-info">
                      <span className="strength-text">
                        {passwordValidation.score <= 2 ? 'Weak' :
                         passwordValidation.score <= 3 ? 'Fair' :
                         passwordValidation.score <= 4 ? 'Good' : 'Strong'}
                      </span>
                      <span className="strength-score">{passwordValidation.score}/5</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Simplified Password Match Indicator */}
                {confirmPassword && (
                  <div className={`match-status-simple ${passwordsMatch ? 'match' : 'no-match'}`}>
                    {passwordsMatch ? '✓' : '✗'}
                  </div>
                )}
              </div>
              
              {/* Terms and Conditions Checkbox */}
              <div className="terms-checkbox-container">
                <label className="terms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="terms-checkbox"
                  />
                  <span className="checkmark"></span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="terms-link"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
              
              <button type="submit" className="submit-button" disabled={!acceptTerms || isRegisterLoading}>
                {isRegisterLoading ? "Registering..." : "Register"}
              </button>
            </form>
          ) : (
            <form key={`login-${animationKey}`} onSubmit={handleManualLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="loginPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              {/* Forgot Password Link */}
              <div className="forgot-password-link">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="forgot-password-btn"
                >
                  Forgot Password?
                </button>
              </div>
              
              <button type="submit" className="submit-button" disabled={isLoginLoading}>
                {isLoginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}
        </div>

        

        <div className="google-login">
          <button onClick={handleGoogleSignIn} className="google-login-button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google logo"
            />
            Continue with Google
          </button>
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terms and Conditions</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <h4>1. Acceptance of Terms</h4>
              <p>By using this service, you agree to be bound by these Terms and Conditions.</p>
              
              <h4>2. User Accounts</h4>
              <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
              
              <h4>3. Privacy Policy</h4>
              <p>We respect your privacy and handle your data according to our Privacy Policy.</p>
              
              <h4>4. Prohibited Uses</h4>
              <p>You may not use this service for any unlawful or prohibited activities.</p>
              
              <h4>5. Limitation of Liability</h4>
              <p>We are not liable for any damages arising from your use of this service.</p>
              
              <h4>6. Changes to Terms</h4>
              <p>We reserve the right to modify these terms at any time.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-accept-btn"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Accept Terms
              </button>
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowTermsModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button 
                className="modal-close"
                onClick={() => setShowForgotPasswordModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleForgotPassword}>
              <div className="modal-body">
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <div className="form-group">
                  <label htmlFor="forgotEmail">Email Address</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={isForgotPasswordLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="submit"
                  className="modal-accept-btn"
                  disabled={isForgotPasswordLoading}
                >
                  {isForgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                </button>
                <button 
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowForgotPasswordModal(false)}
                  disabled={isForgotPasswordLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default LoginPage;