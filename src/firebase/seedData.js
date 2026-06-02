import { writeBatch, doc, collection } from 'firebase/firestore'
import { db } from './config'

// FIFA World Cup 2026 — 12 groups × 4 teams = 72 group stage matches
// All times stored in UTC (Argentina local time UTC-3, converted by +3h)

const GROUP_STAGE_MATCHES = [
  // ── Matchday 1 ──────────────────────────────────────────────────────────────
  // Thursday June 11
  { matchNumber: 1,  homeTeam: 'México',        homeFlag: '🇲🇽', awayTeam: 'Sudáfrica',           awayFlag: '🇿🇦', matchDate: '2026-06-11T18:00:00Z', group: 'A' },
  { matchNumber: 2,  homeTeam: 'Corea del Sur', homeFlag: '🇰🇷', awayTeam: 'República Checa',     awayFlag: '🇨🇿', matchDate: '2026-06-12T01:00:00Z', group: 'A' },
  // Friday June 12
  { matchNumber: 3,  homeTeam: 'Canadá',        homeFlag: '🇨🇦', awayTeam: 'Bosnia-Herzegovina',  awayFlag: '🇧🇦', matchDate: '2026-06-12T18:00:00Z', group: 'B' },
  { matchNumber: 4,  homeTeam: 'Estados Unidos', homeFlag: '🇺🇸', awayTeam: 'Paraguay',           awayFlag: '🇵🇾', matchDate: '2026-06-13T00:00:00Z', group: 'D' },
  // Saturday June 13
  { matchNumber: 5,  homeTeam: 'Australia',     homeFlag: '🇦🇺', awayTeam: 'Turquía',             awayFlag: '🇹🇷', matchDate: '2026-06-13T03:00:00Z', group: 'D' },
  { matchNumber: 6,  homeTeam: 'Catar',         homeFlag: '🇶🇦', awayTeam: 'Suiza',               awayFlag: '🇨🇭', matchDate: '2026-06-13T18:00:00Z', group: 'B' },
  { matchNumber: 7,  homeTeam: 'Brasil',        homeFlag: '🇧🇷', awayTeam: 'Marruecos',           awayFlag: '🇲🇦', matchDate: '2026-06-13T21:00:00Z', group: 'C' },
  { matchNumber: 8,  homeTeam: 'Haití',         homeFlag: '🇭🇹', awayTeam: 'Escocia',             awayFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', matchDate: '2026-06-14T00:00:00Z', group: 'C' },
  // Sunday June 14
  { matchNumber: 9,  homeTeam: 'Alemania',      homeFlag: '🇩🇪', awayTeam: 'Curazao',             awayFlag: '🇨🇼', matchDate: '2026-06-14T16:00:00Z', group: 'E' },
  { matchNumber: 10, homeTeam: 'Países Bajos',  homeFlag: '🇳🇱', awayTeam: 'Japón',               awayFlag: '🇯🇵', matchDate: '2026-06-14T19:00:00Z', group: 'F' },
  { matchNumber: 11, homeTeam: 'Costa de Marfil', homeFlag: '🇨🇮', awayTeam: 'Ecuador',           awayFlag: '🇪🇨', matchDate: '2026-06-14T22:00:00Z', group: 'E' },
  { matchNumber: 12, homeTeam: 'Suecia',        homeFlag: '🇸🇪', awayTeam: 'Túnez',               awayFlag: '🇹🇳', matchDate: '2026-06-15T01:00:00Z', group: 'F' },
  // Monday June 15
  { matchNumber: 13, homeTeam: 'España',        homeFlag: '🇪🇸', awayTeam: 'Cabo Verde',          awayFlag: '🇨🇻', matchDate: '2026-06-15T15:00:00Z', group: 'H' },
  { matchNumber: 14, homeTeam: 'Bélgica',       homeFlag: '🇧🇪', awayTeam: 'Egipto',              awayFlag: '🇪🇬', matchDate: '2026-06-15T18:00:00Z', group: 'G' },
  { matchNumber: 15, homeTeam: 'Arabia Saudita', homeFlag: '🇸🇦', awayTeam: 'Uruguay',            awayFlag: '🇺🇾', matchDate: '2026-06-15T21:00:00Z', group: 'H' },
  { matchNumber: 16, homeTeam: 'Irán',          homeFlag: '🇮🇷', awayTeam: 'Nueva Zelanda',       awayFlag: '🇳🇿', matchDate: '2026-06-16T00:00:00Z', group: 'G' },
  // Tuesday June 16
  { matchNumber: 17, homeTeam: 'Austria',       homeFlag: '🇦🇹', awayTeam: 'Jordania',            awayFlag: '🇯🇴', matchDate: '2026-06-16T03:00:00Z', group: 'J' },
  { matchNumber: 18, homeTeam: 'Francia',       homeFlag: '🇫🇷', awayTeam: 'Senegal',             awayFlag: '🇸🇳', matchDate: '2026-06-16T18:00:00Z', group: 'I' },
  { matchNumber: 19, homeTeam: 'Irak',          homeFlag: '🇮🇶', awayTeam: 'Noruega',             awayFlag: '🇳🇴', matchDate: '2026-06-16T21:00:00Z', group: 'I' },
  { matchNumber: 20, homeTeam: 'Argentina',     homeFlag: '🇦🇷', awayTeam: 'Argelia',             awayFlag: '🇩🇿', matchDate: '2026-06-17T00:00:00Z', group: 'J' },
  // Wednesday June 17
  { matchNumber: 21, homeTeam: 'Portugal',      homeFlag: '🇵🇹', awayTeam: 'R.D. Congo',          awayFlag: '🇨🇩', matchDate: '2026-06-17T16:00:00Z', group: 'K' },
  { matchNumber: 22, homeTeam: 'Inglaterra',    homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayTeam: 'Croacia',            awayFlag: '🇭🇷', matchDate: '2026-06-17T19:00:00Z', group: 'L' },
  { matchNumber: 23, homeTeam: 'Ghana',         homeFlag: '🇬🇭', awayTeam: 'Panamá',              awayFlag: '🇵🇦', matchDate: '2026-06-17T22:00:00Z', group: 'L' },
  { matchNumber: 24, homeTeam: 'Uzbekistán',    homeFlag: '🇺🇿', awayTeam: 'Colombia',            awayFlag: '🇨🇴', matchDate: '2026-06-18T01:00:00Z', group: 'K' },

  // ── Matchday 2 ──────────────────────────────────────────────────────────────
  // Thursday June 18
  { matchNumber: 25, homeTeam: 'República Checa', homeFlag: '🇨🇿', awayTeam: 'Sudáfrica',         awayFlag: '🇿🇦', matchDate: '2026-06-18T15:00:00Z', group: 'A' },
  { matchNumber: 26, homeTeam: 'Suiza',          homeFlag: '🇨🇭', awayTeam: 'Bosnia-Herzegovina', awayFlag: '🇧🇦', matchDate: '2026-06-18T18:00:00Z', group: 'B' },
  { matchNumber: 27, homeTeam: 'Canadá',         homeFlag: '🇨🇦', awayTeam: 'Catar',              awayFlag: '🇶🇦', matchDate: '2026-06-18T21:00:00Z', group: 'B' },
  { matchNumber: 28, homeTeam: 'México',         homeFlag: '🇲🇽', awayTeam: 'Corea del Sur',      awayFlag: '🇰🇷', matchDate: '2026-06-19T00:00:00Z', group: 'A' },
  // Friday June 19
  { matchNumber: 29, homeTeam: 'Turquía',        homeFlag: '🇹🇷', awayTeam: 'Paraguay',           awayFlag: '🇵🇾', matchDate: '2026-06-19T03:00:00Z', group: 'D' },
  { matchNumber: 30, homeTeam: 'Estados Unidos', homeFlag: '🇺🇸', awayTeam: 'Australia',          awayFlag: '🇦🇺', matchDate: '2026-06-19T18:00:00Z', group: 'D' },
  { matchNumber: 31, homeTeam: 'Escocia',        homeFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayTeam: 'Marruecos',          awayFlag: '🇲🇦', matchDate: '2026-06-19T21:00:00Z', group: 'C' },
  { matchNumber: 32, homeTeam: 'Brasil',         homeFlag: '🇧🇷', awayTeam: 'Haití',              awayFlag: '🇭🇹', matchDate: '2026-06-20T00:00:00Z', group: 'C' },
  // Saturday June 20
  { matchNumber: 33, homeTeam: 'Túnez',          homeFlag: '🇹🇳', awayTeam: 'Japón',              awayFlag: '🇯🇵', matchDate: '2026-06-20T03:00:00Z', group: 'F' },
  { matchNumber: 34, homeTeam: 'Países Bajos',   homeFlag: '🇳🇱', awayTeam: 'Suecia',             awayFlag: '🇸🇪', matchDate: '2026-06-20T16:00:00Z', group: 'F' },
  { matchNumber: 35, homeTeam: 'Alemania',       homeFlag: '🇩🇪', awayTeam: 'Costa de Marfil',    awayFlag: '🇨🇮', matchDate: '2026-06-20T19:00:00Z', group: 'E' },
  { matchNumber: 36, homeTeam: 'Ecuador',        homeFlag: '🇪🇨', awayTeam: 'Curazao',            awayFlag: '🇨🇼', matchDate: '2026-06-21T01:00:00Z', group: 'E' },
  // Sunday June 21
  { matchNumber: 37, homeTeam: 'España',         homeFlag: '🇪🇸', awayTeam: 'Arabia Saudita',     awayFlag: '🇸🇦', matchDate: '2026-06-21T15:00:00Z', group: 'H' },
  { matchNumber: 38, homeTeam: 'Bélgica',        homeFlag: '🇧🇪', awayTeam: 'Irán',               awayFlag: '🇮🇷', matchDate: '2026-06-21T18:00:00Z', group: 'G' },
  { matchNumber: 39, homeTeam: 'Uruguay',        homeFlag: '🇺🇾', awayTeam: 'Cabo Verde',         awayFlag: '🇨🇻', matchDate: '2026-06-21T21:00:00Z', group: 'H' },
  { matchNumber: 40, homeTeam: 'Nueva Zelanda',  homeFlag: '🇳🇿', awayTeam: 'Egipto',             awayFlag: '🇪🇬', matchDate: '2026-06-22T00:00:00Z', group: 'G' },
  // Monday June 22
  { matchNumber: 41, homeTeam: 'Argentina',      homeFlag: '🇦🇷', awayTeam: 'Austria',            awayFlag: '🇦🇹', matchDate: '2026-06-22T16:00:00Z', group: 'J' },
  { matchNumber: 42, homeTeam: 'Francia',        homeFlag: '🇫🇷', awayTeam: 'Irak',               awayFlag: '🇮🇶', matchDate: '2026-06-22T20:00:00Z', group: 'I' },
  { matchNumber: 43, homeTeam: 'Noruega',        homeFlag: '🇳🇴', awayTeam: 'Senegal',            awayFlag: '🇸🇳', matchDate: '2026-06-22T23:00:00Z', group: 'I' },
  { matchNumber: 44, homeTeam: 'Jordania',       homeFlag: '🇯🇴', awayTeam: 'Argelia',            awayFlag: '🇩🇿', matchDate: '2026-06-23T02:00:00Z', group: 'J' },
  // Tuesday June 23
  { matchNumber: 45, homeTeam: 'Portugal',       homeFlag: '🇵🇹', awayTeam: 'Uzbekistán',         awayFlag: '🇺🇿', matchDate: '2026-06-23T16:00:00Z', group: 'K' },
  { matchNumber: 46, homeTeam: 'Inglaterra',     homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', awayTeam: 'Ghana',              awayFlag: '🇬🇭', matchDate: '2026-06-23T19:00:00Z', group: 'L' },
  { matchNumber: 47, homeTeam: 'Panamá',         homeFlag: '🇵🇦', awayTeam: 'Croacia',            awayFlag: '🇭🇷', matchDate: '2026-06-23T22:00:00Z', group: 'L' },
  { matchNumber: 48, homeTeam: 'Colombia',       homeFlag: '🇨🇴', awayTeam: 'R.D. Congo',         awayFlag: '🇨🇩', matchDate: '2026-06-24T01:00:00Z', group: 'K' },

  // ── Matchday 3 (simultaneous pairs) ─────────────────────────────────────────
  // Wednesday June 24
  { matchNumber: 49, homeTeam: 'Suiza',          homeFlag: '🇨🇭', awayTeam: 'Canadá',             awayFlag: '🇨🇦', matchDate: '2026-06-24T18:00:00Z', group: 'B' },
  { matchNumber: 50, homeTeam: 'Bosnia-Herzegovina', homeFlag: '🇧🇦', awayTeam: 'Catar',          awayFlag: '🇶🇦', matchDate: '2026-06-24T18:00:00Z', group: 'B' },
  { matchNumber: 51, homeTeam: 'Escocia',        homeFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', awayTeam: 'Brasil',             awayFlag: '🇧🇷', matchDate: '2026-06-24T21:00:00Z', group: 'C' },
  { matchNumber: 52, homeTeam: 'Marruecos',      homeFlag: '🇲🇦', awayTeam: 'Haití',              awayFlag: '🇭🇹', matchDate: '2026-06-24T21:00:00Z', group: 'C' },
  { matchNumber: 53, homeTeam: 'República Checa', homeFlag: '🇨🇿', awayTeam: 'México',            awayFlag: '🇲🇽', matchDate: '2026-06-25T00:00:00Z', group: 'A' },
  { matchNumber: 54, homeTeam: 'Sudáfrica',      homeFlag: '🇿🇦', awayTeam: 'Corea del Sur',      awayFlag: '🇰🇷', matchDate: '2026-06-25T00:00:00Z', group: 'A' },
  // Thursday June 25
  { matchNumber: 55, homeTeam: 'Curazao',        homeFlag: '🇨🇼', awayTeam: 'Costa de Marfil',    awayFlag: '🇨🇮', matchDate: '2026-06-25T19:00:00Z', group: 'E' },
  { matchNumber: 56, homeTeam: 'Ecuador',        homeFlag: '🇪🇨', awayTeam: 'Alemania',           awayFlag: '🇩🇪', matchDate: '2026-06-25T19:00:00Z', group: 'E' },
  { matchNumber: 57, homeTeam: 'Japón',          homeFlag: '🇯🇵', awayTeam: 'Suecia',             awayFlag: '🇸🇪', matchDate: '2026-06-25T22:00:00Z', group: 'F' },
  { matchNumber: 58, homeTeam: 'Túnez',          homeFlag: '🇹🇳', awayTeam: 'Países Bajos',       awayFlag: '🇳🇱', matchDate: '2026-06-25T22:00:00Z', group: 'F' },
  { matchNumber: 59, homeTeam: 'Turquía',        homeFlag: '🇹🇷', awayTeam: 'Estados Unidos',     awayFlag: '🇺🇸', matchDate: '2026-06-26T01:00:00Z', group: 'D' },
  { matchNumber: 60, homeTeam: 'Paraguay',       homeFlag: '🇵🇾', awayTeam: 'Australia',          awayFlag: '🇦🇺', matchDate: '2026-06-26T01:00:00Z', group: 'D' },
  // Friday June 26
  { matchNumber: 61, homeTeam: 'Noruega',        homeFlag: '🇳🇴', awayTeam: 'Francia',            awayFlag: '🇫🇷', matchDate: '2026-06-26T18:00:00Z', group: 'I' },
  { matchNumber: 62, homeTeam: 'Senegal',        homeFlag: '🇸🇳', awayTeam: 'Irak',               awayFlag: '🇮🇶', matchDate: '2026-06-26T18:00:00Z', group: 'I' },
  { matchNumber: 63, homeTeam: 'Cabo Verde',     homeFlag: '🇨🇻', awayTeam: 'Arabia Saudita',     awayFlag: '🇸🇦', matchDate: '2026-06-26T23:00:00Z', group: 'H' },
  { matchNumber: 64, homeTeam: 'Uruguay',        homeFlag: '🇺🇾', awayTeam: 'España',             awayFlag: '🇪🇸', matchDate: '2026-06-26T23:00:00Z', group: 'H' },
  { matchNumber: 65, homeTeam: 'Egipto',         homeFlag: '🇪🇬', awayTeam: 'Irán',               awayFlag: '🇮🇷', matchDate: '2026-06-27T02:00:00Z', group: 'G' },
  { matchNumber: 66, homeTeam: 'Nueva Zelanda',  homeFlag: '🇳🇿', awayTeam: 'Bélgica',            awayFlag: '🇧🇪', matchDate: '2026-06-27T02:00:00Z', group: 'G' },
  // Saturday June 27
  { matchNumber: 67, homeTeam: 'Panamá',         homeFlag: '🇵🇦', awayTeam: 'Inglaterra',         awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', matchDate: '2026-06-27T20:00:00Z', group: 'L' },
  { matchNumber: 68, homeTeam: 'Croacia',        homeFlag: '🇭🇷', awayTeam: 'Ghana',              awayFlag: '🇬🇭', matchDate: '2026-06-27T20:00:00Z', group: 'L' },
  { matchNumber: 69, homeTeam: 'Colombia',       homeFlag: '🇨🇴', awayTeam: 'Portugal',           awayFlag: '🇵🇹', matchDate: '2026-06-27T22:30:00Z', group: 'K' },
  { matchNumber: 70, homeTeam: 'R.D. Congo',     homeFlag: '🇨🇩', awayTeam: 'Uzbekistán',         awayFlag: '🇺🇿', matchDate: '2026-06-27T22:30:00Z', group: 'K' },
  { matchNumber: 71, homeTeam: 'Argelia',        homeFlag: '🇩🇿', awayTeam: 'Austria',            awayFlag: '🇦🇹', matchDate: '2026-06-28T01:00:00Z', group: 'J' },
  { matchNumber: 72, homeTeam: 'Jordania',       homeFlag: '🇯🇴', awayTeam: 'Argentina',          awayFlag: '🇦🇷', matchDate: '2026-06-28T01:00:00Z', group: 'J' },
]

const KNOCKOUT_MATCHES = [
  // Round of 32 (16 matches) — 32 teams: top 2 per group + 8 best 3rd-place
  ...Array.from({ length: 16 }, (_, i) => ({
    matchNumber: 73 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-03T22:00:00Z'),
    stage: 'round_of_32', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Round of 16 (8 matches)
  ...Array.from({ length: 8 }, (_, i) => ({
    matchNumber: 89 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-07T22:00:00Z'),
    stage: 'round_of_16', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Quarterfinals (4 matches)
  ...Array.from({ length: 4 }, (_, i) => ({
    matchNumber: 97 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-11T22:00:00Z'),
    stage: 'quarterfinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Semifinals
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
  // Third place
  {
    matchNumber: 103,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-18T18:00:00Z'),
    stage: 'third_place', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  // Final
  {
    matchNumber: 104,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-19T22:00:00Z'),
    stage: 'final', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
]

export const seedMatches = async () => {
  const groupMatches = GROUP_STAGE_MATCHES.map((m) => ({
    ...m,
    matchDate: new Date(m.matchDate),
    stage: 'group',
    homeScore: null,
    awayScore: null,
    isFinished: false,
  }))

  const allMatches = [...groupMatches, ...KNOCKOUT_MATCHES]
  const BATCH_SIZE = 400

  for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = allMatches.slice(i, i + BATCH_SIZE)
    for (const match of chunk) {
      const ref = doc(collection(db, 'matches'))
      batch.set(ref, match)
    }
    await batch.commit()
  }

  return allMatches.length
}
