import { writeBatch, doc, collection } from 'firebase/firestore'
import { db } from './config'

// ─── FIFA World Cup 2026 — Official Groups ────────────────────────────────────
// Draw held December 5, 2025 in Washington D.C.
// Format: 12 groups of 4 teams (A–L), full round-robin = 6 matches per group = 72 total
// Top 2 from each group + 8 best 3rd-place teams advance to Round of 32
// Source: FIFA official draw results

const GROUPS = {
  A: [
    { name: 'México',       flag: '🇲🇽' },
    { name: 'Sudáfrica',    flag: '🇿🇦' },
    { name: 'Corea del Sur',flag: '🇰🇷' },
    { name: 'Chequia',      flag: '🇨🇿' },
  ],
  B: [
    { name: 'Canadá',            flag: '🇨🇦' },
    { name: 'Bosnia-Herzegovina',flag: '🇧🇦' },
    { name: 'Catar',             flag: '🇶🇦' },
    { name: 'Suiza',             flag: '🇨🇭' },
  ],
  C: [
    { name: 'Brasil',    flag: '🇧🇷' },
    { name: 'Marruecos', flag: '🇲🇦' },
    { name: 'Haití',     flag: '🇭🇹' },
    { name: 'Escocia',   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  ],
  D: [
    { name: 'Estados Unidos', flag: '🇺🇸' },
    { name: 'Paraguay',       flag: '🇵🇾' },
    { name: 'Australia',      flag: '🇦🇺' },
    { name: 'Turquía',        flag: '🇹🇷' },
  ],
  E: [
    { name: 'Alemania',        flag: '🇩🇪' },
    { name: 'Curaçao',         flag: '🇨🇼' },
    { name: 'Costa de Marfil', flag: '🇨🇮' },
    { name: 'Ecuador',         flag: '🇪🇨' },
  ],
  F: [
    { name: 'Países Bajos', flag: '🇳🇱' },
    { name: 'Japón',        flag: '🇯🇵' },
    { name: 'Suecia',       flag: '🇸🇪' },
    { name: 'Túnez',        flag: '🇹🇳' },
  ],
  G: [
    { name: 'Bélgica',      flag: '🇧🇪' },
    { name: 'Egipto',       flag: '🇪🇬' },
    { name: 'Irán',         flag: '🇮🇷' },
    { name: 'Nueva Zelanda',flag: '🇳🇿' },
  ],
  H: [
    { name: 'España',         flag: '🇪🇸' },
    { name: 'Uruguay',        flag: '🇺🇾' },
    { name: 'Arabia Saudita', flag: '🇸🇦' },
    { name: 'Cabo Verde',     flag: '🇨🇻' },
  ],
  I: [
    { name: 'Francia',  flag: '🇫🇷' },
    { name: 'Senegal',  flag: '🇸🇳' },
    { name: 'Noruega',  flag: '🇳🇴' },
    { name: 'Irak',     flag: '🇮🇶' },
  ],
  J: [
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'Algeria',   flag: '🇩🇿' },
    { name: 'Austria',   flag: '🇦🇹' },
    { name: 'Jordania',  flag: '🇯🇴' },
  ],
  K: [
    { name: 'Portugal',            flag: '🇵🇹' },
    { name: 'Colombia',            flag: '🇨🇴' },
    { name: 'Uzbekistán',          flag: '🇺🇿' },
    { name: 'Rep. Dem. del Congo', flag: '🇨🇩' },
  ],
  L: [
    { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Croacia',    flag: '🇭🇷' },
    { name: 'Ghana',      flag: '🇬🇭' },
    { name: 'Panamá',     flag: '🇵🇦' },
  ],
}

// ─── Match schedule (UTC) ──────────────────────────────────────────────────────
// Matchday 1: June 11–17 | Matchday 2: June 18–24 | Matchday 3: June 25–27
// MD3 matches within each group are SIMULTANEOUS (same kick-off time)
// Confirmed kick-off times (UTC) sourced from official FIFA/Sky Sports schedules.
// Pairings: MD1 = t1vs2 & t3vs4 | MD2 = t1vs3 & t2vs4 | MD3 = t1vs4 & t2vs3

const SCHEDULE = {
  //       MD1: [t1vs2,                   t3vs4]           MD2: [t1vs3,                   t2vs4]           MD3 (both simultaneous)
  A: { md1: ['2026-06-11T19:00:00Z', '2026-06-12T02:00:00Z'], md2: ['2026-06-18T19:00:00Z', '2026-06-18T22:00:00Z'], md3: '2026-06-25T19:00:00Z' },
  B: { md1: ['2026-06-12T19:00:00Z', '2026-06-13T19:00:00Z'], md2: ['2026-06-19T22:00:00Z', '2026-06-20T01:00:00Z'], md3: '2026-06-25T19:00:00Z' },
  C: { md1: ['2026-06-13T22:00:00Z', '2026-06-14T01:00:00Z'], md2: ['2026-06-19T22:00:00Z', '2026-06-20T22:00:00Z'], md3: '2026-06-25T21:00:00Z' },
  D: { md1: ['2026-06-13T01:00:00Z', '2026-06-14T04:00:00Z'], md2: ['2026-06-20T01:00:00Z', '2026-06-20T19:00:00Z'], md3: '2026-06-25T21:00:00Z' },
  E: { md1: ['2026-06-14T17:00:00Z', '2026-06-15T17:00:00Z'], md2: ['2026-06-21T17:00:00Z', '2026-06-21T20:00:00Z'], md3: '2026-06-26T19:00:00Z' },
  F: { md1: ['2026-06-14T20:00:00Z', '2026-06-15T20:00:00Z'], md2: ['2026-06-21T20:00:00Z', '2026-06-22T01:00:00Z'], md3: '2026-06-26T19:00:00Z' },
  G: { md1: ['2026-06-15T17:00:00Z', '2026-06-15T23:00:00Z'], md2: ['2026-06-22T17:00:00Z', '2026-06-22T20:00:00Z'], md3: '2026-06-26T21:00:00Z' },
  H: { md1: ['2026-06-16T17:00:00Z', '2026-06-16T20:00:00Z'], md2: ['2026-06-22T23:00:00Z', '2026-06-23T02:00:00Z'], md3: '2026-06-26T21:00:00Z' },
  I: { md1: ['2026-06-16T20:00:00Z', '2026-06-17T01:00:00Z'], md2: ['2026-06-23T19:00:00Z', '2026-06-23T22:00:00Z'], md3: '2026-06-27T19:00:00Z' },
  J: { md1: ['2026-06-16T23:00:00Z', '2026-06-17T17:00:00Z'], md2: ['2026-06-23T01:00:00Z', '2026-06-24T01:00:00Z'], md3: '2026-06-27T19:00:00Z' },
  K: { md1: ['2026-06-17T17:00:00Z', '2026-06-17T23:00:00Z'], md2: ['2026-06-24T17:00:00Z', '2026-06-24T20:00:00Z'], md3: '2026-06-27T21:00:00Z' },
  L: { md1: ['2026-06-17T20:00:00Z', '2026-06-18T01:00:00Z'], md2: ['2026-06-23T20:00:00Z', '2026-06-24T23:00:00Z'], md3: '2026-06-27T21:00:00Z' },
}

// ─── Knockout placeholder matches ─────────────────────────────────────────────
const KNOCKOUT_MATCHES = [
  // Round of 32 (16 matches) — July 1–5
  ...Array.from({ length: 16 }, (_, i) => ({
    matchNumber: 73 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date(`2026-07-0${1 + Math.floor(i / 4)}T21:00:00Z`),
    stage: 'round_of_32', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Round of 16 (8 matches) — July 7–9
  ...Array.from({ length: 8 }, (_, i) => ({
    matchNumber: 89 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date(`2026-07-0${7 + Math.floor(i / 3)}T21:00:00Z`),
    stage: 'round_of_16', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Quarterfinals (4 matches) — July 11–12
  ...Array.from({ length: 4 }, (_, i) => ({
    matchNumber: 97 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date(`2026-07-${11 + Math.floor(i / 2)}T21:00:00Z`),
    stage: 'quarterfinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Semifinals (2 matches) — July 14–15
  { matchNumber: 101, homeTeam: 'Por definir', awayTeam: 'Por definir', homeFlag: '❓', awayFlag: '❓', matchDate: new Date('2026-07-14T21:00:00Z'), stage: 'semifinal', group: null, homeScore: null, awayScore: null, isFinished: false },
  { matchNumber: 102, homeTeam: 'Por definir', awayTeam: 'Por definir', homeFlag: '❓', awayFlag: '❓', matchDate: new Date('2026-07-15T21:00:00Z'), stage: 'semifinal', group: null, homeScore: null, awayScore: null, isFinished: false },
  // Third place — July 18
  { matchNumber: 103, homeTeam: 'Por definir', awayTeam: 'Por definir', homeFlag: '❓', awayFlag: '❓', matchDate: new Date('2026-07-18T18:00:00Z'), stage: 'third_place', group: null, homeScore: null, awayScore: null, isFinished: false },
  // Final — July 19, MetLife Stadium
  { matchNumber: 104, homeTeam: 'Por definir', awayTeam: 'Por definir', homeFlag: '❓', awayFlag: '❓', matchDate: new Date('2026-07-19T21:00:00Z'), stage: 'final', group: null, homeScore: null, awayScore: null, isFinished: false },
]

// ─── Build all group stage matches ────────────────────────────────────────────
// 12 groups × 6 matches each (full round-robin) = 72 group stage matches
// MD1: t1 vs t2, t3 vs t4
// MD2: t1 vs t3, t2 vs t4
// MD3: t1 vs t4, t2 vs t3  (simultaneous within group — same kick-off time)

export const seedMatches = async () => {
  const matches = []
  let matchNumber = 1

  for (const grp of Object.keys(GROUPS)) {
    const [t1, t2, t3, t4] = GROUPS[grp]
    const sched = SCHEDULE[grp]

    const mk = (home, away, dateStr, matchday) => ({
      matchNumber: matchNumber++,
      homeTeam: home.name, homeFlag: home.flag,
      awayTeam: away.name, awayFlag: away.flag,
      matchDate: new Date(dateStr),
      stage: 'group',
      group: grp,
      matchday,
      homeScore: null,
      awayScore: null,
      isFinished: false,
    })

    // Matchday 1
    matches.push(mk(t1, t2, sched.md1[0], 1))
    matches.push(mk(t3, t4, sched.md1[1], 1))
    // Matchday 2
    matches.push(mk(t1, t3, sched.md2[0], 2))
    matches.push(mk(t2, t4, sched.md2[1], 2))
    // Matchday 3 — simultaneous
    matches.push(mk(t1, t4, sched.md3, 3))
    matches.push(mk(t2, t3, sched.md3, 3))
  }

  // Sort by matchDate then matchNumber
  matches.sort((a, b) =>
    a.matchDate - b.matchDate || a.matchNumber - b.matchNumber
  )

  const allMatches = [...matches, ...KNOCKOUT_MATCHES]

  // Firestore batch write (max 500 ops per batch)
  const BATCH_SIZE = 490
  for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const match of allMatches.slice(i, i + BATCH_SIZE)) {
      batch.set(doc(collection(db, 'matches')), match)
    }
    await batch.commit()
  }

  return { groupStage: matches.length, knockout: KNOCKOUT_MATCHES.length, total: allMatches.length }
}
