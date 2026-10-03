/* WINTER ARC companion — static protocol content.
 * Source of truth for the protocol text: ventures/winter-arc/src/content.py (the PDF).
 * This file mirrors it for the app: The Seven (standard + floor), 3 phases, 90 journal prompts,
 * training tracks, schedule/goal notes. Quotes: original "Built in Silence" lines plus public-domain
 * classical sources (see QUOTES, each carries its source). Foods: USDA FoodData Central (public domain).
 * Plain text only (rendered with textContent); **double asterisks** mark bold in trusted static text.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.WAContent = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BRAND = "BUILT IN SILENCE";

  // ------------------------------------------------------------ THE SEVEN
  var SEVEN = [
    { id: "wake", n: "01", name: "WAKE", std: "Same wake-up time, ±30 min, 7 days a week. Out of bed on the first alarm, no snooze.", floor: "Feet on the floor at the alarm." },
    { id: "move", n: "02", name: "MOVE", std: "Your training session. On rest days, a 30–45 min walk. Aim for 8,000+ steps.", floor: "A 20-minute walk." },
    { id: "focus", n: "03", name: "FOCUS", std: "One or two deep-work blocks on The Build: phone in another room, one task, a timer.", floor: "25 minutes on the one thing." },
    { id: "fuel", n: "04", name: "FUEL", std: "Protein at every meal. 2–3 L of water. Vegetables twice.", floor: "Protein at every meal." },
    { id: "learn", n: "05", name: "LEARN", std: "10 pages of a real book, or 20 minutes of deliberate study for The Build.", floor: "One page." },
    { id: "shutdown", n: "06", name: "SHUT DOWN", std: "Screens off 60 min before bed. The phone charges outside the bedroom.", floor: "Phone outside the bedroom." },
    { id: "record", n: "07", name: "RECORD", std: "Tick the tracker, then write 3 lines: Done / Didn't / Tomorrow's first move.", floor: "Tick the boxes." }
  ];

  var CODE = [
    ["I", "Minimums beat motivation.", "Motivation is weather. Every habit has a floor, a version so small you can do it sick, travelling or heartbroken. Streaks are built from floors."],
    ["II", "Never miss twice.", "One missed day is noise. Two is the start of a new habit, and it's the wrong one. What decides the next 90 days is the day after the slip."],
    ["III", "Track it or it didn't happen.", "Memory is a liar that flatters you. An honest 4/7 is worth more than an imagined 7/7: you can fix what you can see."],
    ["IV", "Build in silence.", "Announcing a goal gives you some of the reward before you've done the work. Keep the work private and let Day 90 do the talking."],
    ["V", "Discipline is not punishment.", "Hard is fine. Harm isn't. Recovery, sleep and rest days are part of the protocol."]
  ];

  // ------------------------------------------------------------ PHASES
  var PHASES = [
    {
      num: "I", name: "Foundation", from: 1, to: 30, tagline: "Build the floor.", target: 80,
      summary: ["Fixed wake time, 7 days/week", "Train 3× per week", "1 deep-work block/day (60→90 min)", "Phone out of the bedroom", "Hit protein + water daily", "Target: ≥ 80% weekly score"],
      intro: "Most people fail a 90-day challenge in week 2 because they start at maximum. Phase I is deliberately moderate. You're building the pattern: the same wake time, the same shutdown, the same boxes ticked.",
      rules: [
        "Wake time fixed from Day 1. Pick one you can keep on Saturdays too.",
        "Train 3× per week on your track, at 2–3 reps in reserve. Leave the session feeling you could have done more.",
        "One deep-work block a day: 60 min in weeks 1–2, 90 min from week 3.",
        "Digital: grayscale on, social apps off the home screen, notifications off except calls and messages from real people.",
        "Food: don't overhaul everything. Hit protein and water. That's it.",
        "Alcohol: 2 occasions per week at most. You're protecting sleep.",
        "Take your baseline on Day 1."
      ],
      weeks: [[1, 7, "W1", "Wake, Walk, Record. If only three habits stick this week, make it these three."],
              [8, 14, "W2", "Add the full training schedule and the protein habit."],
              [15, 21, "W3", "Deep block goes to 90 min. First screen-time comparison vs Day 1."],
              [22, 30, "W4", "Consolidate. No new habits. Test on Day 30."]],
      check: "Day 30 checkpoint. Repeat the baseline. Read weeks 1–4 of your reviews. Average ≥ 70%? Enter Phase II. Below 70%? Repeat days 21–30, then move on. The only way to fail is to stop.",
      quote: "The first thirty days aren't supposed to feel epic. They're supposed to be repeatable."
    },
    {
      num: "II", name: "Intensity", from: 31, to: 60, tagline: "Choose hard on purpose.", target: 85,
      summary: ["Train 4× per week + conditioning", "2 deep-work blocks/day", "One social-media window/day", "One Hard Thing per week", "Optional: cold exposure", "Target: ≥ 85% weekly score"],
      intro: "The floor holds. Now you push. More training volume, a second deep-work block, one deliberately hard thing every week. Expect the dip around Days 38–45. The bad day isn't a sign you're failing. It's the protocol working.",
      rules: [
        "Train 4× per week (upper/lower) plus one conditioning session.",
        "Two deep-work blocks a day. Block 1 before any messages, always.",
        "Digital: one social-media window a day, 20–30 min, only after Block 1.",
        "One Hard Thing per week, scheduled at your weekly review. A 15 km walk, 100 burpees for time, a 24 h digital fast, the conversation you've been avoiding.",
        "Alcohol: zero, or one planned occasion in the whole phase.",
        "Optional Edge habit: cold finish on your shower.",
        "Day 45: write the halfway prompt. Read your Day 1 entry."
      ],
      weeks: [[31, 37, "W5", "New split. Keep the weights conservative in week 1."],
              [38, 44, "W6", "The dip. Minimums are allowed. Quitting isn't."],
              [45, 51, "W7", "Halfway review. Raise one standard by one notch."],
              [52, 60, "W8", "Peak volume. Sleep is non-negotiable. Test on Day 60."]],
      check: "Day 60 checkpoint. Repeat the baseline. If you're run down (sleep worse, resting heart rate up 5+ bpm for a week, joints aching), the Phase III deload is exactly what you need.",
      quote: "The dip is where everyone else quits. That's exactly why you stay."
    },
    {
      num: "III", name: "Identity", from: 61, to: 90, tagline: "You're no longer trying. You're being.", target: 90,
      summary: ["Deload week, then peak", "Ship The Build by Day 90", "One 24-hour offline day", "Write your personal code", "Design your Day 91 system", "Target: ≥ 90% weekly score"],
      intro: "In Phase I you did the habits. In Phase III they become who you are. You'll deload, then peak. You'll ship The Build. And you'll design Day 91, because a protocol that ends on Day 90 ends up undone by Day 120.",
      rules: [
        "Days 61–67: deload. Same sessions at ~60% of the sets and 1–2 reps further from failure.",
        "Days 68–84: back to Phase II volume. Push your top sets.",
        "Days 85–90: test week. Retest the baseline and hit your training PRs.",
        "The Build ships by Day 90: published, submitted, launched, delivered.",
        "One full 24-hour offline day in this phase.",
        "Write your Personal Code (prompt 79) and your Day 91 rules.",
        "Tell no one until Day 90. Then, if you want to, show them. Don't just tell them."
      ],
      weeks: [[61, 67, "W9", "Deload + personal code draft."],
              [68, 74, "W10", "Rebuild. The Build is 70% done."],
              [75, 81, "W11", "24 h offline day. Final push on The Build."],
              [82, 90, "W12–13", "Peak and test. Ship. Debrief."]],
      check: "Day 90. Graduation. Retest everything. Put Day 1 and Day 90 side by side. Then decide: a Day 91 system, or a new arc with higher floors.",
      quote: "Discipline stops being something you do and becomes something you are."
    }
  ];

  // ------------------------------------------------------------ 13 WEEKS (one at a time)
  // Arc-weeks are 7 days (week 13 = Days 85–90). Names + one focus each, taken from the phases'
  // week-by-week plan. The app only reveals a week when it is reached (or after the previous review).
  var WEEKS = [
    { name: "Wake · Walk · Record", focus: "If only three habits stick this week, make it these three: wake on time, walk, tick the boxes." },
    { name: "Train + protein", focus: "Add the full training schedule (3 sessions) and protein at every meal." },
    { name: "The 90-minute block", focus: "Deep block goes to 90 minutes, before any messages. Compare screen time with Day 1." },
    { name: "Consolidate", focus: "No new habits. Make the pattern boring and automatic." },
    { name: "Checkpoint → Intensity", focus: "Day 30: retest the baseline. Day 31: Phase II starts with the new split. Keep the weights conservative." },
    { name: "The dip", focus: "The novelty is gone and the finish is far. Minimums are allowed. Quitting isn't." },
    { name: "Halfway", focus: "Day 45: read your Day 1 entry. Raise one standard by one notch." },
    { name: "Peak volume", focus: "The hardest training week. Sleep is non-negotiable. One Hard Thing." },
    { name: "Checkpoint → Deload", focus: "Day 60: retest. Day 61: Phase III starts with a deload. Lighter is the plan, not a failure." },
    { name: "Rebuild", focus: "Back to full volume after the deload. Draft your Personal Code. The Build is 70% done." },
    { name: "Offline day", focus: "One full 24-hour offline day this week. Final push on The Build." },
    { name: "Peak", focus: "Push your top sets. Ship mode on The Build: cut scope, finish." },
    { name: "Test & ship", focus: "Six days. Retest everything, ship The Build, write the debrief. Then design Day 91." }
  ];

  var TRACK_LABEL = { gym: "Gym", bodyweight: "Bodyweight" };
  var SCHEDULE_LABEL = { student: "Student", "9-5": "9–5", shifts: "Shift work" };
  var GOAL_LABEL = { physique: "Physique", discipline: "Discipline", money: "Money", mental: "Mental clarity" };

  var SCHEDULE_NOTES = {
    student: "Lectures move around. Your wake time doesn't. Put Block 1 before your first class, even if it's only 45 minutes, and use free periods for the walk or reading. Exam weeks: drop MOVE and LEARN to their floors, but keep WAKE and SHUT DOWN. Weekends: same wake time, ±30 min.",
    "9-5": "Your working hours are fixed, so the edges of the day are yours. Block 1 before work, training straight after (pack the bag the night before), lunch walk in daylight. The commute is LEARN time. Weekends: same wake time, ±30 min. Saturday is a good Hard Thing day.",
    shifts: "Anchor to your sleep, not the clock. Keep one wake time per block of shifts and keep the order: wake → output → move → fuel → shut down → sleep. On changeover days the floors count as a full day. After a night shift: walk, don't train hard."
  };
  var GOAL_NOTES = {
    physique: "The visible change comes from three boring things done for 90 days: progressive training (log every session, beat one number), protein at every meal and 7–9 hours of sleep. MOVE and FUEL are your priority habits. Judge progress on the Day 30/60/90 tests, not on the mirror on a random Tuesday.",
    discipline: "Your goal isn't one big result. It's proof that you keep promises to yourself. WAKE and RECORD are your anchor habits: the first and the last thing of every day. Your number is the weekly score (targets 80 / 85 / 90%). \"Never miss twice\" is the one rule you don't break.",
    money: "Point The Build at something that can earn: a client offer, a skill employers pay for, a product, a portfolio. FOCUS is your priority habit: Block 1 goes to income-producing work before any messages. Define \"shipped\" as something visible, not hours worked.",
    mental: "Your priority habits are WAKE, SHUT DOWN and RECORD: a steady rhythm, daylight, sleep and the 3-line journal. Lead with digital discipline and the daily walk. This protocol is not therapy: if your mood stays low for two weeks or more, talk to your doctor or someone you trust."
  };

  var BREAKS = [
    ["The bad day", "Floor day. Hit the seven minimums, nothing more. It still counts. Go to bed early."],
    ["You missed a day", "Never miss twice. Tomorrow is a full day. Don't 'make up' by doubling tomorrow's training. Just resume."],
    ["You're sick", "Above the neck and you feel OK: walk only. Fever, chest symptoms or body aches: rest until 24 h after they're gone. Sleep counts as MOVE."],
    ["You're injured", "Train around it. Get it checked if it lasts more than a week."],
    ["Travel", "Keep the wake time close. 20-min room circuit: push, squat, plank, 4 rounds. Walk everywhere."],
    ["Social events", "Decide before you go: what you'll drink (or not), when you'll leave. Wake up on time anyway."],
    ["Relapse", "Don't restart at Day 1. Continue from the day you're on. Reset Day: clean room, long walk, early night. Then carry on."],
    ["Plateau", "Check sleep and protein first. Then change one thing: rep range, variation, or deload for 5 days."]
  ];

  // ------------------------------------------------------------ "THE DAY" template (minutes from midnight)
  var GENERIC_DAY = [
    [360, "WAKE", "Out of bed. Water. Open the curtains or step outside: 10 min of daylight."],
    [375, "PRIME", "No phone. 5 min of mobility or a short walk. Read the day's journal prompt."],
    [405, "DEEP BLOCK 1", "90 min on The Build before any messages. No inputs before outputs."],
    [510, "FUEL", "A protein-first breakfast. Check messages now, not earlier."],
    [540, "WORK / SCHOOL", "Your obligations. Batch email and messages 2–3 times a day."],
    [750, "MOVE", "Walk after lunch, 10–20 min. Sunlight is free."],
    [1050, "TRAIN", "Session per plan (45–60 min), or a 30–45 min walk on rest days."],
    [1140, "FUEL + LIFE", "Dinner. People. This is what the discipline is for."],
    [1230, "DEEP BLOCK 2", "Phase II–III only: 60–90 min, or learning / reading."],
    [1290, "SHUT DOWN", "Screens off. Tracker + 3 lines. Set out tomorrow's clothes. Phone out of the bedroom."],
    [1320, "SLEEP", "Lights out. Cool, dark room. 7–9 hours before the next alarm."]
  ];
  var WORK_ROW = {
    student: ["CLASSES / STUDY", "Lectures, classes, study. Use free periods for the walk or reading. Batch messages 2–3 times a day."],
    "9-5": ["WORK", "Your fixed hours. Batch email and messages 2–3 times a day."],
    shifts: ["WORK / SHIFT", "Your shift. Same order every day; only the clock moves. Batch messages."]
  };

  // ------------------------------------------------------------ BASELINE TESTS (Days 1/30/60/90)
  var BASELINE = [
    { id: "pushups", name: "Max push-ups", how: "One set, full range. Stop when form breaks.", unit: "reps" },
    { id: "plank", name: "Plank hold", how: "Forearms, straight line. Stop when the hips sag.", unit: "sec" },
    { id: "squats", name: "Squats in 60 s", how: "Bodyweight, thighs to parallel.", unit: "reps" },
    { id: "mile", name: "1.6 km / 1 mile", how: "Run, walk or mix. Same flat route each time.", unit: "min:sec" },
    { id: "rhr", name: "Resting heart rate", how: "On waking, before standing. Avg of 3 mornings.", unit: "bpm" },
    { id: "waist", name: "Waist (optional)", how: "Morning, at the navel. Skip if measuring doesn't help you.", unit: "cm" },
    { id: "sleep", name: "Average sleep", how: "Last 7 days.", unit: "h" },
    { id: "screen", name: "Daily screen time", how: "Phone average, last 7 days.", unit: "h:min" },
    { id: "deep", name: "Deep-work hours", how: "Focused hours on meaningful work, last 7 days.", unit: "h/week" },
    { id: "energy", name: "Energy / mood", how: "Honest gut score.", unit: "/10" }
  ];
  var CHECKPOINTS = [1, 30, 60, 90];

  // ------------------------------------------------------------ JOURNAL PROMPTS (90). {BED} / {WAKE} are filled in per user.
  var P1 = [
    "Where are you honestly, right now? Body, money, mind, relationships: one sentence each.",
    "What did the last 90 days of your life look like? Would you repeat them?",
    "Why are you doing this? Keep asking \"why\" until the answer gets uncomfortable.",
    "What is your phone actually giving you? What is it taking?",
    "Describe the person who wakes up on Day 90. How do they move, speak, spend the first hour?",
    "Which one habit, if it disappeared, would change everything?",
    "Week 1 is done. What was harder than expected? What was easier?",
    "Who in your life benefits from you staying the same?",
    "What story do you tell yourself about why you \"can't\"?",
    "What do you do at {BED} that the Day-90 you wouldn't?",
    "Name a time you kept a hard promise. What made it possible?",
    "What are you avoiding right now? What's it costing you?",
    "If you had 2 extra hours a day, what would you do? You already have them. Where are they going?",
    "Rate your discipline 1–10. What single change moves it up one point?",
    "What does \"enough\" look like for you, in money, body and work?",
    "Write down one thing you did this week that nobody saw and you're proud of.",
    "Which voice in your life drags you backward? Which one pulls you forward?",
    "What is your Build, and why does it matter to you and not just to your ego?",
    "Describe an ordinary Tuesday one year from now, in detail.",
    "What's the smallest possible version of today's hardest task?",
    "Where did you negotiate with yourself this week? Who won?",
    "What feeling do you most often numb with screens, food or noise?",
    "What do you want people to say about you when you're not in the room?",
    "What have you been waiting for permission to start?",
    "What belief about yourself have you outgrown?",
    "How does your body feel compared to Day 1? Be specific.",
    "What did your last bad day teach you?",
    "Which systems worked this month? Which ones need rebuilding?",
    "Write a short letter to yourself on Day 1.",
    "Phase I is closed. What did you prove?"
  ];
  var P2 = [
    "Phase II raises the ceiling. Where are you still playing it safe?",
    "Where in your body do you feel discomfort first? What does it tell you to do?",
    "What is this week's Hard Thing? When exactly will you do it?",
    "When did you last choose hard on purpose, and not because you had to?",
    "What would you attempt if failing had no audience?",
    "Who are you really competing with? Is that the right opponent?",
    "Which excuse showed up most this week? Write out its script.",
    "Describe a moment this week when you wanted to quit. What did you do next?",
    "What drains your energy that you keep putting up with?",
    "What is the real cost of staying average for another year? Put a number on it.",
    "What did your deep work produce this week? Is it actually moving the Build?",
    "What would someone you respect say about how you spent today?",
    "Where are you consuming when you should be creating?",
    "Rate your sleep this week. What's stealing it?",
    "Halfway. Name three things that are different from Day 1.",
    "What would a calm, sharp mind sound like at {WAKE}? What does yours sound like?",
    "What are you pretending not to know?",
    "Which part of the protocol do you resist most, and why that one?",
    "What are you learning about how you respond to pressure?",
    "Who do you owe an apology? Include yourself.",
    "Which one rule will you keep even after Day 90?",
    "What is discipline protecting you from?",
    "What have you stopped doing that you only just noticed?",
    "What would you do today if nobody would ever find out?",
    "What was the hardest session of this phase? How did you get through it?",
    "What does your screen-time report say your priorities are?",
    "What would the Day-90 you tell the Day-57 you?",
    "Where is your anger useful? Where is it wasted?",
    "What could make Phase III fail? Deal with it now.",
    "Phase II is closed. What did intensity teach you?"
  ];
  var P3 = [
    "Finish this sentence five times: \"I am the kind of person who…\"",
    "Which habits feel automatic now? Which ones still take willpower?",
    "What old identity are you leaving behind? Write it a short goodbye.",
    "What do your actions, not your words, say you value?",
    "Who do you want to become in the 90 days after this?",
    "What would you tell a beginner starting their Winter Arc tomorrow?",
    "Which non-negotiables stay for life?",
    "Where do you still need outside approval?",
    "What does real rest look like, the kind you've earned?",
    "Your relationship with your phone: Day 1 vs today?",
    "What does success for the Build look like on Day 90? Be exact.",
    "Which relationships got stronger during the Arc? Which got weaker?",
    "What's the quietest win of the last two months?",
    "How do you talk to yourself after a mistake now?",
    "What are you no longer afraid of?",
    "Which moment of this Arc will you still remember in ten years?",
    "What will you protect when life gets busy again?",
    "What's your plan for your worst week of the next year?",
    "Write your Personal Code: five lines, no more.",
    "Who depends on you? What do you owe them?",
    "What did you give up that you don't miss at all?",
    "How has your body changed? Your mind? Your standards?",
    "What does \"built in silence\" mean to you now?",
    "What is your next arc? Give it a name.",
    "What would you say to the people who doubted you, including you?",
    "Where can you raise the floor (the minimums) for the next 90 days?",
    "What kept you going on the days you didn't want to?",
    "Describe the person who wakes up on Day 91.",
    "Write the three rules your future self must never break.",
    "Day 90. Read your Day 1 entry. Then write what you'd say to that person."
  ];
  var PROMPTS = P1.concat(P2, P3);

  // ------------------------------------------------------------ QUOTES (96)
  // Copyright policy: no modern copyrighted quotes. Two kinds only:
  //  1. Original lines written for WINTER ARC / Built in Silence (src: "Built in Silence").
  //  2. Classical public-domain texts. Marcus Aurelius + Epictetus in George Long's translations
  //     (1862 / 1877; Long died 1879, so public domain worldwide). Seneca lines are this app's own
  //     plain-English rendering of the Latin (Gummere's 1917–25 Loeb translation is avoided because
  //     it is still in copyright in the EU, translator d. 1969).
  var BIS = "Built in Silence";
  var MA = function (ref) { return "Marcus Aurelius, Meditations " + ref + " (tr. George Long, 1862)"; };
  var EP = function (ref) { return "Epictetus, " + ref + " (tr. George Long, 1877)"; };
  var SE = function (ref) { return "Seneca, Letters to Lucilius " + ref + " (own rendering of the Latin)"; };
  var QUOTES = [
    ["Nobody is coming to save you. That's not bad news. It means you're in charge.", BIS],
    ["In the morning when thou risest unwillingly, let this thought be present: I am rising to the work of a human being.", MA("V.1")],
    ["Everything else belongs to others. Only time is ours.", SE("1.3")],
    ["Discipline starts the night before.", BIS],
    ["Of things some are in our power, and others are not.", EP("Enchiridion 1")],
    ["The day after the slip is the whole game.", BIS],
    ["No longer talk at all about the kind of man that a good man ought to be, but be such.", MA("X.16")],
    ["Hold on to every hour. Take hold of today, and you will depend less on tomorrow.", SE("1.2")],
    ["Winter comes either way. Be someone else when it ends.", BIS],
    ["Men are disturbed not by the things which happen, but by the opinions about the things.", EP("Enchiridion 5")],
    ["Nobody saw the work. Everyone sees the result.", BIS],
    ["Let it make no difference to thee whether thou art cold or warm, if thou art doing thy duty.", MA("VI.2")],
    ["While we put things off, life runs past.", SE("1.3")],
    ["Motivation is weather. The floor is climate.", BIS],
    ["Do not act as if thou wert going to live ten thousand years.", MA("IV.17")],
    ["Quiet mornings. Loud results.", BIS],
    ["Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", MA("VII.59")],
    ["To be everywhere is to be nowhere.", SE("2.2")],
    ["You don't need a new life. You need a new Tuesday, ninety times.", BIS],
    ["If it is not right, do not do it: if it is not true, do not say it.", MA("XII.17")],
    ["The cold is honest. It doesn't care how you feel. Neither does the work.", BIS],
    ["We are more often frightened than hurt; we suffer more in imagination than in reality.", SE("13.4")],
    ["Small promises, kept daily, become a person.", BIS],
    ["Take away thy opinion, and there is taken away the complaint, I have been harmed.", MA("IV.7")],
    ["The dip is where everyone else quits. That's exactly why you stay.", BIS],
    ["If you would improve, be content to be thought foolish and stupid with respect to externals.", EP("Enchiridion 13")],
    ["Floors on bad days. Standards on good ones. Never zero.", BIS],
    ["The art of life is more like the wrestler's art than the dancer's.", MA("VII.61")],
    ["It is not the one who has too little who is poor, but the one who wants more.", SE("2.6")],
    ["Be bored on purpose. Boredom is where the work starts.", BIS],
    ["Short is the little which remains to thee of life. Live as on a mountain.", MA("X.15")],
    ["Discipline is a form of self-respect, not self-punishment.", BIS],
    ["Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are.", EP("Enchiridion 8")],
    ["Output before input. The world can wait ninety minutes.", BIS],
    ["The best way of avenging thyself is not to become like the wrong doer.", MA("VI.6")],
    ["If you don't know which harbour you're steering for, no wind is the right wind.", SE("71.3")],
    ["Your phone was built by thousands of engineers. Your attention is defended by one. Use friction.", BIS],
    ["Everything is only for a day, both that which remembers and that which is remembered.", MA("IV.35")],
    ["One honest 4/7 beats an imagined 7/7.", BIS],
    ["We learn while we teach.", SE("7.8")],
    ["Darkness at 17:00 is not an excuse. It's a setting.", BIS],
    ["Nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.", MA("IV.3")],
    ["Hard is fine. Harm isn't.", BIS],
    ["Never esteem anything as of advantage to thee which shall compel thee to break thy promise, to lose thy self-respect.", MA("III.7")],
    ["Not announced. Not posted. Just done.", BIS],
    ["You need a change of mind more than a change of place.", SE("28.1")],
    ["The streak is not the point. The person the streak builds is the point.", BIS],
    ["How much more grievous are the consequences of anger than the causes of it.", MA("XI.18")],
    ["Be the same person at 06:00 on Saturday as on Monday.", BIS],
    ["I feel I am being not only improved, but transformed.", SE("6.1")],
    ["Confidence is a receipt. You earn it by keeping appointments with yourself.", BIS],
    ["The universe is transformation: life is opinion.", MA("IV.3")],
    ["Make the bed. Close the tabs. Start the block.", BIS],
    ["Remember that in life you ought to behave as at a banquet.", EP("Enchiridion 15")],
    ["Ninety days is not long. It's just long enough.", BIS],
    ["Confine thyself to the present.", MA("VII.29")],
    ["What you do in the dark months shows up in the light ones.", BIS],
    ["Nothing great comes into being all at once; not even a grape or a fig.", "Epictetus, Discourses I.15 (own rendering of the Greek)"],
    ["Rest is part of the protocol. Quitting is not.", BIS],
    ["Do every act of thy life as if it were the last.", MA("II.5")],
    ["The alarm is a vote. Cast it with your feet.", BIS],
    ["Choose hard on purpose, so hard doesn't choose you.", BIS],
    ["Begin at once to live, and count each day as a separate life.", SE("101.10")],
    ["Win the morning, keep the evening, protect the sleep in between.", BIS],
    ["Remember that thou art an actor in a play, of such a kind as the teacher may choose.", EP("Enchiridion 17")],
    ["Silence is not absence. It's concentration.", BIS],
    ["Waste no more time on what is past; this moment is the one in your hands.", "Marcus Aurelius, Meditations (own rendering of the Greek, after II.14)"],
    ["Your future self is watching what you do when no one else is.", BIS],
    ["Small steps, but every day: that is how the long road gets walked.", BIS],
    ["The person you're becoming is built on the days you didn't feel like it.", BIS],
    ["It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.", SE("104.26")],
    ["Count wins in reps, pages and hours, not in likes.", BIS],
    ["Cold mornings build warm characters.", BIS],
    ["What stands in the way of the work becomes part of the work.", "Marcus Aurelius, Meditations (own rendering of the Greek, after V.20)"],
    ["One page is still reading. Twenty minutes is still training. Floors count.", BIS],
    ["Comfort is a loan. Discipline is the repayment plan.", BIS],
    ["First say to yourself what you would be; and then do what you have to do.", "Epictetus, Discourses III.23 (own rendering of the Greek)"],
    ["No one has to know you started. They'll notice when you're done.", BIS],
    ["The phone stays outside. The thinking comes back in.", BIS],
    ["Pick one thing. Stay with it until it is done.", BIS],
    ["Ship it. Done beats perfect, and perfect never ships in winter.", BIS],
    ["Be patient with yourself, impatient with your excuses.", BIS],
    ["A fixed wake time is the first promise of the day. Keep it and the rest gets easier.", BIS],
    ["Neither the body nor the mind gets stronger on the days you skip.", BIS],
    ["Let the result make the noise.", BIS],
    ["You will slip. That's planned for. Don't plan to slip twice.", BIS],
    ["Begin, then, with small things.", "Epictetus, Enchiridion 12 (own rendering of the Greek)"],
    ["Low light. High standards.", BIS],
    ["Every block of deep work is a brick. Ninety days is a wall.", BIS],
    ["The habit doesn't care about your mood. That's its gift.", BIS],
    ["The winter will test you quietly. Answer quietly.", BIS],
    ["Keep the order: wake, output, move, fuel, shut down, sleep.", BIS],
    ["Day 1 is a decision. Day 90 is a habit. Everything in between is a vote.", BIS],
    ["You didn't find discipline. You built it, one boring day at a time.", BIS],
    ["Build it in silence. Let Day 90 speak.", BIS],
    ["The arc ends. You don't.", BIS]
  ];

  // ------------------------------------------------------------ TRAINING
  var WARMUP = "Warm-up (8 min): 3 min easy cardio · 10 arm circles each way + 10 band pull-aparts or wall slides · 5 world's greatest stretch per side · 2 ramp-up sets of your first exercise.";
  var MOBILITY = "Mobility reset (10 min): deep squat hold 2 × 45 s · 90/90 hip switches × 10 · thoracic rotations 8/side · couch stretch 45 s/side · dead hang or doorway chest stretch 2 × 30 s.";
  var PAIN_RULE = "Pain rule: burn and soreness are normal. Sharp pain, joint pain that gets worse, numbness: stop and swap the exercise. Chest pain, fainting or severe breathlessness: stop and get medical help.";
  var INTERVALS = [
    ["The Ladder", "5 min warm-up, then 6 × (1 min hard / 2 min easy). Bike, run, rower or hill walk."],
    ["EMOM 12", "Every minute on the minute: odd min 8 burpees, even min 15 squats. Scale burpees to step-backs."],
    ["Hill Repeats", "8 × 30 s uphill, walk back down. Flat country: find a stair or ramp."],
    ["The Ruck", "60 min brisk walk with a 5–10 kg backpack."],
    ["Jump Rope", "10 × (1 min on / 30 s off). Build up slowly for your calves."]
  ];
  var BW = {
    full: { title: "Full body", ex: [["Squat (your ladder step)", "3 × 8–15"], ["Push (your ladder step)", "3 × 6–15"], ["Pull (table or towel-door row)", "3 × 8–12"], ["Hinge (bridge → single-leg RDL)", "2 × 10–15"], ["Core (dead bug → hollow hold)", "3 × 20–45 s"]], note: "Rest 60–90 s. ~40 min. RIR 2–3." },
    upper: { title: "Upper", ex: [["Push (your ladder step)", "4 × 6–12"], ["Pull (your ladder step)", "4 × 8–12"], ["Pike push-up", "3 × 6–10"], ["Core", "3 sets"]], note: "RIR 1–2. Move up the ladder when you hit the top of the range on every set." },
    lower: { title: "Lower", ex: [["Squat (split → Bulgarian + backpack)", "4 × 8–12/leg"], ["Hinge (single-leg RDL)", "3 × 8–12"], ["Calf raise", "3 × 15–20"], ["Wall sit", "2 × 45–60 s"]], note: "RIR 1–2." },
    arc: { title: "Arc Session", ex: [["Push-ups", "100 total"], ["Squats", "150 total"], ["Rows", "100 total"]], note: "Any sets, for time. Write the time down; retest on Day 90." },
    ladders: "Ladders — Push: incline → knees → push-up → feet-elevated → archer. Squat: to chair → bodyweight → pause → split → Bulgarian. Pull: towel door row → table row bent → straight → feet-elevated → backpack."
  };
  var GYM = {
    A: { title: "Full body · Day A", ex: [["Squat (goblet or back)", "3 × 6–10"], ["Bench press (DB or barbell)", "3 × 6–10"], ["Lat pulldown", "3 × 8–12"], ["Romanian deadlift", "2 × 8–10"], ["Plank", "3 × 30–45 s"]], note: "RIR 2–3. Rest 2 min on compound lifts." },
    B: { title: "Full body · Day B", ex: [["Trap-bar / conventional deadlift", "3 × 5"], ["Overhead press", "3 × 6–10"], ["Seated cable row", "3 × 8–12"], ["Leg press or split squat", "2 × 10–12"], ["Farmer carry", "3 × 30 m"]], note: "RIR 2–3. Rest 2 min on compound lifts." },
    UA: { title: "Upper A", ex: [["Bench press", "4 × 5–8"], ["Barbell / chest-supported row", "4 × 6–10"], ["Overhead press", "3 × 8–10"], ["Curl + triceps pushdown", "2 × 10–15"]], note: "RIR 1–2." },
    LA: { title: "Lower A", ex: [["Back squat", "4 × 5–8"], ["Romanian deadlift", "3 × 8"], ["Walking lunge", "3 × 10/leg"], ["Calf raise", "3 × 10–15"]], note: "RIR 1–2. Squat in a rack with safeties set." },
    UB: { title: "Upper B", ex: [["Pull-up / assisted", "4 × 5–10"], ["Incline DB press", "3 × 8–12"], ["Cable row / face pull", "3 × 12–15"], ["Lateral raise", "3 × 12–20"]], note: "RIR 1–2." },
    LB: { title: "Lower B", ex: [["Trap-bar deadlift", "3 × 4–6"], ["Bulgarian split squat", "3 × 8–10/leg"], ["Leg curl", "3 × 10–12"], ["Hanging knee raise", "3 × 10–15"]], note: "RIR 1–2." }
  };

  // ------------------------------------------------------------ FOODS
  // Approximate values per 100 g from USDA FoodData Central (SR Legacy / Foundation), a public-domain
  // U.S. government dataset. Rounded; brands differ, so the label on your pack wins.
  // [id, name, kcal/100g, protein g/100g, typical portion g, portion label]
  var FOODS = [
    ["egg", "Egg, whole", 143, 12.6, 50, "1 large egg"],
    ["chicken_breast", "Chicken breast, cooked", 165, 31.0, 120, "1 fillet"],
    ["chicken_thigh", "Chicken thigh, cooked, no skin", 209, 26.0, 100, "1 thigh"],
    ["turkey_breast", "Turkey breast, roasted", 147, 30.1, 100, "1 portion"],
    ["beef_mince", "Beef mince 85% lean, cooked", 250, 25.9, 100, "1 portion"],
    ["pork_tenderloin", "Pork tenderloin, roasted", 143, 26.2, 120, "1 portion"],
    ["salmon", "Salmon, Atlantic, cooked", 206, 22.1, 125, "1 fillet"],
    ["cod", "Cod, cooked", 105, 22.8, 125, "1 fillet"],
    ["tuna_can", "Tuna, canned in water, drained", 116, 25.5, 112, "1 can drained"],
    ["sardines", "Sardines, canned in oil, drained", 208, 24.6, 90, "1 can drained"],
    ["shrimp", "Shrimp, cooked", 99, 24.0, 100, "1 portion"],
    ["tofu", "Tofu, firm", 144, 15.8, 100, "1/4 block"],
    ["tempeh", "Tempeh", 192, 20.3, 100, "1 portion"],
    ["edamame", "Edamame, cooked", 121, 11.9, 100, "1 cup shelled (approx.)"],
    ["lentils", "Lentils, cooked", 116, 9.0, 200, "1 cup"],
    ["chickpeas", "Chickpeas, cooked", 164, 8.9, 165, "1 cup"],
    ["black_beans", "Black beans, cooked", 132, 8.9, 170, "1 cup"],
    ["kidney_beans", "Kidney beans, cooked", 127, 8.7, 175, "1 cup"],
    ["greek_yogurt", "Greek yogurt, plain, non-fat", 59, 10.2, 170, "1 pot"],
    ["cottage", "Cottage cheese, low-fat", 84, 11.0, 150, "1/2 tub"],
    ["milk_whole", "Milk, whole", 61, 3.2, 250, "1 glass"],
    ["milk_semi", "Milk, 2% / semi-skimmed", 50, 3.3, 250, "1 glass"],
    ["milk_skim", "Milk, skimmed", 34, 3.4, 250, "1 glass"],
    ["cheddar", "Cheddar cheese", 403, 24.9, 30, "1 slice"],
    ["mozzarella", "Mozzarella, part-skim", 254, 24.3, 30, "1 slice"],
    ["feta", "Feta cheese", 264, 14.2, 30, "1 portion"],
    ["parmesan", "Parmesan, hard", 392, 35.8, 10, "1 tbsp grated"],
    ["whey", "Whey protein powder (check label)", 400, 78.0, 30, "1 scoop"],
    ["oats", "Oats, rolled, dry", 379, 13.2, 40, "1 bowl (dry)"],
    ["rice_white", "Rice, white, cooked", 130, 2.7, 160, "1 cup"],
    ["rice_brown", "Rice, brown, cooked", 123, 2.7, 160, "1 cup"],
    ["pasta", "Pasta, cooked", 158, 5.8, 180, "1 plate"],
    ["quinoa", "Quinoa, cooked", 120, 4.4, 185, "1 cup"],
    ["couscous", "Couscous, cooked", 112, 3.8, 160, "1 cup"],
    ["bread_wholewheat", "Bread, whole-wheat", 252, 12.4, 35, "1 slice"],
    ["bread_white", "Bread, white", 266, 7.6, 30, "1 slice"],
    ["tortilla", "Tortilla, flour", 306, 8.2, 45, "1 wrap"],
    ["potato", "Potato, baked with skin", 93, 2.5, 175, "1 medium"],
    ["sweet_potato", "Sweet potato, baked", 90, 2.0, 150, "1 medium"],
    ["corn_flakes", "Corn flakes", 357, 7.5, 30, "1 bowl"],
    ["banana", "Banana", 89, 1.1, 118, "1 medium"],
    ["apple", "Apple", 52, 0.3, 182, "1 medium"],
    ["orange", "Orange", 47, 0.9, 131, "1 medium"],
    ["blueberries", "Blueberries", 57, 0.7, 75, "1 handful"],
    ["strawberries", "Strawberries", 32, 0.7, 150, "1 cup"],
    ["grapes", "Grapes", 69, 0.7, 90, "1 handful"],
    ["kiwi", "Kiwi", 61, 1.1, 70, "1 fruit"],
    ["broccoli", "Broccoli, cooked", 35, 2.4, 90, "1 serving"],
    ["spinach", "Spinach, raw", 23, 2.9, 30, "1 handful"],
    ["carrot", "Carrot, raw", 41, 0.9, 60, "1 medium"],
    ["tomato", "Tomato, raw", 18, 0.9, 120, "1 medium"],
    ["peas", "Green peas, cooked", 84, 5.4, 80, "1 serving"],
    ["avocado", "Avocado", 160, 2.0, 70, "1/2 avocado"],
    ["almonds", "Almonds", 579, 21.2, 30, "1 handful"],
    ["peanuts", "Peanuts", 567, 25.8, 30, "1 handful"],
    ["walnuts", "Walnuts", 654, 15.2, 30, "1 handful"],
    ["peanut_butter", "Peanut butter", 588, 25.1, 16, "1 tbsp"],
    ["hummus", "Hummus", 166, 7.9, 30, "2 tbsp"],
    ["olive_oil", "Olive oil", 884, 0.0, 14, "1 tbsp"],
    ["butter", "Butter", 717, 0.9, 10, "1 pat"],
    ["dark_chocolate", "Dark chocolate 70–85%", 598, 7.8, 20, "2 squares"],
    ["pizza", "Pizza, cheese", 268, 11.4, 110, "1 slice"],
    ["fries", "French fries", 312, 3.4, 117, "1 medium portion"],
    ["orange_juice", "Orange juice", 45, 0.7, 250, "1 glass"],
    ["cola", "Cola (regular)", 37, 0.0, 330, "1 can"],
    ["beer", "Beer, regular", 43, 0.5, 330, "1 bottle"],
    ["wine", "Wine, red", 85, 0.1, 150, "1 glass"],
    ["coffee", "Coffee, black", 1, 0.1, 240, "1 cup"]
  ].map(function (r) { return { id: r[0], name: r[1], kcal100: r[2], p100: r[3], portionG: r[4], portion: r[5] }; });

  var ED_NOTE = "Tracking food is optional and off by default. If counting food or weighing yourself brings up obsessive thoughts, guilt, restriction or bingeing, switch this off. The protein-and-plants habit works without counting anything. You're not alone: talk to your doctor (huisarts / GP), or in the Netherlands look at Proud2Bme (proud2bme.nl), a support platform for people dealing with eating problems. Elsewhere, your doctor can point you to local eating-disorder support.";

  var PRIVACY = "Your data never leaves your phone. Everything you enter (profile, habits, journal, timers, food, tests) is stored only in this browser's local storage on this device. There are no accounts, no analytics, no trackers, no ads and no network calls. Nothing is uploaded. Use Export to keep a backup file; if you clear your browser data or delete the app without a backup, your data is gone.";
  var DISCLAIMER = "General education, not medical, nutritional or psychological advice. Talk to a doctor before starting if you have a heart condition, high blood pressure, diabetes, an injury, an eating disorder (current or past), are pregnant, or take regular medication. Stop any exercise that causes chest pain, dizziness, or sharp or worsening pain.";
  var COLD_SAFETY = "Cold is optional and not scored. Ask a doctor first if you have heart disease, high blood pressure, arrhythmia, Raynaud's, epilepsy, are pregnant, or have a circulation condition. Never do breathing exercises in or near water. Open water: never alone, never after alcohol. Stop at chest pain, confusion or shivering you can't control.";

  return {
    BRAND: BRAND, SEVEN: SEVEN, CODE: CODE, PHASES: PHASES, WEEKS: WEEKS, BREAKS: BREAKS,
    TRACK_LABEL: TRACK_LABEL, SCHEDULE_LABEL: SCHEDULE_LABEL, GOAL_LABEL: GOAL_LABEL,
    SCHEDULE_NOTES: SCHEDULE_NOTES, GOAL_NOTES: GOAL_NOTES, GENERIC_DAY: GENERIC_DAY, WORK_ROW: WORK_ROW,
    BASELINE: BASELINE, CHECKPOINTS: CHECKPOINTS, PROMPTS: PROMPTS, QUOTES: QUOTES,
    WARMUP: WARMUP, MOBILITY: MOBILITY, PAIN_RULE: PAIN_RULE, INTERVALS: INTERVALS, BW: BW, GYM: GYM,
    FOODS: FOODS, ED_NOTE: ED_NOTE, PRIVACY: PRIVACY, DISCLAIMER: DISCLAIMER, COLD_SAFETY: COLD_SAFETY,
    // Gumroad product_id(s) whose license keys unlock the full edition (Protocol + Personalized).
    // Public values (Gumroad product page → License key section). Empty = Gumroad keys can't unlock yet.
    GUMROAD_PRODUCT_IDS: [],
    // SHA-256 (hex) of ARC codes Thomas actually issued. The codes themselves never ship in the app,
    // so reading this file can't produce a working code. Add one: node tools/arc_code.js
    ARC_CODE_SHA256: []
  };
});
