// src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../CSS/ResetPassword.css";

const backendUrl = "http://localhost:5000/api/auth";
const MySwal = withReactContent(Swal);

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword && confirmPassword !== "");
  }, [password, confirmPassword]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${backendUrl}/reset-token-info/${token}`);
        setUserInfo(response.data);
      } catch (error) {
        console.error("Invalid token error:", error);
        MySwal.fire({
          icon: "error",
          title: "Invalid or Expired Link",
          text: error.response?.data?.msg || "This password reset link is either invalid or has expired.",
          confirmButtonColor: "#4CAF50"
        }).then(() => {
          navigate("/login");
        });
      }
    };

    if (token) {
      fetchUserInfo();
    }
  }, [token, navigate]);

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
    return { requirements, score, isValid: score >= 3 };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      MySwal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please fill in all fields.",
        confirmButtonColor: "#4CAF50"
      });
      return;
    }

    if (!passwordValidation.isValid) {
      MySwal.fire({
        icon: "error",
        title: "Weak Password",
        text: "Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character.",
        confirmButtonColor: "#4CAF50"
      });
      return;
    }

    if (!passwordsMatch) {
      MySwal.fire({
        icon: "error",
        title: "Passwords Don't Match",
        text: "Please make sure both passwords are identical.",
        confirmButtonColor: "#4CAF50"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/reset-password/${token}`, {
        password
      });

      MySwal.fire({
        icon: "success",
        title: "Password Reset Successful!",
        text: response.data.msg,
        confirmButtonColor: "#4CAF50",
        timer: 3000,
        timerProgressBar: true
      }).then(() => {
        navigate("/login");
      });

    } catch (error) {
      console.error("Reset password error:", error);
      
      let errorMessage = "An error occurred while resetting your password.";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      }

      MySwal.fire({
        icon: "error",
        title: "Reset Failed",
        text: errorMessage,
        confirmButtonColor: "#4CAF50"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (score) => {
    if (score < 2) return "#ff4444";
    if (score < 3) return "#ff8800";
    if (score < 4) return "#ffaa00";
    return "#4CAF50";
  };

  const getPasswordStrengthText = (score) => {
    if (score < 2) return "Weak";
    if (score < 3) return "Fair";
    if (score < 4) return "Good";
    return "Strong";
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <FaLock className="lock-icon" />
          <h2>Reset Password</h2>
          {userInfo ? (
            <p className="reset-password-user-info">
              Resetting password for: <strong>{userInfo.username || userInfo.email}</strong>
            </p>
          ) : (
            <p>Loading user information...</p>
          )}
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {/* New Password Field */}
          <div className="reset-form-group">
            <label htmlFor="password">New Password</label>
            <div className="reset-password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="reset-password-strength">
                <div className="reset-strength-bar">
                  <div 
                    className="reset-strength-fill" 
                    style={{ 
                      width: `${(passwordValidation.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordValidation.score)
                    }}
                  ></div>
                </div>
                <span 
                  className="reset-strength-text"
                  style={{ color: getPasswordStrengthColor(passwordValidation.score) }}
                >
                  {getPasswordStrengthText(passwordValidation.score)}
                </span>
              </div>
            )}

            {/* Password Requirements */}
            {password && (
              <div className="reset-password-requirements">
                <div className={`reset-requirement ${passwordValidation.requirements.length ? 'met' : ''}`}>
                  {passwordValidation.requirements.length ? <FaCheckCircle /> : <FaTimesCircle />}
                  At least 8 characters
                </div>
                <div className={`reset-requirement ${passwordValidation.requirements.uppercase ? 'met' : ''}`}>
                  {passwordValidation.requirements.uppercase ? <FaCheckCircle /> : <FaTimesCircle />}
                  Uppercase letter
                </div>
                <div className={`reset-requirement ${passwordValidation.requirements.lowercase ? 'met' : ''}`}>
                  {passwordValidation.requirements.lowercase ? <FaCheckCircle /> : <FaTimesCircle />}
                  Lowercase letter
                </div>
                <div className={`reset-requirement ${passwordValidation.requirements.number ? 'met' : ''}`}>
                  {passwordValidation.requirements.number ? <FaCheckCircle /> : <FaTimesCircle />}
                  Number
                </div>
                <div className={`reset-requirement ${passwordValidation.requirements.special ? 'met' : ''}`}>
                  {passwordValidation.requirements.special ? <FaCheckCircle /> : <FaTimesCircle />}
                  Special character
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="reset-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="reset-password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`reset-password-match ${passwordsMatch ? 'match' : 'no-match'}`}>
                {passwordsMatch ? <FaCheckCircle /> : <FaTimesCircle />}
                {passwordsMatch ? "Passwords match" : "Passwords don't match"}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`reset-password-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="reset-password-footer">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
