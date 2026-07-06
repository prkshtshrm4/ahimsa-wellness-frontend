import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithCredential,
  PhoneAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAK4X4PE-2AbplTodvHz1VVLmxFLD0iUWc',
  authDomain: 'ahimsa-wellness.firebaseapp.com',
  projectId: 'ahimsa-wellness',
  storageBucket: 'ahimsa-wellness.firebasestorage.app',
  messagingSenderId: '933609179840',
  appId: '1:933609179840:web:1f9d5194385d6f99203b25',
  measurementId: 'G-0ZX6D78LCE',
};

let app;
export function firebaseAuth() {
  if (!app) app = initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogle() {
  const auth = firebaseAuth();
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return { token: await cred.user.getIdToken(), user: cred.user };
}

export async function sendPhoneOtp(e164Phone, recaptchaContainerId) {
  const auth = firebaseAuth();
  if (!window._ahRecaptcha) {
    window._ahRecaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  }
  const confirmation = await signInWithPhoneNumber(auth, e164Phone, window._ahRecaptcha);
  return confirmation;
}

export async function confirmPhoneOtp(confirmation, otp) {
  const cred = await confirmation.confirm(otp);
  return { token: await cred.user.getIdToken(), user: cred.user };
}

/** Start phone verification to link to the current Google user. */
export async function startPhoneLink(e164Phone, recaptchaContainerId) {
  const auth = firebaseAuth();
  if (!auth.currentUser) throw new Error('not_signed_in');
  resetRecaptcha();
  window._ahRecaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  const provider = new PhoneAuthProvider(auth);
  return provider.verifyPhoneNumber(e164Phone, window._ahRecaptcha);
}

export async function completePhoneLink(verificationId, otp) {
  const auth = firebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const linked = await linkWithCredential(auth.currentUser, credential);
  return { token: await linked.user.getIdToken(true), user: linked.user };
}

export function resetRecaptcha() {
  if (window._ahRecaptcha) {
    try {
      window._ahRecaptcha.clear();
    } catch {
      /* ignore */
    }
    window._ahRecaptcha = null;
  }
}
