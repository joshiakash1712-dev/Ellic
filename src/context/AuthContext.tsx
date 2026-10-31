import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  getMultiFactorResolver,
  MultiFactorResolver
} from 'firebase/auth';
import QRCode from 'qrcode';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { normalizeCanonicalRole, isUserStatusInactive } from '../types';

export type ProfileRole =
  | 'super_admin'
  | 'ellix_admin'
  | 'client'
  | 'customer'
  | 'crew'
  | 'wholesaler_admin'
  | 'unauthorized'
  // Legacy compatibility
  | 'retailer'
  | 'owner'
  | 'wholesaler'
  | 'admin'
  | 'platform_admin'
  | 'employee'
  | 'cashier'
  | 'staff';

export interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role: ProfileRole;
  clientId?: string;
  assignedStoreIds?: string[];
  wholesalerId?: string;
  status?: 'active' | 'pending_approval' | 'suspended' | 'inactive' | 'revoked' | 'disabled';
  disabled?: boolean;
  active?: boolean;
  isActive?: boolean;
  linkedProviders: string[]; // e.g. ['google.com', 'password', 'phone']
  passwordSynchronized: boolean;
  totpEnrolled?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorType?: 'totp' | 'sms' | 'none';
  createdAt?: string;
  updatedAt?: string;
}

