// lib/hooks/useAuth.js
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch staff profile to get role + restaurant_id
        try {
          const staffRef = doc(db, 'staff', firebaseUser.uid);
          const staffSnap = await getDoc(staffRef);
          if (staffSnap.exists()) {
            setStaffProfile({ id: staffSnap.id, ...staffSnap.data() });
          }
        } catch (err) {
          console.error('Error fetching staff profile:', err);
        }
      } else {
        setUser(null);
        setStaffProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Auth error code:', err.code, 'Message:', err.message);
      setError(getAuthErrorMessage(err.code));
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, staffProfile, loading, error, login, logout };
}

function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Login failed. Please try again.';
  }
}
