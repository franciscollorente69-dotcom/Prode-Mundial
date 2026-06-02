import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'

// ─── Matches ──────────────────────────────────────────────────────────────────

export const getMatches = async () => {
  const snap = await getDocs(query(collection(db, 'matches'), orderBy('matchNumber')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const subscribeMatches = (callback) =>
  onSnapshot(query(collection(db, 'matches'), orderBy('matchNumber')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const updateMatchResult = async (matchId, homeScore, awayScore) => {
  await updateDoc(doc(db, 'matches', matchId), {
    homeScore,
    awayScore,
    isFinished: true,
  })
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export const getPredictionsByUser = async (userId) => {
  const snap = await getDocs(
    query(collection(db, 'predictions'), where('userId', '==', userId))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const subscribePredictionsByUser = (userId, callback) =>
  onSnapshot(
    query(collection(db, 'predictions'), where('userId', '==', userId)),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const getPredictionByUserAndMatch = async (userId, matchId) => {
  const snap = await getDocs(
    query(
      collection(db, 'predictions'),
      where('userId', '==', userId),
      where('matchId', '==', matchId)
    )
  )
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export const savePrediction = async (userId, matchId, predictedHome, predictedAway) => {
  const existing = await getPredictionByUserAndMatch(userId, matchId)
  if (existing) {
    await updateDoc(doc(db, 'predictions', existing.id), {
      predictedHome,
      predictedAway,
      updatedAt: serverTimestamp(),
    })
    return existing.id
  }
  const ref = await addDoc(collection(db, 'predictions'), {
    userId,
    matchId,
    predictedHome,
    predictedAway,
    pointsEarned: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export const calculateAndSavePoints = async (matchId) => {
  const matchSnap = await getDoc(doc(db, 'matches', matchId))
  if (!matchSnap.exists()) return
  const match = matchSnap.data()
  if (!match.isFinished) return

  const predsSnap = await getDocs(
    query(collection(db, 'predictions'), where('matchId', '==', matchId))
  )

  const batch = writeBatch(db)

  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data()
    const pts = computePoints(
      pred.predictedHome,
      pred.predictedAway,
      match.homeScore,
      match.awayScore
    )

    batch.update(doc(db, 'predictions', predDoc.id), { pointsEarned: pts })

    const prevPts = pred.pointsEarned ?? 0
    const delta = pts - prevPts
    if (delta !== 0) {
      const userRef = doc(db, 'users', pred.userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        batch.update(userRef, {
          totalPoints: (userSnap.data().totalPoints || 0) + delta,
        })
      }
    }
  }

  await batch.commit()
}

const computePoints = (ph, pa, rh, ra) => {
  if (ph === rh && pa === ra) return 3
  const predOutcome = ph > pa ? 'H' : ph < pa ? 'A' : 'D'
  const realOutcome = rh > ra ? 'H' : rh < ra ? 'A' : 'D'
  return predOutcome === realOutcome ? 1 : 0
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const subscribeLeaderboard = (callback) =>
  onSnapshot(
    query(collection(db, 'users'), orderBy('totalPoints', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

// ─── Knockout matches ─────────────────────────────────────────────────────────

export const updateKnockoutMatch = async (matchId, data) =>
  updateDoc(doc(db, 'matches', matchId), data)

// ─── Admin: delete all matches (for re-seeding) ───────────────────────────────

export const deleteAllMatches = async () => {
  const snap = await getDocs(collection(db, 'matches'))
  const BATCH_SIZE = 490
  let deleted = 0
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const d of snap.docs.slice(i, i + BATCH_SIZE)) {
      batch.delete(doc(db, 'matches', d.id))
      deleted++
    }
    await batch.commit()
  }
  return deleted
}
