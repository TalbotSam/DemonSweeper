const LEVELS = [
  {
    cols: 10,
    rows: 10,
    mines: 5,
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
    mines: 7,
    hazardType: "mine",
    interlude: [
      "Still here?",
      "Fine. No more MINES.",
      "SEE HOW YOU LIKE THIS!"
    ]
  },
    {
    cols: 10,
    rows: 10,
    mines: 10,
    hazardType: "sigil",
    interlude: [
      "CLAP CLAP CLAP",
      "Thought you could defeat me?",
      "TRY THIS!!"
    ]
  },
      {
    cols: 10,
    rows: 10,
    mines: 15,
    hazardType: "sigil",
    interlude: [
      "blah blah something",
      "xxxxxxxxxxxxxxxxxxxxxxxxwfsf",
      "Lorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra MooLorem Upson Dollor Te Ra Moo",
      "I cast a spell on you!"
    ]
  }
];

function getLevelConfig(level) {
  return LEVELS[level - 1] ?? LEVELS[LEVELS.length - 1];
}