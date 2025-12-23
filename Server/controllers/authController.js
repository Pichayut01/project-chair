const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const ActiveSession = require('../models/ActiveSession');
const admin = require('../config/firebase');
const transporter = require('../config/email');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

exports.googleLoginVerify = async (req, res) => {
    console.log('Google login verification request received');
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ msg: 'ID token is required' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, picture, name } = decodedToken;
        console.log('Google token verified for user:', email);

        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = new User({
                email,
                displayName: name || email.split('@')[0],
                photoURL: picture || '',
                uid
            });
            await user.save();
        } else {
            let needsUpdate = false;
            if (!user.uid) {
                user.uid = uid;
                needsUpdate = true;
            }
            if (picture && (!user.photoURL || user.photoURL === '' || user.photoURL.startsWith('https://'))) {
                user.photoURL = picture;
                needsUpdate = true;
            }
            if (name && user.displayName !== name) {
                user.displayName = name;
                needsUpdate = true;
            }
            if (needsUpdate) {
                await user.save();
            }
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: payload.user,
                    isNewUser
                });
            }
        );
    } catch (error) {
        console.error("Error verifying Google token:", error);
        if (error.code === 'auth/id-token-expired') {
            res.status(401).json({ msg: 'Google token has expired. Please sign in again.' });
        } else if (error.code === 'auth/invalid-id-token') {
            res.status(401).json({ msg: 'Invalid Google token.' });
        } else {
            res.status(500).json({ msg: 'Server error during Google authentication', error: error.message });
        }
    }
};