export type AuthModalMode = 'login' | 'register' | 'phone' | 'forgot_password' | 'mfa_totp';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  isSyncHubOpen: boolean;
  isTotpEnrolled: boolean;
  totpSecret: TotpSecret | null;
  mfaResolver: MultiFactorResolver | null;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setIsSyncHubOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
    role?: ProfileRole
  ) => Promise<void>;
  setUpPhoneRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    displayName?: string,
    role?: ProfileRole
  ) => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  linkEmailAndPassword: (email: string, password: string) => Promise<void>;
  linkPhoneOtp: (confirmationResult: ConfirmationResult, otpCode: string) => Promise<void>;
  synchronizeMasterPassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  startTotpEnrollment: () => Promise<{ secretKey: string; qrCodeUrl: string; qrCodeDataUrl: string; totpSecret: TotpSecret }>;
  confirmTotpEnrollment: (totpSecret: TotpSecret, verificationCode: string) => Promise<void>;
  unenrollTotp: () => Promise<void>;
  resolveTotpSignIn: (code: string) => Promise<void>;
  cancelMfaSignIn: () => void;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  loginWithDemoRole: (role: ProfileRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isSyncHubOpen, setIsSyncHubOpen] = useState<boolean>(false);
  const [isTotpEnrolled, setIsTotpEnrolled] = useState<boolean>(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  const checkTotpEnrollment = useCallback((user: FirebaseUser | null): boolean => {
    if (!user) return false;
    try {
      const mfaUser = multiFactor(user);
      return mfaUser.enrolledFactors.some(
        f => f.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );
    } catch {
      return false;
    }
  }, []);

  // Sync or create user profile document in Firestore
  const syncProfileDoc = useCallback(async (
    user: FirebaseUser,
    additionalData?: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    const linkedProviders = user.providerData.map(p => p.providerId);
    
    // Check if password provider exists or if synchronized
    const hasPassword = linkedProviders.includes('password');
    const isEmailVerified = user.emailVerified || linkedProviders.includes('google.com');
    const hasPhone = Boolean(user.phoneNumber) || linkedProviders.includes('phone');

    try {
      const snap = await getDoc(userDocRef);
      const nowIso = new Date().toISOString();

      const userEmail = user.email?.toLowerCase() || '';
      const isSuperAdminEmail = userEmail === 'ellixorrr@gmail.com';
      const isEllixAdminEmail = userEmail === 'ellic.admin11@gmail.com';

      if (snap.exists()) {
        const existingData = snap.data() as UserProfile;
        const mergedProviders = Array.from(new Set([...linkedProviders, ...(existingData.linkedProviders || [])]));

        if (isUserStatusInactive(existingData)) {
          const inactiveProfile: UserProfile = {
            ...existingData,
            uid: user.uid,
            role: 'unauthorized',
            linkedProviders: mergedProviders
          };
          setUserProfile(inactiveProfile);
          return inactiveProfile;
        }

        // Preserve authoritative role already saved in Firestore; resolve super_admin and ellix_admin emails
        const resolvedCanonical = isSuperAdminEmail
          ? 'super_admin'
          : isEllixAdminEmail
          ? 'ellix_admin'
          : normalizeCanonicalRole(existingData.role);

        // Only write safe profile metadata fields to Firestore (never mutate role, clientId, assignedStoreIds, or status)
        const safeFirestoreUpdates: Record<string, any> = {
          emailVerified: isEmailVerified,
          phoneNumber: user.phoneNumber || existingData.phoneNumber || '',
          phoneVerified: hasPhone,
          displayName: user.displayName || additionalData?.displayName || existingData.displayName || (user.email ? user.email.split('@')[0] : 'Customer'),
          photoURL: user.photoURL || existingData.photoURL || '',
          linkedProviders: mergedProviders,
          passwordSynchronized: additionalData?.passwordSynchronized ?? existingData.passwordSynchronized ?? hasPassword,
          totpEnrolled: additionalData?.totpEnrolled ?? existingData.totpEnrolled ?? checkTotpEnrollment(user),
          twoFactorEnabled: additionalData?.twoFactorEnabled ?? existingData.twoFactorEnabled ?? checkTotpEnrollment(user),
          twoFactorType: ((additionalData?.twoFactorEnabled ?? existingData.twoFactorEnabled ?? checkTotpEnrollment(user))) ? 'totp' : 'none',
          updatedAt: nowIso
        };

        try {
          await updateDoc(userDocRef, safeFirestoreUpdates);
        } catch (updateErr) {
          console.warn('[AuthContext] Safe profile metadata update skipped:', updateErr);
        }

        const updatedProfile: UserProfile = {
          ...existingData,
          ...safeFirestoreUpdates,
          uid: user.uid,
          email: existingData.email || user.email || '',
          role: resolvedCanonical,
          clientId: existingData.clientId || (isEllixAdminEmail || isSuperAdminEmail ? 'platform' : resolvedCanonical === 'client' ? 'client-001' : 'customer'),
          assignedStoreIds: existingData.assignedStoreIds || (resolvedCanonical === 'crew' ? ['store-1'] : []),
          status: existingData.status || 'active'
        };
        setUserProfile(updatedProfile);
        return updatedProfile;
      } else {
        const initialRole: ProfileRole = isSuperAdminEmail
          ? 'super_admin'
          : isEllixAdminEmail
          ? 'ellix_admin'
          : 'customer';
        const defaultClientId = (isSuperAdminEmail || isEllixAdminEmail) ? 'platform' : 'customer';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          emailVerified: isEmailVerified,
          phoneNumber: user.phoneNumber || '',
          phoneVerified: hasPhone,
          displayName: user.displayName || additionalData?.displayName || (isEllixAdminEmail ? 'Ellic Admin' : isSuperAdminEmail ? 'Ellic Super Admin' : (user.email ? user.email.split('@')[0] : 'Customer')),
          photoURL: user.photoURL || '',
          role: initialRole,
          clientId: defaultClientId,
          assignedStoreIds: [],
          status: 'active',
          linkedProviders: linkedProviders.length > 0 ? linkedProviders : ['anonymous'],
          passwordSynchronized: hasPassword,
          totpEnrolled: additionalData?.totpEnrolled ?? checkTotpEnrollment(user),
          twoFactorEnabled: additionalData?.twoFactorEnabled ?? checkTotpEnrollment(user),
          twoFactorType: checkTotpEnrollment(user) ? 'totp' : 'none',
          createdAt: nowIso,
          updatedAt: nowIso
        };

        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (error: any) {
      console.warn('[AuthContext] Firestore syncProfile notice:', error?.message || error);
      if (error?.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
      const userEmail = user.email?.toLowerCase() || '';
      const isVerifiedRoot = userEmail === 'ellixorrr@gmail.com';
      const isVerifiedEllix = userEmail === 'ellic.admin11@gmail.com';
      const requestedCanonical = normalizeCanonicalRole(additionalData?.role);
      const safeFallbackRole: ProfileRole = isVerifiedRoot
        ? 'super_admin'
        : isVerifiedEllix
        ? 'ellix_admin'
        : (requestedCanonical === 'crew' || requestedCanonical === 'wholesaler_admin' || requestedCanonical === 'client')
        ? requestedCanonical
        : 'customer';

      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber || '',
        phoneVerified: Boolean(user.phoneNumber),
        displayName: user.displayName || 'Merchant',
        photoURL: user.photoURL || '',
        role: safeFallbackRole,
        clientId: `client-${user.uid}`,
        assignedStoreIds: [],
        status: 'active',
        linkedProviders,
        passwordSynchronized: hasPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setUserProfile(null);
      return;
    }
    await syncProfileDoc(auth.currentUser);
  }, [syncProfileDoc]);

  // Listen to Firebase Auth state changes with real-time Firestore profile sync
  useEffect(() => {
    let unsubsDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (unsubsDoc) {
        unsubsDoc();
        unsubsDoc = null;
      }

      if (user) {
        setIsTotpEnrolled(checkTotpEnrollment(user));
        await syncProfileDoc(user);

        // Real-time synchronization when Admin updates user role or status in Firestore
        unsubsDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const userEmail = (user.email || data.email || '').toLowerCase();
            const isSuperAdminEmail = userEmail === 'ellixorrr@gmail.com';
            const isEllixAdminEmail = userEmail === 'ellic.admin11@gmail.com';
            const resolvedRole: ProfileRole = isSuperAdminEmail
              ? 'super_admin'
              : isEllixAdminEmail
              ? 'ellix_admin'
              : normalizeCanonicalRole(data.role);

            setUserProfile(prev => {
              if (!prev) return { ...data, role: resolvedRole };
              return {
                ...prev,
                ...data,
                role: resolvedRole
              };
            });
          }
        }, (err) => {
          console.warn('[AuthContext] Real-time profile listener notice:', err);
        });
      } else {
        setUserProfile(null);
        setIsTotpEnrolled(false);
        setTotpSecret(null);
        setMfaResolver(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubsDoc) unsubsDoc();
    };
  }, [syncProfileDoc, checkTotpEnrollment]);

  const openAuthModal = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. Google 1-Click Login (with TOTP 2FA intercept)
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncProfileDoc(result.user, {
        emailVerified: true
      });
      closeAuthModal();
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/multi-factor-auth-required') {
        try {
          const resolver = getMultiFactorResolver(auth, error);
          const totpHint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
          if (totpHint) {
            setMfaResolver(resolver);
            setAuthModalMode('mfa_totp');
            setIsAuthModalOpen(true);
            return;
          }
        } catch (mfaErr) {
          console.error('[Auth] Failed to initialize MFA resolver:', mfaErr);
        }
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info('[Auth] Google Sign-In popup closed or cancelled by user.');
      } else {
        console.error('[Auth] Google Sign-In Error:', error);
      }
      throw error;
    }
  };

  // 2. Email & Password Login (with TOTP 2FA intercept)
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncProfileDoc(result.user, {
        passwordSynchronized: true
      });
      closeAuthModal();
    } catch (error: any) {
      if (error?.code === 'auth/multi-factor-auth-required') {
        try {
          const resolver = getMultiFactorResolver(auth, error);
          const totpHint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
          if (totpHint) {
            setMfaResolver(resolver);
            setAuthModalMode('mfa_totp');
            setIsAuthModalOpen(true);
            return;
          }
        } catch (mfaErr) {
          console.error('[Auth] Failed to initialize MFA resolver:', mfaErr);
        }
      }
      console.error('[Auth] Email Login Error:', error);
      throw error;
    }
  };

  // 3. Email & Password Registration with Verification
  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: ProfileRole = 'customer'
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      
      // Update display name
      await updateProfile(result.user, {
        displayName: displayName.trim()
      });

      // Send verification email
      try {
        await sendEmailVerification(result.user);
      } catch (err) {
        console.warn('[Auth] Verification email dispatch deferred:', err);
      }

      await syncProfileDoc(result.user, {
        displayName: displayName.trim(),
        role,
        passwordSynchronized: true,
        emailVerified: false
      });

      closeAuthModal();
    } catch (error: any) {
      console.error('[Auth] Email Registration Error:', error);
      throw error;
    }
  };

  // 3b. Quick Demo Account Login / Auto-Registration for Testing (Development Only)
  const loginWithDemoRole = async (role: ProfileRole) => {
    if (!(import.meta as any).env?.DEV) {
      throw new Error('Demo role login is disabled in production builds.');
    }
    let demoEmail = '';
    const demoPass = (import.meta as any).env?.VITE_DEMO_AUTH_PASSWORD || '';
    if (!demoPass) {
      throw new Error('Demo account password is not configured. Set VITE_DEMO_AUTH_PASSWORD in your local .env file.');
    }
    let demoName = '';

    if (role === 'super_admin') {
      demoEmail = 'superadmin@ellic.com';
      demoName = 'Akash Joshi (Super Admin)';
    } else if (role === 'ellix_admin' || role === 'admin') {
      demoEmail = 'admin@ellic.com';
      demoName = 'Siddharth Admin (Ellic)';
    } else if (role === 'client' || role === 'retailer') {
      demoEmail = 'client@ellic.com';
      demoName = 'Vikram Malhotra (Client Owner)';
    } else if (role === 'crew' || role === 'employee') {
      demoEmail = 'crew@ellic.com';
      demoName = 'Rahul Sharma (Store Crew)';
    } else if (role === 'wholesaler') {
      demoEmail = 'wholesaler@ellic.com';
      demoName = 'Metro Wholesaler (Supplier)';
    } else {
      demoEmail = 'client@ellic.com';
      demoName = 'Vikram Malhotra (Client Owner)';
    }

    try {
      // 1. Try standard sign in
      const result = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      await syncProfileDoc(result.user, {
        displayName: demoName,
        role,
        emailVerified: true
      });
      closeAuthModal();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        try {
          // 2. If not registered in Firebase yet, auto-create this demo user account
          const regResult = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          await updateProfile(regResult.user, { displayName: demoName });
          await syncProfileDoc(regResult.user, {
            displayName: demoName,
            role,
            emailVerified: true,
            passwordSynchronized: true
          });
          closeAuthModal();
        } catch (regErr: any) {
          if (regErr?.code === 'auth/email-already-in-use') {
            const fallbackResult = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
            await syncProfileDoc(fallbackResult.user, { displayName: demoName, role });
            closeAuthModal();
          } else {
            console.error('[Auth] Demo auto-registration error:', regErr);
            throw regErr;
          }
        }
      } else {
        console.error('[Auth] Demo login error:', err);
        throw err;
      }
    }
  };

  // 4. Phone Recaptcha & OTP Verification
  const setUpPhoneRecaptcha = (containerId: string): RecaptchaVerifier => {
    const existingVerifier = (window as any).recaptchaVerifier;
    if (existingVerifier) {
      try {
        existingVerifier.clear();
      } catch {
        // ignore
      }
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - will allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        console.warn('[Auth] Recaptcha expired.');
      }
    });

    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const sendPhoneOtp = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    try {
      // E.164 sanitization (ensure starts with +)
      const cleanPhone = phoneNumber.trim().startsWith('+')
        ? phoneNumber.trim()
        : `+${phoneNumber.trim()}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, recaptchaVerifier);
      return confirmationResult;
    } catch (error: any) {
      console.error('[Auth] Phone OTP dispatch failed:', error);
      throw error;
    }
  };

  const confirmPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    otpCode: string,
    displayName?: string,
    role: 'retailer' | 'wholesaler' | 'admin' | 'employee' | 'customer' = 'customer'
  ) => {
    try {
      const result = await confirmationResult.confirm(otpCode.trim());
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      await syncProfileDoc(result.user, {
        displayName: displayName || result.user.displayName || 'Verified Phone User',
        phoneVerified: true,
        role
      });
      closeAuthModal();
    } catch (error: any) {
      console.error('[Auth] Confirm Phone OTP Error:', error);
      throw error;
    }
  };

  // 5. Account Synchronization: Link Google Account
  const linkGoogleAccount = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user to link');
    try {
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      await syncProfileDoc(result.user, { emailVerified: true });
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        console.info('[Auth] Link Google popup closed or cancelled by user.');
      } else {
        console.error('[Auth] Link Google Error:', error);
      }
      throw error;
    }
  };

  // 6. Account Synchronization: Link Email and Password with synchronized password
  const linkEmailAndPassword = async (email: string, pass: string) => {
    if (!auth.currentUser) throw new Error('No authenticated user to link');
    try {
      const credential = EmailAuthProvider.credential(email.trim(), pass);
      const result = await linkWithCredential(auth.currentUser, credential);
      
      // Update profile with email
      await updateProfile(result.user, {
        displayName: result.user.displayName || email.split('@')[0]
      });

      // Send email verification
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('[Auth] Verification email dispatch note:', e);
      }

      await syncProfileDoc(result.user, {
        email: email.trim(),
        passwordSynchronized: true
      });
    } catch (error: any) {
      console.error('[Auth] Link Email & Password Error:', error);
      throw error;
    }
  };

  // 7. Account Synchronization: Link Phone with OTP
  const linkPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    otpCode: string
  ) => {
    if (!auth.currentUser) throw new Error('No authenticated user to link');
    try {
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otpCode.trim()
      );
      const result = await linkWithCredential(auth.currentUser, credential);
      await syncProfileDoc(result.user, {
        phoneVerified: true,
        phoneNumber: result.user.phoneNumber || undefined
      });
    } catch (error: any) {
      console.error('[Auth] Link Phone Error:', error);
      throw error;
    }
  };

  // 8. Synchronize Master Password Across All Methods
  const synchronizeMasterPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('No authenticated user active');
    try {
      await updatePassword(auth.currentUser, newPassword);
      await syncProfileDoc(auth.currentUser, {
        passwordSynchronized: true
      });
    } catch (error: any) {
      console.error('[Auth] Synchronize Password Error:', error);
      throw error;
    }
  };

  // 9. Email Verification Dispatch
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await sendEmailVerification(auth.currentUser);
  };

  // 10. Password Reset Dispatch
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // 11. TOTP Two-Factor Authentication: Start Enrollment
  const startTotpEnrollment = async () => {
    if (!auth.currentUser) {
      throw new Error('Please sign in before setting up Two-Factor Authentication.');
    }
    const user = auth.currentUser;
    const hasPassword = user.providerData.some(p => p.providerId === 'password');
    const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');

    if (hasPassword && !user.emailVerified && !hasGoogle) {
      try {
        await sendEmailVerification(user);
      } catch {
        // ignore
      }
      throw new Error('Email verification is required by Firebase before enabling Two-Factor Authentication. A verification link has been sent to your email.');
    }

    try {
      const mfaUser = multiFactor(user);
      const session = await mfaUser.getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      setTotpSecret(secret);

      const accountName = user.email || user.displayName || 'Ellic Account';
      const issuer = 'Ellic Cloud POS';
      const qrCodeUrl = secret.generateQrCodeUrl(accountName, issuer);
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      return {
        secretKey: secret.secretKey,
        qrCodeUrl,
        qrCodeDataUrl,
        totpSecret: secret
      };
    } catch (err: any) {
      console.error('[Auth] Failed to start TOTP enrollment:', err);
      if (err.code === 'auth/unverified-email') {
        throw new Error('Your email address must be verified before setting up Two-Factor Authentication.');
      }
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('For your security, please sign out and log in again before setting up Two-Factor Authentication.');
      }
      throw new Error(err.message || 'Failed to initialize authenticator setup.');
    }
  };

  // 12. TOTP Two-Factor Authentication: Confirm Enrollment with 6-digit Code
  const confirmTotpEnrollment = async (secret: TotpSecret, verificationCode: string) => {
    if (!auth.currentUser) throw new Error('No active user session found.');
    const cleanCode = verificationCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      throw new Error('Please enter the complete 6-digit code from your authenticator app.');
    }

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, cleanCode);
      const mfaUser = multiFactor(auth.currentUser);
      await mfaUser.enroll(assertion, 'Authenticator App');
      setIsTotpEnrolled(true);
      setTotpSecret(null);
      await syncProfileDoc(auth.currentUser, {
        totpEnrolled: true,
        twoFactorEnabled: true,
        twoFactorType: 'totp'
      });
    } catch (err: any) {
      console.error('[Auth] Failed to confirm TOTP enrollment:', err);
      if (err.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please check your authenticator app and ensure your device clock is accurate.');
      }
      throw new Error(err.message || 'Failed to activate Two-Factor Authentication.');
    }
  };

  // 13. TOTP Two-Factor Authentication: Unenroll / Remove 2FA
  const unenrollTotp = async () => {
    if (!auth.currentUser) throw new Error('No active user session found.');
    try {
      const mfaUser = multiFactor(auth.currentUser);
      const enrolledTotp = mfaUser.enrolledFactors.find(
        f => f.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );
      if (enrolledTotp) {
        await mfaUser.unenroll(enrolledTotp);
      }
      setIsTotpEnrolled(false);
      setTotpSecret(null);
      await syncProfileDoc(auth.currentUser, {
        totpEnrolled: false,
        twoFactorEnabled: false,
        twoFactorType: 'none'
      });
    } catch (err: any) {
      console.error('[Auth] Failed to unenroll TOTP:', err);
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('For security, please log out and sign in again before disabling Two-Factor Authentication.');
      }
      throw new Error(err.message || 'Failed to disable Two-Factor Authentication.');
    }
  };

  // 14. Resolve TOTP Challenge During Sign In
  const resolveTotpSignIn = async (code: string) => {
    if (!mfaResolver) throw new Error('No pending Two-Factor Authentication challenge found.');
    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      throw new Error('Please enter the 6-digit code from your authenticator app.');
    }
    const totpHint = mfaResolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!totpHint) throw new Error('TOTP security factor not found for this account.');

    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, cleanCode);
      const userCredential = await mfaResolver.resolveSignIn(assertion);
      setMfaResolver(null);
      await syncProfileDoc(userCredential.user);
      closeAuthModal();
    } catch (err: any) {
      console.error('[Auth] TOTP 2FA Verification Error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        throw new Error('Incorrect 6-digit verification code. Please check your authenticator app and try again.');
      }
      throw new Error(err.message || 'Two-Factor Authentication failed.');
    }
  };

  const cancelMfaSignIn = () => {
    setMfaResolver(null);
    setAuthModalMode('login');
  };

  // 15. Sign Out
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsTotpEnrolled(false);
    setTotpSecret(null);
    setMfaResolver(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        authModalMode,
        isSyncHubOpen,
        isTotpEnrolled,
        totpSecret,
        mfaResolver,
        openAuthModal,
        closeAuthModal,
        setIsSyncHubOpen,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        setUpPhoneRecaptcha,
        sendPhoneOtp,
        confirmPhoneOtp,
        linkGoogleAccount,
        linkEmailAndPassword,
        linkPhoneOtp,
        synchronizeMasterPassword,
        resendVerificationEmail,
        sendPasswordReset,
        startTotpEnrollment,
        confirmTotpEnrollment,
        unenrollTotp,
        resolveTotpSignIn,
        cancelMfaSignIn,
        logout,
        refreshUserProfile,
        loginWithDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
