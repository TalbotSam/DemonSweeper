const LEVELS = [
  {
    cols: 10,
    rows: 10,
    mines: 4,
    hazardType: "mine",
    interlude: [
      "MWAHAHAHAHAHAHA",
      "You've awoken a Demon",
      "You'll never escape me or the MINES!"
    ]
  },
  {
    cols: 10,
    rows: 10,
    mines: 10,
    hazardType: "mine",
    interlude: [
      "Still here?",
      "Fine. More mines."
    ]
  },
    {
    cols: 10,
    rows: 10,
    mines: 12,
    hazardType: "sigil",
    interlude: [
      "Still here?",
      "Fine. No more mines...",
      "Now you'll step on my mark!"
    ]
  }
];

function getLevelConfig(level) {
  return LEVELS[level - 1] ?? LEVELS[LEVELS.length - 1];
}