exports.register = async (req, res) => {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters long.' });
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthScore = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

    if (strengthScore < 3) {
        return res.status(400).json({
            msg: 'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character.'
        });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email: normalizedEmail,
            password: hashedPassword,
            displayName: displayName || normalizedEmail.split('@')[0],
            photoURL: null,
            uid: new mongoose.Types.ObjectId().toString()
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    msg: 'User registered successfully!',
                    token,
                    user: payload.user
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.email) {
                return res.status(400).json({ msg: 'User already exists with this email.' });
            }
            return res.status(400).json({ msg: 'User already exists.' });
        }
        res.status(500).json({ msg: 'Server error during registration', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password, otpCode } = req.body;

    try {
        let user = await User.findOne({ email }).select('+password +twoFactorEnabled +loginOtpCode +loginOtpExpires');
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials.' });
        }

        if (user.twoFactorEnabled) {
            if (!otpCode) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

                await User.findByIdAndUpdate(user._id, {
                    loginOtpCode: otp,
                    loginOtpExpires: otpExpires
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Chair App - Login Verification Code',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4CAF50;">Login Verification Required</h2>
                            <p>Hello ${user.displayName || 'User'},</p>
                            <p>Verification Code:</p>
                            <h1 style="color: #4CAF50;">${otp}</h1>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);

                return res.json({
                    requiresOtp: true,
                    message: 'OTP sent to your email. Please verify to complete login.',
                    tempUserId: user._id
                });
            }

            if (otpCode) {
                if (!user.loginOtpCode || !user.loginOtpExpires) {
                    return res.status(400).json({ msg: 'No OTP found. Please request a new one.' });
                }
                if (new Date() > user.loginOtpExpires) {
                    return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
                }
                if (otpCode !== user.loginOtpCode) {
                    return res.status(400).json({ msg: 'Invalid OTP code.' });
                }

                await User.findByIdAndUpdate(user._id, {
                    $unset: { loginOtpCode: 1, loginOtpExpires: 1 }
                });
            }
        }

        await LoginHistory.create({
            userId: user._id,
            action: 'login',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        const payload = {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid,
                twoFactorEnabled: user.twoFactorEnabled
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required.' });

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ msg: 'If an account with that email exists, we have sent a password reset link.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request - Chair App',
            html: `
                <p>Hello ${user.displayName || 'User'},</p>
                <p>Click here to reset your password: <a href="${resetURL}">Reset Password</a></p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: 'If an account with that email exists, we have sent a password reset link.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.getResetTokenInfo = async (req, res) => {
    try {
        const { token } = req.params;
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ msg: 'Token is invalid or has expired.' });
        }

        res.json({ email: user.email, username: user.displayName });
    } catch (error) {
        console.error('Error fetching user info from token:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ msg: 'Password is required.' });
    if (password.length < 8) return res.status(400).json({ msg: 'Password must be at least 8 characters long.' });

    try {
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password +resetPasswordToken +resetPasswordExpires');

        if (!user) return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ msg: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // Corrected to use req.user.id directly, assuming authMiddleware populates req.user object

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
        }

        // Must re-fetch user including password
        const user = await User.findById(userId).select('+password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await LoginHistory.create({
            userId: userId,
            action: 'password_changed',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        res.json({ msg: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.toggle2FA = async (req, res) => {
    try {
        const { enable } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (enable) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            user.twoFactorEnabled = true;
            user.twoFactorCode = code;
            user.twoFactorExpires = expiresAt;
            await user.save();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Two-Factor Authentication Setup',
                html: `<h1>${code}</h1>`
            };
            await transporter.sendMail(mailOptions);
            res.json({ msg: '2FA enabled. Check email for code.' });
        } else {
            user.twoFactorEnabled = false;
            user.twoFactorCode = null;
            user.twoFactorExpires = null;
            await user.save();
            res.json({ msg: '2FA disabled.' });
        }
    } catch (error) {
        console.error('2FA toggle error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId); // Need to fetch fields if not selected by default in auth middleware? User model usually selects fields.
        // But need 2fa code which might be select: false
        const userWithCode = await User.findById(userId).select('+twoFactorCode +twoFactorExpires');

        if (!userWithCode) return res.status(404).json({ msg: 'User not found' });

        if (!userWithCode.twoFactorCode || userWithCode.twoFactorExpires < new Date()) {
            return res.status(400).json({ msg: 'Code expired' });
        }
        if (userWithCode.twoFactorCode !== code) {
            return res.status(400).json({ msg: 'Invalid code' });
        }

        userWithCode.twoFactorCode = null; // Clear code
        userWithCode.twoFactorExpires = null;
        await userWithCode.save();

        res.json({ msg: '2FA verified successfully' });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getLoginHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const history = await LoginHistory.find({ userId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await LoginHistory.countDocuments({ userId });

        res.json({
            history,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                hasNext: skip + limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Login history error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getActiveSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await ActiveSession.find({ userId }).sort({ lastActivity: -1 });
        res.json({ sessions });
    } catch (error) {
        console.error('Active sessions error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        await ActiveSession.findOneAndDelete({ _id: sessionId, userId });
        res.json({ msg: 'Session terminated' });
    } catch (error) {
        console.error('Terminate session error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // req.user is set by authMiddleware
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid,
            createdClasses: user.createdClasses,
            enrolledClasses: user.enrolledClasses,
            pinnedClasses: user.pinnedClasses
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        delete updateData.email;
        delete updateData.password;
        delete updateData._id;
        delete updateData.uid;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ msg: 'Profile updated', user: updatedUser });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updatePhoto = async (req, res) => {
    // Note: 'upload' middleware should be used in the route definition, placing the file in req.file
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded.' });

    try {
        const user = req.user;
        if (user.photoURL) {
            const oldPhotoPath = path.join(__dirname, '../', user.photoURL);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        const newPhotoURL = `/uploads/profile_photos/${req.file.filename}`;
        user.photoURL = newPhotoURL;
        await user.save();

        res.json({
            msg: 'Profile photo updated',
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: newPhotoURL,
                uid: user.uid
            }
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
};

exports.deletePhoto = async (req, res) => {
    try {
        const user = req.user;
        if (user.photoURL) {
            const photoPath = path.join(__dirname, '../', user.photoURL);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
            user.photoURL = null;
            await user.save();
        }
        res.json({
            msg: 'Profile photo deleted',
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: null,
                uid: user.uid
            }
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
};
