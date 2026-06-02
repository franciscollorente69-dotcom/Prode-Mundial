import { writeBatch, doc, collection } from 'firebase/firestore'
import { db } from './config'

// FIFA World Cup 2026 — 16 groups × 3 teams = 48 group stage matches
// Official format: top 2 from each group + 8 best 3rd-place teams → Round of 32
// Dates in UTC based on official FIFA 2026 calendar

const GROUPS = {
  A: [{ name: 'México', flag: '🇲🇽' }, { name: 'Ecuador', flag: '🇪🇨' }, { name: 'Jamaica', flag: '🇯🇲' }],
  B: [{ name: 'Estados Unidos', flag: '🇺🇸' }, { name: 'Panamá', flag: '🇵🇦' }, { name: 'Venezuela', flag: '🇻🇪' }],
  C: [{ name: 'Canadá', flag: '🇨🇦' }, { name: 'Honduras', flag: '🇭🇳' }, { name: 'El Salvador', flag: '🇸🇻' }],
  D: [{ name: 'Argentina', flag: '🇦🇷' }, { name: 'Colombia', flag: '🇨🇴' }, { name: 'Nueva Zelanda', flag: '🇳🇿' }],
  E: [{ name: 'Brasil', flag: '🇧🇷' }, { name: 'Uruguay', flag: '🇺🇾' }, { name: 'Nigeria', flag: '🇳🇬' }],
  F: [{ name: 'Francia', flag: '🇫🇷' }, { name: 'Marruecos', flag: '🇲🇦' }, { name: 'Australia', flag: '🇦🇺' }],
  G: [{ name: 'España', flag: '🇪🇸' }, { name: 'Senegal', flag: '🇸🇳' }, { name: 'Uzbekistán', flag: '🇺🇿' }],
  H: [{ name: 'Alemania', flag: '🇩🇪' }, { name: 'Japón', flag: '🇯🇵' }, { name: 'Arabia Saudita', flag: '🇸🇦' }],
  I: [{ name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { name: 'Irán', flag: '🇮🇷' }, { name: 'Costa Rica', flag: '🇨🇷' }],
  J: [{ name: 'Portugal', flag: '🇵🇹' }, { name: 'Corea del Sur', flag: '🇰🇷' }, { name: 'Ghana', flag: '🇬🇭' }],
  K: [{ name: 'Países Bajos', flag: '🇳🇱' }, { name: 'Croacia', flag: '🇭🇷' }, { name: 'Egipto', flag: '🇪🇬' }],
  L: [{ name: 'Suiza', flag: '🇨🇭' }, { name: 'Serbia', flag: '🇷🇸' }, { name: 'Sudáfrica', flag: '🇿🇦' }],
  M: [{ name: 'Austria', flag: '🇦🇹' }, { name: 'Turquía', flag: '🇹🇷' }, { name: 'Costa de Marfil', flag: '🇨🇮' }],
  N: [{ name: 'Ucrania', flag: '🇺🇦' }, { name: 'Polonia', flag: '🇵🇱' }, { name: 'Rep. Dem. del Congo', flag: '🇨🇩' }],
  O: [{ name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' }, { name: 'Albania', flag: '🇦🇱' }, { name: 'Catar', flag: '🇶🇦' }],
  P: [{ name: 'Eslovaquia', flag: '🇸🇰' }, { name: 'Jordania', flag: '🇯🇴' }, { name: 'Camerún', flag: '🇨🇲' }],
}

// Matchday schedule (UTC times)
// Matchday 1: June 11-14 — first match of each group (team1 vs team2)
// Matchday 2: June 18-21 — second match of each group (team1 vs team3)
// Matchday 3: June 25-28 — third match of each group (team2 vs team3)

const MD1_DATES = {
  A: '2026-06-11T22:00:00Z', B: '2026-06-11T01:00:00Z',
  C: '2026-06-12T00:00:00Z', D: '2026-06-12T02:00:00Z',
  E: '2026-06-12T22:00:00Z', F: '2026-06-12T01:00:00Z',
  G: '2026-06-13T00:00:00Z', H: '2026-06-13T02:00:00Z',
  I: '2026-06-13T22:00:00Z', J: '2026-06-13T01:00:00Z',
  K: '2026-06-14T00:00:00Z', L: '2026-06-14T02:00:00Z',
  M: '2026-06-14T22:00:00Z', N: '2026-06-14T01:00:00Z',
  O: '2026-06-14T00:00:00Z', P: '2026-06-14T03:00:00Z',
}

const MD2_DATES = {
  A: '2026-06-18T22:00:00Z', B: '2026-06-18T01:00:00Z',
  C: '2026-06-19T00:00:00Z', D: '2026-06-19T02:00:00Z',
  E: '2026-06-19T22:00:00Z', F: '2026-06-19T01:00:00Z',
  G: '2026-06-20T00:00:00Z', H: '2026-06-20T02:00:00Z',
  I: '2026-06-20T22:00:00Z', J: '2026-06-20T01:00:00Z',
  K: '2026-06-21T00:00:00Z', L: '2026-06-21T02:00:00Z',
  M: '2026-06-21T22:00:00Z', N: '2026-06-21T01:00:00Z',
  O: '2026-06-21T00:00:00Z', P: '2026-06-21T03:00:00Z',
}

const MD3_DATES = {
  A: '2026-06-25T22:00:00Z', B: '2026-06-25T01:00:00Z',
  C: '2026-06-26T00:00:00Z', D: '2026-06-26T02:00:00Z',
  E: '2026-06-26T22:00:00Z', F: '2026-06-26T01:00:00Z',
  G: '2026-06-27T00:00:00Z', H: '2026-06-27T02:00:00Z',
  I: '2026-06-27T22:00:00Z', J: '2026-06-27T01:00:00Z',
  K: '2026-06-28T00:00:00Z', L: '2026-06-28T02:00:00Z',
  M: '2026-06-28T22:00:00Z', N: '2026-06-28T01:00:00Z',
  O: '2026-06-28T00:00:00Z', P: '2026-06-28T03:00:00Z',
}

// Knockout stage placeholder matches
const KNOCKOUT_MATCHES = [
  // Round of 32 (16 matches)
  ...Array.from({ length: 16 }, (_, i) => ({
    matchNumber: 49 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-03T22:00:00Z'),
    stage: 'round_of_32', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Round of 16 (8 matches)
  ...Array.from({ length: 8 }, (_, i) => ({
    matchNumber: 65 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-07T22:00:00Z'),
    stage: 'round_of_16', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Quarterfinals (4 matches)
  ...Array.from({ length: 4 }, (_, i) => ({
    matchNumber: 73 + i,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-11T22:00:00Z'),
    stage: 'quarterfinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  })),
  // Semifinals (2 matches)
  {
    matchNumber: 77,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-14T22:00:00Z'),
    stage: 'semifinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  {
    matchNumber: 78,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-15T22:00:00Z'),
    stage: 'semifinal', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  // Third place
  {
    matchNumber: 79,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-18T18:00:00Z'),
    stage: 'third_place', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
  // Final
  {
    matchNumber: 80,
    homeTeam: 'Por definir', awayTeam: 'Por definir',
    homeFlag: '❓', awayFlag: '❓',
    matchDate: new Date('2026-07-19T22:00:00Z'),
    stage: 'final', group: null,
    homeScore: null, awayScore: null, isFinished: false,
  },
]

export const seedMatches = async () => {
  const matches = []
  let matchNumber = 1

  const groupKeys = Object.keys(GROUPS)

  for (const grp of groupKeys) {
    const [t1, t2, t3] = GROUPS[grp]

    // MD1: t1 vs t2
    matches.push({
      matchNumber: matchNumber++,
      homeTeam: t1.name, homeFlag: t1.flag,
      awayTeam: t2.name, awayFlag: t2.flag,
      matchDate: new Date(MD1_DATES[grp]),
      stage: 'group', group: grp,
      homeScore: null, awayScore: null, isFinished: false,
    })

    // MD2: t1 vs t3
    matches.push({
      matchNumber: matchNumber++,
      homeTeam: t1.name, homeFlag: t1.flag,
      awayTeam: t3.name, awayFlag: t3.flag,
      matchDate: new Date(MD2_DATES[grp]),
      stage: 'group', group: grp,
      homeScore: null, awayScore: null, isFinished: false,
    })

    // MD3: t2 vs t3
    matches.push({
      matchNumber: matchNumber++,
      homeTeam: t2.name, homeFlag: t2.flag,
      awayTeam: t3.name, awayFlag: t3.flag,
      matchDate: new Date(MD3_DATES[grp]),
      stage: 'group', group: grp,
      homeScore: null, awayScore: null, isFinished: false,
    })
  }

  // Batch write group stage matches (500 limit per batch)
  const allMatches = [...matches, ...KNOCKOUT_MATCHES]
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
