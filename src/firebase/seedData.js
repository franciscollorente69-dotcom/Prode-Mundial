import { writeBatch, doc, collection } from 'firebase/firestore'
import { db } from './config'

// ─── FIFA World Cup 2026 — Official groups (draw: December 5, 2025, Washington D.C.) ──
// 12 groups of 4 teams (A–L) | Full round-robin = 6 matches/group = 72 group stage matches
// Top 2 from each group + 8 best 3rd-place teams → Round of 32
// All kick-off times in UTC

const GROUP_STAGE_MATCHES = [
  // ── Matchday 1 ──────────────────────────────────────────────────────────────
  // Thursday June 11
  { matchNumber: 1,  group: 'A', homeTeam: 'México',          homeFlag: '🇲🇽', awayTeam: 'Sudáfrica',           awayFlag: '🇿🇦', matchDate: '2026-06-11T18:00:00Z', matchday: 1 },
  { matchNumber: 2,  group: 'A', homeTeam: 'Corea del Sur',   homeFlag: '🇰🇷', awayTeam: 'República Checa',     awayFlag: '🇨🇿', matchDate: '2026-06-12T01:00:00Z', matchday: 1 },
  // Friday June 12
  { matchNumber: 3,  group: 'B', homeTeam: 'Canadá',          homeFlag: '🇨🇦', awayTeam: 'Bosnia-Herzegovina',  awayFlag: '🇧🇦', matchDate: '2026-06-12T18:00:00Z', matchday: 1 },
  { matchNumber: 4,  group: 'D', homeTeam: 'Estados Unidos',  homeFlag: '🇺🇸', awayTeam: 'Paraguay',            awayFlag: '🇵🇾', matchDate: '2026-06-13T00:00:00Z', matchday: 1 },
  // Saturday June 13
  { matchNumber: 5,  group: 'D', homeTeam: 'Australia',       homeFlag: '🇦🇺', awayTeam: 'Turquía',             awayFlag: '🇹🇷', matchDate: '2026-06-13T03:00:00Z', matchday: 1 },
  { matchNumber: 6,  group: 'B', homeTeam: 'Catar',           homeFlag: '🇶🇦', awayTeam: 'Suiza',               awayFlag: '🇨🇭', matchDate: '2026-06-13T18:00:00Z', matchday: 1 },
  { matchNumber: 7,  group: 'C', homeTeam: 'Brasil',          homeFlag: '🇧🇷', awayTeam: 'Marruecos',           awayFlag: '🇲🇦', matchDate: '2026-06-13T21:00:00Z', matchday: 1 },
  { matchNumber: 8,  group: 'C', homeTeam: 'Haití',           homeFlag: '🇭🇹', awayTeam: 'Escocia',             awayFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', matchDate: '2026-06-14T00:00:00Z', matchday: 1 },
  // Sunday June 14
  { matchNumber: 9,  group: 'E', homeTeam: 'Alemania',        homeFlag: '🇩🇪', awayTeam: 'Curaçao',             awayFlag: '🇨🇼', matchDate: '2026-06-14T16:00:00Z', matchday: 1 },
  { matchNumber: 10, group: 'F', homeTeam: 'Países Bajos',    homeFlag: '🇳🇱', awayTeam: 'Japón',               awayFlag: '🇯🇵', matchDate: '2026-06-14T19:00:00Z', matchday: 1 },
  { matchNumber: 11, group: 'E', homeTeam: 'Costa de Marfil', homeFlag: '🇨🇮', awayTeam: 'Ecuador',             awayFlag: '🇪🇨', matchDate: '2026-06-14T22:00:00Z', matchday: 1 },
  { matchNumber: 12, group: 'F', homeTeam: 'Suecia',          homeFlag: '🇸🇪', awayTeam: 'Túnez',               awayFlag: '🇹🇳', matchDate: '2026-06-15T01:00:00Z', matchday: 1 },
  // Monday June 15
  { matchNumber: 13, group: 'H', homeTeam: 'España',          homeFlag: '🇪🇸', awayTeam: 'Cabo Verde',          awayFlag: '🇨🇻', matchDate: '2026-06-15T15:00:00Z', matchday: 1 },
  { matchNumber: 14, group: 'G', homeTeam: 'Bélgica',         homeFlag: '🇧🇪', awayTeam: 'Egipto',              awayFlag: '🇪🇬', matchDate: '2026-06-15T18:00:00Z', matchday: 1 },
  { matchNumber: 15, group: 'H', homeTeam: 'Arabia Saudita',  homeFlag: '🇸🇦', awayTeam: 'Uruguay',             awayFlag: '🇺🇾', matchDate: '2026-06-15T21:00:00Z', matchday: 1 },
  { matchNumber: 16, group: 'G', homeTeam: 'Irán',            homeFlag: '🇮🇷', awayTeam: 'Nueva Zelanda',       awayFlag: '🇳🇿', matchDate: '2026-06-16T00:00:00Z', matchday: 1 },
  // Tuesday June 16
  { matchNumber: 17, group: 'J', homeTeam: 'Austria',         homeFlag: '🇦🇹', awayTeam: 'Jordania',            awayFlag: '🇯🇴', matchDate: '2026-06-16T03:00:00Z', matchday: 1 },
  { matchNumber: 18, group: 'I', homeTeam: 'Francia',         homeFlag: '🇫🇷', awayTeam: 'Senegal',             awayFlag: '🇸🇳', matchDate: '2026-06-16T18:00:00Z', matchday: 1 },
  { matchNumber: 19, group: 'I', homeTeam: 'Irak',            homeFlag: '🇮🇶', awayTeam: 'Noruega',             awayFlag: '🇳🇴', matchDate: '2026-06-16T21:00:00Z', matchday: 1 },
  { matchNumber: 20, group: 'J', homeTeam: 'Argentina',       homeFlag: '🇦🇷', awayTeam: 'Argelia',             awayFlag: '🇩🇿', matchDate: '2026-06-17T00:00:00Z', matchday: 1 },
  // Wednesday June 17
  { matchNumber: 21, group: 'K', homeTeam: 'Portugal',        homeFlag: '🇵🇹', awayTeam: 'R.D. Congo',          awayFlag: '🇨🇩', matchDate: '2026-06-17T16:00:00Z', matchday: 1 },
  { matchNumber: 22, group: 'L', homeTeam: 'Inglaterra',      homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayTeam: 'Croacia',            awayFlag: '🇭🇷', matchDate: '2026-06-17T19:00:00Z', matchday: 1 },
  { matchNumber: 23, group: 'L', homeTeam: 'Ghana',           homeFlag: '🇬🇭', awayTeam: 'Panamá',              awayFlag: '🇵🇦', matchDate: '2026-06-17T22:00:00Z', matchday: 1 },
  { matchNumber: 24, group: 'K', homeTeam: 'Uzbekistán',      homeFlag: '🇺🇿', awayTeam: 'Colombia',            awayFlag: '🇨🇴', matchDate: '2026-06-18T01:00:00Z', matchday: 1 },

  // ── Matchday 2 ──────────────────────────────────────────────────────────────
  // Thursday June 18
  { matchNumber: 25, group: 'A', homeTeam: 'República Checa', homeFlag: '🇨🇿', awayTeam: 'Sudáfrica',           awayFlag: '🇿🇦', matchDate: '2026-06-18T15:00:00Z', matchday: 2 },
  { matchNumber: 26, group: 'B', homeTeam: 'Suiza',           homeFlag: '🇨🇭', awayTeam: 'Bosnia-Herzegovina',  awayFlag: '🇧🇦', matchDate: '2026-06-18T18:00:00Z', matchday: 2 },
  { matchNumber: 27, group: 'B', homeTeam: 'Canadá',          homeFlag: '🇨🇦', awayTeam: 'Catar',               awayFlag: '🇶🇦', matchDate: '2026-06-18T21:00:00Z', matchday: 2 },
  { matchNumber: 28, group: 'A', homeTeam: 'México',          homeFlag: '🇲🇽', awayTeam: 'Corea del Sur',       awayFlag: '🇰🇷', matchDate: '2026-06-19T00:00:00Z', matchday: 2 },
  // Friday June 19
  { matchNumber: 29, group: 'D', homeTeam: 'Turquía',         homeFlag: '🇹🇷', awayTeam: 'Paraguay',            awayFlag: '🇵🇾', matchDate: '2026-06-19T03:00:00Z', matchday: 2 },
  { matchNumber: 30, group: 'D', homeTeam: 'Estados Unidos',  homeFlag: '🇺🇸', awayTeam: 'Australia',           awayFlag: '🇦🇺', matchDate: '2026-06-19T18:00:00Z', matchday: 2 },
  { matchNumber: 31, group: 'C', homeTeam: 'Escocia',         homeFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayTeam: 'Marruecos',          awayFlag: '🇲🇦', matchDate: '2026-06-19T21:00:00Z', matchday: 2 },
  { matchNumber: 32, group: 'C', homeTeam: 'Brasil',          homeFlag: '🇧🇷', awayTeam: 'Haití',               awayFlag: '🇭🇹', matchDate: '2026-06-20T00:00:00Z', matchday: 2 },
  // Saturday June 20
  { matchNumber: 33, group: 'F', homeTeam: 'Túnez',           homeFlag: '🇹🇳', awayTeam: 'Japón',               awayFlag: '🇯🇵', matchDate: '2026-06-20T03:00:00Z', matchday: 2 },
  { matchNumber: 34, group: 'F', homeTeam: 'Países Bajos',    homeFlag: '🇳🇱', awayTeam: 'Suecia',              awayFlag: '🇸🇪', matchDate: '2026-06-20T16:00:00Z', matchday: 2 },
  { matchNumber: 35, group: 'E', homeTeam: 'Alemania',        homeFlag: '🇩🇪', awayTeam: 'Costa de Marfil',     awayFlag: '🇨🇮', matchDate: '2026-06-20T19:00:00Z', matchday: 2 },
  { matchNumber: 36, group: 'E', homeTeam: 'Ecuador',         homeFlag: '🇪🇨', awayTeam: 'Curaçao',             awayFlag: '🇨🇼', matchDate: '2026-06-21T01:00:00Z', matchday: 2 },
  // Sunday June 21
  { matchNumber: 37, group: 'H', homeTeam: 'España',          homeFlag: '🇪🇸', awayTeam: 'Arabia Saudita',      awayFlag: '🇸🇦', matchDate: '2026-06-21T15:00:00Z', matchday: 2 },
  { matchNumber: 38, group: 'G', homeTeam: 'Bélgica',         homeFlag: '🇧🇪', awayTeam: 'Irán',                awayFlag: '🇮🇷', matchDate: '2026-06-21T18:00:00Z', matchday: 2 },
  { matchNumber: 39, group: 'H', homeTeam: 'Uruguay',         homeFlag: '🇺🇾', awayTeam: 'Cabo Verde',          awayFlag: '🇨🇻', matchDate: '2026-06-21T21:00:00Z', matchday: 2 },
  { matchNumber: 40, group: 'G', homeTeam: 'Nueva Zelanda',   homeFlag: '🇳🇿', awayTeam: 'Egipto',              awayFlag: '🇪🇬', matchDate: '2026-06-22T00:00:00Z', matchday: 2 },
  // Monday June 22
  { matchNumber: 41, group: 'J', homeTeam: 'Argentina',       homeFlag: '🇦🇷', awayTeam: 'Austria',             awayFlag: '🇦🇹', matchDate: '2026-06-22T16:00:00Z', matchday: 2 },
  { matchNumber: 42, group: 'I', homeTeam: 'Francia',         homeFlag: '🇫🇷', awayTeam: 'Irak',                awayFlag: '🇮🇶', matchDate: '2026-06-22T20:00:00Z', matchday: 2 },
  { matchNumber: 43, group: 'I', homeTeam: 'Noruega',         homeFlag: '🇳🇴', awayTeam: 'Senegal',             awayFlag: '🇸🇳', matchDate: '2026-06-22T23:00:00Z', matchday: 2 },
  { matchNumber: 44, group: 'J', homeTeam: 'Jordania',        homeFlag: '🇯🇴', awayTeam: 'Argelia',             awayFlag: '🇩🇿', matchDate: '2026-06-23T02:00:00Z', matchday: 2 },
  // Tuesday June 23
  { matchNumber: 45, group: 'K', homeTeam: 'Portugal',        homeFlag: '🇵🇹', awayTeam: 'Uzbekistán',          awayFlag: '🇺🇿', matchDate: '2026-06-23T16:00:00Z', matchday: 2 },
  { matchNumber: 46, group: 'L', homeTeam: 'Inglaterra',      homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayTeam: 'Ghana',              awayFlag: '🇬🇭', matchDate: '2026-06-23T19:00:00Z', matchday: 2 },
  { matchNumber: 47, group: 'L', homeTeam: 'Panamá',          homeFlag: '🇵🇦', awayTeam: 'Croacia',             awayFlag: '🇭🇷', matchDate: '2026-06-23T22:00:00Z', matchday: 2 },
  { matchNumber: 48, group: 'K', homeTeam: 'Colombia',        homeFlag: '🇨🇴', awayTeam: 'R.D. Congo',          awayFlag: '🇨🇩', matchDate: '2026-06-24T01:00:00Z', matchday: 2 },

  // ── Matchday 3 (simultaneous pairs within each group) ────────────────────────
  // Wednesday June 24
  { matchNumber: 49, group: 'B', homeTeam: 'Suiza',           homeFlag: '🇨🇭', awayTeam: 'Canadá',              awayFlag: '🇨🇦', matchDate: '2026-06-24T18:00:00Z', matchday: 3 },
  { matchNumber: 50, group: 'B', homeTeam: 'Bosnia-Herzegovina', homeFlag: '🇧🇦', awayTeam: 'Catar',            awayFlag: '🇶🇦', matchDate: '2026-06-24T18:00:00Z', matchday: 3 },
  { matchNumber: 51, group: 'C', homeTeam: 'Escocia',         homeFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayTeam: 'Brasil',             awayFlag: '🇧🇷', matchDate: '2026-06-24T21:00:00Z', matchday: 3 },
  { matchNumber: 52, group: 'C', homeTeam: 'Marruecos',       homeFlag: '🇲🇦', awayTeam: 'Haití',               awayFlag: '🇭🇹', matchDate: '2026-06-24T21:00:00Z', matchday: 3 },
  { matchNumber: 53, group: 'A', homeTeam: 'República Checa', homeFlag: '🇨🇿', awayTeam: 'México',              awayFlag: '🇲🇽', matchDate: '2026-06-25T00:00:00Z', matchday: 3 },
  { matchNumber: 54, group: 'A', homeTeam: 'Sudáfrica',       homeFlag: '🇿🇦', awayTeam: 'Corea del Sur',       awayFlag: '🇰🇷', matchDate: '2026-06-25T00:00:00Z', matchday: 3 },
  // Thursday June 25
  { matchNumber: 55, group: 'E', homeTeam: 'Curaçao',         homeFlag: '🇨🇼', awayTeam: 'Costa de Marfil',     awayFlag: '🇨🇮', matchDate: '2026-06-25T19:00:00Z', matchday: 3 },
  { matchNumber: 56, group: 'E', homeTeam: 'Ecuador',         homeFlag: '🇪🇨', awayTeam: 'Alemania',            awayFlag: '🇩🇪', matchDate: '2026-06-25T19:00:00Z', matchday: 3 },
  { matchNumber: 57, group: 'F', homeTeam: 'Japón',           homeFlag: '🇯🇵', awayTeam: 'Suecia',              awayFlag: '🇸🇪', matchDate: '2026-06-25T22:00:00Z', matchday: 3 },
  { matchNumber: 58, group: 'F', homeTeam: 'Túnez',           homeFlag: '🇹🇳', awayTeam: 'Países Bajos',        awayFlag: '🇳🇱', matchDate: '2026-06-25T22:00:00Z', matchday: 3 },
  { matchNumber: 59, group: 'D', homeTeam: 'Turquía',         homeFlag: '🇹🇷', awayTeam: 'Estados Unidos',      awayFlag: '🇺🇸', matchDate: '2026-06-26T01:00:00Z', matchday: 3 },
  { matchNumber: 60, group: 'D', homeTeam: 'Paraguay',        homeFlag: '🇵🇾', awayTeam: 'Australia',           awayFlag: '🇦🇺', matchDate: '2026-06-26T01:00:00Z', matchday: 3 },
  // Friday June 26
  { matchNumber: 61, group: 'I', homeTeam: 'Noruega',         homeFlag: '🇳🇴', awayTeam: 'Francia',             awayFlag: '🇫🇷', matchDate: '2026-06-26T18:00:00Z', matchday: 3 },
  { matchNumber: 62, group: 'I', homeTeam: 'Senegal',         homeFlag: '🇸🇳', awayTeam: 'Irak',                awayFlag: '🇮🇶', matchDate: '2026-06-26T18:00:00Z', matchday: 3 },
  { matchNumber: 63, group: 'H', homeTeam: 'Cabo Verde',      homeFlag: '🇨🇻', awayTeam: 'Arabia Saudita',      awayFlag: '🇸🇦', matchDate: '2026-06-26T23:00:00Z', matchday: 3 },
  { matchNumber: 64, group: 'H', homeTeam: 'Uruguay',         homeFlag: '🇺🇾', awayTeam: 'España',              awayFlag: '🇪🇸', matchDate: '2026-06-26T23:00:00Z', matchday: 3 },
  { matchNumber: 65, group: 'G', homeTeam: 'Egipto',          homeFlag: '🇪🇬', awayTeam: 'Irán',                awayFlag: '🇮🇷', matchDate: '2026-06-27T02:00:00Z', matchday: 3 },
  { matchNumber: 66, group: 'G', homeTeam: 'Nueva Zelanda',   homeFlag: '🇳🇿', awayTeam: 'Bélgica',             awayFlag: '🇧🇪', matchDate: '2026-06-27T02:00:00Z', matchday: 3 },
  // Saturday June 27
  { matchNumber: 67, group: 'L', homeTeam: 'Panamá',          homeFlag: '🇵🇦', awayTeam: 'Inglaterra',          awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', matchDate: '2026-06-27T20:00:00Z', matchday: 3 },
  { matchNumber: 68, group: 'L', homeTeam: 'Croacia',         homeFlag: '🇭🇷', awayTeam: 'Ghana',               awayFlag: '🇬🇭', matchDate: '2026-06-27T20:00:00Z', matchday: 3 },
  { matchNumber: 69, group: 'K', homeTeam: 'Colombia',        homeFlag: '🇨🇴', awayTeam: 'Portugal',            awayFlag: '🇵🇹', matchDate: '2026-06-27T22:30:00Z', matchday: 3 },
  { matchNumber: 70, group: 'K', homeTeam: 'R.D. Congo',      homeFlag: '🇨🇩', awayTeam: 'Uzbekistán',          awayFlag: '🇺🇿', matchDate: '2026-06-27T22:30:00Z', matchday: 3 },
  { matchNumber: 71, group: 'J', homeTeam: 'Argelia',         homeFlag: '🇩🇿', awayTeam: 'Austria',             awayFlag: '🇦🇹', matchDate: '2026-06-28T01:00:00Z', matchday: 3 },
  { matchNumber: 72, group: 'J', homeTeam: 'Jordania',        homeFlag: '🇯🇴', awayTeam: 'Argentina',           awayFlag: '🇦🇷', matchDate: '2026-06-28T01:00:00Z', matchday: 3 },
]

// ─── Knockout placeholder matches ─────────────────────────────────────────────
const KNOCKOUT_MATCHES = [
  // Round of 32 — 16 matches (July 1–5)
  ...Array.from({ length: 16 }, (_, i) => ({
    matchNumber: 73 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-03T22:00:00Z'),
    stage: 'round_of_32', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Round of 16 — 8 matches (July 7–9)
  ...Array.from({ length: 8 }, (_, i) => ({
    matchNumber: 89 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-07T22:00:00Z'),
    stage: 'round_of_16', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Quarterfinals — 4 matches (July 11–12)
  ...Array.from({ length: 4 }, (_, i) => ({
    matchNumber: 97 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-11T22:00:00Z'),
    stage: 'quarterfinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Semifinals (July 14–15)
  {
    matchNumber: 101,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-14T22:00:00Z'),
    stage: 'semifinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  {
    matchNumber: 102,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-15T22:00:00Z'),
    stage: 'semifinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  // Third place (July 18)
  {
    matchNumber: 103,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-18T18:00:00Z'),
    stage: 'third_place', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  // Final — July 19, MetLife Stadium
  {
    matchNumber: 104,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-19T22:00:00Z'),
    stage: 'final', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
]

// ─── Export ───────────────────────────────────────────────────────────────────

export const seedMatches = async () => {
  // Normalise group stage rows into full Firestore documents
  const groupMatches = GROUP_STAGE_MATCHES.map((m) => ({
    ...m,
    matchDate: new Date(m.matchDate),
    stage: 'group',
    homeScore: null,
    awayScore: null,
    isFinished: false,
  }))

  const allMatches = [...groupMatches, ...KNOCKOUT_MATCHES]

  // Firestore batch write (hard limit: 500 ops/batch)
  const BATCH_SIZE = 400
  for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const match of allMatches.slice(i, i + BATCH_SIZE)) {
      batch.set(doc(collection(db, 'matches')), match)
    }
    await batch.commit()
  }

  return {
    groupStage: groupMatches.length,
    knockout: KNOCKOUT_MATCHES.length,
    total: allMatches.length,
  }
}
