import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

export const registerUser = async (email, password, username, displayName, phone = '') => {
  const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (usernameDoc.exists()) {
    throw new Error('El nombre de usuario ya está en uso')
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    username: username.toLowerCase(),
    displayName,
    phone,
    isAdmin: false,
    approved: false,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid })

  return user
}

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const logoutUser = () => signOut(auth)

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
