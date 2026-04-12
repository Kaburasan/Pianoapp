import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─────────────────────────────────────────────
// GLOBAL AUDIO CONTEXT (singleton, shared)
// ─────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playPianoNote(noteName, duration = 0.8) {
  const FREQS = {
    C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196.00,A3:220.00,B3:246.94,
    "C#3":138.59,"D#3":155.56,"F#3":185.00,"G#3":207.65,"A#3":233.08,
    C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392.00,A4:440.00,B4:493.88,
    "C#4":277.18,"D#4":311.13,"F#4":369.99,"G#4":415.30,"A#4":466.16,
    C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880.00,B5:987.77,
    "C#5":554.37,"D#5":622.25,"F#5":739.99,"G#5":830.61,"A#5":932.33,
  };
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const freq = FREQS[noteName] || 261.63;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const master = ctx.createGain();
    osc1.connect(gain1); gain1.connect(master);
    osc2.connect(gain2); gain2.connect(master);
    master.connect(ctx.destination);
    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2;
    const now = ctx.currentTime;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);
    osc1.start(now); osc1.stop(now + duration + 0.1);
    osc2.start(now); osc2.stop(now + duration + 0.1);
  } catch (e) {}
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const LEVELS = {
  explorer:   { label:"🌟 Explorer",   age:"3–5",  color:"#FF6B9D", grad:"135deg, #FF6B9D, #FF9F43" },
  adventurer: { label:"🚀 Adventurer", age:"5–7",  color:"#845EF7", grad:"135deg, #845EF7, #48DBFB" },
  musician:   { label:"🎵 Musician",   age:"7–10", color:"#20C997", grad:"135deg, #20C997, #845EF7" },
};

// Two full octaves C3–B4
const WHITE_KEYS = [
  {note:"C",oct:3},{note:"D",oct:3},{note:"E",oct:3},{note:"F",oct:3},{note:"G",oct:3},{note:"A",oct:3},{note:"B",oct:3},
  {note:"C",oct:4},{note:"D",oct:4},{note:"E",oct:4},{note:"F",oct:4},{note:"G",oct:4},{note:"A",oct:4},{note:"B",oct:4},
];
// afterIdx = index of white key this black key sits after (to its right)
const BLACK_KEY_MAP = [
  {note:"C#",oct:3,afterIdx:0},{note:"D#",oct:3,afterIdx:1},
  {note:"F#",oct:3,afterIdx:3},{note:"G#",oct:3,afterIdx:4},{note:"A#",oct:3,afterIdx:5},
  {note:"C#",oct:4,afterIdx:7},{note:"D#",oct:4,afterIdx:8},
  {note:"F#",oct:4,afterIdx:10},{note:"G#",oct:4,afterIdx:11},{note:"A#",oct:4,afterIdx:12},
];

const NOTE_COLORS = {C:"#FF6B9D",D:"#FF9F43",E:"#FECA57",F:"#48DBFB",G:"#1DD1A1",A:"#845EF7",B:"#FF6348"};
const NOTE_ANIMALS = {C:"🐱",D:"🐶",E:"🐸",F:"🐠",G:"🐢",A:"🦋",B:"🐦"};
const NOTE_FUN_NAME = {C:"Catty C",D:"Doggy D",E:"Effy E",F:"Fishy F",G:"Gerry G",A:"Ali A",B:"Birdy B"};

const SONGS = [
  {
    id:"twinkle", title:"Twinkle Twinkle", emoji:"⭐", level:"explorer",
    notes:["C4","C4","G4","G4","A4","A4","G4","F4","F4","E4","E4","D4","D4","C4"],
    timing:[500,500,500,500,500,500,900,500,500,500,500,500,500,900],
  },
  {
    id:"mary", title:"Mary Had a Lamb", emoji:"🐑", level:"explorer",
    notes:["E4","D4","C4","D4","E4","E4","E4","D4","D4","D4","E4","G4","G4"],
    timing:[400,400,400,400,400,400,700,400,400,700,400,400,900],
  },
  {
    id:"hotcross", title:"Hot Cross Buns", emoji:"🥐", level:"explorer",
    notes:["E4","D4","C4","E4","D4","C4","C4","C4","C4","C4","D4","D4","D4","D4","E4","D4","C4"],
    timing:[400,400,800,400,400,800,250,250,250,250,250,250,250,250,400,400,800],
  },
  {
    id:"baa", title:"Baa Baa Black Sheep", emoji:"🐏", level:"explorer",
    notes:["C4","C4","G4","G4","A4","A4","A4","A4","G4","F4","F4","E4","E4","D4","D4","C4"],
    timing:[400,400,400,300,300,300,300,300,700,400,300,300,300,300,300,800],
  },
  {
    id:"ode", title:"Ode to Joy", emoji:"🎶", level:"adventurer",
    notes:["E4","E4","F4","G4","G4","F4","E4","D4","C4","C4","D4","E4","E4","D4","D4"],
    timing:[400,400,400,400,400,400,400,400,400,400,400,400,550,250,800],
  },
  {
    id:"jingle", title:"Jingle Bells", emoji:"🔔", level:"adventurer",
    notes:["E4","E4","E4","E4","E4","E4","E4","G4","C4","D4","E4","F4","F4","F4","F4","F4","E4","E4","E4","E4","D4","D4","E4","D4","G4"],
    timing:[300,300,600,300,300,600,300,300,300,300,900,300,300,300,300,150,300,300,300,150,300,300,300,300,900],
  },
  {
    id:"cancan", title:"Can Can", emoji:"🩰", level:"adventurer",
    notes:["G4","G4","G4","E4","G4","G4","G4","E4","G4","A4","G4","F4","E4","F4","G4","C4","C4","C4"],
    timing:[200,200,400,400,200,200,400,400,200,200,200,200,200,200,400,200,200,600],
  },
  {
    id:"furelise", title:"Für Elise (intro)", emoji:"🎵", level:"musician",
    notes:["E5","D#5","E5","D#5","E5","B4","D5","C5","A4","C4","E4","A4","B4","E4","G#4","B4","C5"],
    timing:[300,300,300,300,300,300,300,300,500,300,300,300,500,300,300,300,700],
  },
  {
    id:"minuet", title:"Minuet in G", emoji:"👑", level:"musician",
    notes:["D4","G4","A4","B4","C5","B4","A4","C5","D5","G4","G4","D5","C5","B4","A4","G4"],
    timing:[400,400,400,400,400,400,800,400,400,400,400,400,400,400,400,900],
  },
];

const LESSONS = [
  {
    id:"meet-keys", title:"Meet the Keys!", emoji:"👋", levels:["explorer","adventurer","musician"],
    steps:[
      {text:"The piano has black and white keys. Today we meet the white ones!", icon:"🎹"},
      {text:"There are 7 special notes: C D E F G A B — just like the start of the alphabet!", icon:"🔤"},
      {text:"Each note has an animal friend! C = Catty 🐱, D = Doggy 🐶, E = Effy Frog 🐸…", icon:"🐱"},
      {text:"Find note C! It's always to the LEFT of 2 black keys grouped together.", icon:"🎯"},
    ],
  },
  {
    id:"finger-numbers", title:"Finger Numbers", emoji:"🖐️", levels:["explorer","adventurer","musician"],
    steps:[
      {text:"Each finger has a number. Your THUMB is finger 1!", icon:"👍"},
      {text:"Pointer = 2, Middle = 3, Ring = 4, Pinky = 5. Hold up your hand and count!", icon:"✌️"},
      {text:"Wiggle each finger one at a time and say its number out loud.", icon:"🎵"},
      {text:"Using the right finger for each note helps you play fast and without tangling!", icon:"⚡"},
    ],
  },
  {
    id:"posture", title:"Piano Posture", emoji:"🧍", levels:["explorer","adventurer","musician"],
    steps:[
      {text:"Sit up tall like a giraffe — proud but relaxed, not stiff!", icon:"🦒"},
      {text:"Feet flat on the floor or a stool. No dangling legs!", icon:"🦶"},
      {text:"Wrists up — imagine you're gently holding a soap bubble in each hand.", icon:"🫧"},
      {text:"Fingers curved softly — like petting a sleeping kitten 🐾", icon:"🐾"},
    ],
  },
  {
    id:"black-keys", title:"The Black Keys", emoji:"🖤", levels:["explorer","adventurer","musician"],
    steps:[
      {text:"Black keys come in groups of 2 and 3. Can you spot the pattern?", icon:"🔍"},
      {text:"The group of 2 black keys helps you find C — it's always just to their left!", icon:"🎯"},
      {text:"Black keys are called SHARPS (#) or FLATS (b). C# means 'C sharp' — a tiny step higher!", icon:"📈"},
      {text:"Try pressing the black keys! They have a darker, mysterious sound.", icon:"🌙"},
    ],
  },
  {
    id:"reading-notes", title:"Reading Music", emoji:"📝", levels:["adventurer","musician"],
    steps:[
      {text:"Music is written on 5 lines called a STAFF — like a climbing frame for notes!", icon:"🎼"},
      {text:"Notes sit ON lines or BETWEEN lines (spaces). Higher notes go higher on the staff.", icon:"📍"},
      {text:"Remember the lines: Every Good Boy Does Fine = E G B D F", icon:"🧠"},
      {text:"The spaces spell FACE — F A C E. Easy!", icon:"😊"},
    ],
  },
  {
    id:"rhythm", title:"Feel the Beat!", emoji:"🥁", levels:["adventurer","musician"],
    steps:[
      {text:"Music has a heartbeat called RHYTHM. Every song has one. Clap along to any song!", icon:"❤️"},
      {text:"Whole note = 4 beats. Half note = 2 beats. Quarter note = 1 beat.", icon:"🕐"},
      {text:"Clap this: CLAP……(4) clap…clap(2+2) clap.clap.clap.clap(1+1+1+1)", icon:"👏"},
      {text:"Practice counting 1-2-3-4 out loud while you play. It's the secret weapon!", icon:"🎶"},
    ],
  },
  {
    id:"scales", title:"The C Major Scale", emoji:"🪜", levels:["musician"],
    steps:[
      {text:"A scale is like a musical staircase — 8 notes going up, then back down.", icon:"🪜"},
      {text:"The C Major scale uses ONLY white keys: C D E F G A B C", icon:"⬜"},
      {text:"Finger pattern right hand: 1 2 3 | thumb under | 1 2 3 4 5. Thumb tucks under after finger 3!", icon:"🖐️"},
      {text:"Practise slowly, hands separately. Speed comes later — accuracy always first!", icon:"🐢"},
    ],
  },
  {
    id:"dynamics", title:"Loud & Soft (Dynamics)", emoji:"🔊", levels:["musician"],
    steps:[
      {text:"DYNAMICS means how loud or soft you play. It makes music come alive!", icon:"🎭"},
      {text:"FORTE (f) = loud and strong 💪. PIANO (p) = soft and gentle 🤫", icon:"🔊"},
      {text:"CRESCENDO means getting gradually LOUDER. DIMINUENDO = getting softer.", icon:"📈"},
      {text:"Try playing Twinkle softly at the start, then build louder to 'Little Star'!", icon:"⭐"},
    ],
  },
];

const THEORY_CARDS = {
  explorer: [
    {q:"What animal is note C? 🎹", a:"🐱 Catty C!\nAlways left of the 2 black keys."},
    {q:"How many white keys are in one octave?", a:"7 white keys!\nC  D  E  F  G  A  B"},
    {q:"Which finger is your thumb?", a:"Finger 1!\nThumb=1  Pointer=2  Middle=3\nRing=4  Pinky=5"},
    {q:"What animal is note G? 🎹", a:"🐢 Gerry the Turtle!\nCount up: C D E F G"},
    {q:"Name the 7 note animals!", a:"🐱C  🐶D  🐸E  🐠F\n🐢G  🦋A  🐦B"},
  ],
  adventurer: [
    {q:"What is a STAFF in music?", a:"5 horizontal lines!\nNotes sit on or between them."},
    {q:"What does FORTE mean?", a:"LOUD! 🔊\nFrom Italian — means strong."},
    {q:"What does PIANO mean in music?", a:"Soft and quiet 🤫\nAlso how the instrument got its name!"},
    {q:"What is a HALF NOTE worth?", a:"2 beats!\nWhole=4  Half=2  Quarter=1"},
    {q:"What do the staff LINES spell?", a:"Every Good Boy Does Fine\n= E  G  B  D  F"},
    {q:"What do the staff SPACES spell?", a:"F  A  C  E\nJust like the word FACE! 😊"},
  ],
  musician: [
    {q:"What is a CRESCENDO?", a:"Getting gradually LOUDER 📈\nOpposite: diminuendo (softer)."},
    {q:"What does ALLEGRO mean?", a:"Fast and lively! ⚡\nAllegretto = moderately fast."},
    {q:"What is an OCTAVE?", a:"8 notes — same note, higher pitch.\nC4 → C5 is one octave up."},
    {q:"What is a CHORD?", a:"3+ notes played together!\nC+E+G = C Major chord 🎵"},
    {q:"What does LEGATO mean?", a:"Smooth and connected 🌊\nOpposite: STACCATO = short & bouncy."},
    {q:"How many beats in 3/4 time?", a:"3 beats per bar!\nWaltz time — 1-2-3, 1-2-3 💃"},
  ],
};

const TEACHER_TIPS = [
  {
    title:"First Session Tips", emoji:"🌱",
    content:[
      "Keep it SHORT — 5–10 minutes is perfect for a 4-year-old.",
      "Start with free exploration, no rules, no wrong notes.",
      "Celebrate EVERY small win enthusiastically.",
      "End before boredom — always leave them wanting more!",
      "Let them bang freely to explore sound first.",
    ],
  },
  {
    title:"Building Good Habits", emoji:"🏗️",
    content:[
      "Consistency beats length — 5 min daily beats 1 hour weekly.",
      "Model posture yourself — kids learn by watching.",
      "Say 'I love hearing you practise!' not just 'Good job!'",
      "Make it a ritual — same time, same spot each day.",
      "Take monthly progress videos — showing them their own growth is magic.",
    ],
  },
  {
    title:"When They Struggle", emoji:"💪",
    content:[
      "Break hard passages into tiny pieces — even 2 notes at a time.",
      "'Slow is smooth, smooth is fast' — slow practice always first.",
      "If frustration rises, switch to something they already know well.",
      "Never force a session — it builds negative associations.",
      "Try 'teach a teddy bear' — explaining it to a toy helps them learn!",
    ],
  },
  {
    title:"Theory Made Fun", emoji:"🧩",
    content:[
      "Use coloured dot stickers on keys — one colour per note name.",
      "Make flashcards using the note animals from this app.",
      "Clap rhythms together in the car — no piano needed!",
      "Ask 'what does this music make you feel?' to build emotional connection.",
      "Sing the note names while they play — it sticks faster.",
    ],
  },
  {
    title:"Progress Milestones", emoji:"🏆",
    content:[
      "Age 4–5: Identifies C on keyboard; plays simple 5-note songs.",
      "Age 5–6: Uses finger numbers; plays hands separately.",
      "Age 6–7: Reads basic notation; plays both hands on simple songs.",
      "Age 7–9: Understands time signatures; learns scales; reads sheet music.",
      "Age 9+: Independent practice begins; explores preferred styles.",
    ],
  },
  {
    title:"Suggested Weekly Plan (Age 4–5)", emoji:"🗓️",
    content:[
      "Mon: Explore the keyboard freely — no rules! 🎲",
      "Tue: Learn one new note name + its animal friend 🐱",
      "Wed: Sing & clap a nursery rhyme rhythm 👏",
      "Thu: Practise one song — just 3 notes 🎵",
      "Fri: Theory flashcard game (3–5 cards) 🃏",
      "Sat: Free jam + mini concert for family! 🎤",
      "Sun: Rest day — music is everywhere ☀️",
    ],
  },
];

// ─────────────────────────────────────────────
// PIANO KEYBOARD (2 octaves, big keys)
// ─────────────────────────────────────────────
function PianoKeyboard({ level, highlightNote, onNotePlay, showLabels = true }) {
  const [pressed, setPressed] = useState({});
  const isExplorer = level === "explorer";
  const WK_W = 46, WK_H = 190, BK_W = 28, BK_H = 115;
  const totalW = WHITE_KEYS.length * WK_W;

  const handlePress = useCallback((fullNote) => {
    playPianoNote(fullNote);
    setPressed(p => ({ ...p, [fullNote]: true }));
    onNotePlay && onNotePlay(fullNote);
    setTimeout(() => setPressed(p => { const n = { ...p }; delete n[fullNote]; return n; }), 280);
  }, [onNotePlay]);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch" }}>
      <div style={{ position: "relative", width: totalW, height: WK_H + 12, margin: "0 auto",
        filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.18))" }}>
        {/* White keys */}
        {WHITE_KEYS.map(({ note, oct }, i) => {
          const fullNote = `${note}${oct}`;
          const isHL = highlightNote === fullNote;
          const isPr = !!pressed[fullNote];
          const col = NOTE_COLORS[note];
          return (
            <div key={fullNote + i} onPointerDown={e => { e.preventDefault(); handlePress(fullNote); }}
              style={{
                position: "absolute", left: i * WK_W, top: 0,
                width: WK_W - 2, height: WK_H,
                background: isPr ? col : isHL ? col + "BB" : "#FFFDF5",
                border: `1.5px solid ${isHL ? col : "#D8D0C0"}`,
                borderRadius: "0 0 10px 10px",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "flex-end", paddingBottom: 10,
                cursor: "pointer", zIndex: 1, userSelect: "none",
                transform: isPr ? "scaleY(0.97) translateY(3px)" : "none",
                boxShadow: isPr ? "none" : "0 5px 0 #B8AF9C",
                transition: "background 0.08s, transform 0.08s, box-shadow 0.08s",
              }}>
              {showLabels && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {isExplorer && <span style={{ fontSize: 16, lineHeight: 1 }}>{NOTE_ANIMALS[note]}</span>}
                  <span style={{ fontSize: isExplorer ? 11 : 10, fontWeight: 800,
                    color: isHL ? col : "#999", fontFamily: "'Fredoka One', cursive" }}>
                    {note}{!isExplorer ? oct : ""}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {/* Black keys */}
        {BLACK_KEY_MAP.map(({ note, oct, afterIdx }) => {
          const fullNote = `${note}${oct}`;
          const isPr = !!pressed[fullNote];
          const isHL = highlightNote === fullNote;
          return (
            <div key={fullNote} onPointerDown={e => { e.preventDefault(); handlePress(fullNote); }}
              style={{
                position: "absolute",
                left: (afterIdx + 1) * WK_W - BK_W / 2 - 1,
                top: 0, width: BK_W, height: BK_H,
                background: isPr ? "#777" : isHL ? "#555" : "#222",
                borderRadius: "0 0 7px 7px",
                cursor: "pointer", zIndex: 3, userSelect: "none",
                boxShadow: isPr ? "none" : "0 4px 0 #111",
                transform: isPr ? "translateY(3px)" : "none",
                transition: "background 0.08s, transform 0.08s, box-shadow 0.08s",
                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 5,
              }}>
              {!isExplorer && (
                <span style={{ fontSize: 8, color: "#aaa", fontWeight: 700 }}>
                  {note.replace("#","♯")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOTE EXPLORER
// ─────────────────────────────────────────────
function NoteExplorer({ level }) {
  const [lastNote, setLastNote] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const baseNote = lastNote ? lastNote.replace(/[#\d]/g, "").replace(/♯/g,"") : null;
  const isSharp = lastNote ? lastNote.includes("#") : false;

  const handlePlay = (note) => {
    setLastNote(note);
    setAnimKey(k => k + 1);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
      <p style={{ textAlign:"center", fontSize:15, color:"#666", maxWidth:420, margin:0 }}>
        Press any key! Each note has a name, colour, and a friend 🎹
      </p>
      <PianoKeyboard level={level} onNotePlay={handlePlay} showLabels />
      <div style={{ minHeight:110, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {lastNote && !isSharp && baseNote && NOTE_ANIMALS[baseNote] ? (
          <div key={animKey} style={{
            background:`${NOTE_COLORS[baseNote]}22`,
            border:`2.5px solid ${NOTE_COLORS[baseNote]}`,
            borderRadius:24, padding:"18px 40px", textAlign:"center",
            animation:"pop 0.3s cubic-bezier(.36,.07,.19,.97) both",
          }}>
            <div style={{ fontSize:44 }}>{NOTE_ANIMALS[baseNote]}</div>
            <div style={{ fontSize:22, fontWeight:800, color:NOTE_COLORS[baseNote], fontFamily:"'Fredoka One', cursive" }}>
              {NOTE_FUN_NAME[baseNote]}
            </div>
            <div style={{ fontSize:13, color:"#888", marginTop:4 }}>{lastNote}</div>
          </div>
        ) : lastNote ? (
          <div key={animKey} style={{ background:"#2D2D2D", borderRadius:20,
            padding:"16px 32px", textAlign:"center", animation:"pop 0.3s ease both" }}>
            <div style={{ fontSize:26, color:"#fff", fontWeight:900, fontFamily:"'Fredoka One', cursive" }}>
              {lastNote.replace("#","♯")}
            </div>
            <div style={{ fontSize:13, color:"#aaa", marginTop:4 }}>Sharp key ✨</div>
          </div>
        ) : (
          <div style={{ color:"#ccc", fontSize:15 }}>← Press a key above!</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SONG PLAYER
// ─────────────────────────────────────────────
function SongPlayer({ song, level }) {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState("demo");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef([]);

  const clearTimers = () => { timerRef.current.forEach(clearTimeout); timerRef.current = []; };

  const playDemo = () => {
    clearTimers(); setIsPlaying(true); setCompleted(false); setCurrentIdx(-1);
    let delay = 80;
    song.notes.forEach((note, i) => {
      const t = setTimeout(() => {
        setCurrentIdx(i);
        playPianoNote(note, (song.timing[i] || 400) / 1000 * 0.85);
      }, delay);
      timerRef.current.push(t);
      delay += (song.timing[i] || 400) + 60;
    });
    const end = setTimeout(() => { setIsPlaying(false); setCurrentIdx(-1); setCompleted(true); }, delay);
    timerRef.current.push(end);
  };

  const startPlay = () => {
    clearTimers(); setMode("play"); setCurrentIdx(0); setScore(0); setStreak(0); setCompleted(false);
  };

  const handleNotePlay = (note) => {
    if (mode !== "play" || completed) return;
    const idx = currentIdx < 0 ? 0 : currentIdx;
    if (idx >= song.notes.length) return;
    if (note === song.notes[idx]) {
      const ns = streak + 1;
      setStreak(ns);
      setScore(s => s + 10 + (ns >= 3 ? 5 : 0));
      const next = idx + 1;
      setCurrentIdx(next);
      if (next >= song.notes.length) setCompleted(true);
    }
  };

  useEffect(() => () => clearTimers(), []);

  const hlIdx = currentIdx >= 0 && currentIdx < song.notes.length ? currentIdx : -1;
  const highlightNote = hlIdx >= 0 ? song.notes[hlIdx] : null;
  const progress = mode === "play" && currentIdx > 0
    ? Math.round((currentIdx / song.notes.length) * 100) : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => { setMode("demo"); setCompleted(false); setCurrentIdx(-1); setIsPlaying(false); clearTimers(); }}
          style={{ padding:"9px 22px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:800, fontSize:14,
            background:mode==="demo"?"#FF6B9D":"#F0F0F0", color:mode==="demo"?"#fff":"#555", transition:"all 0.2s" }}>
          👀 Watch Demo
        </button>
        <button onClick={startPlay}
          style={{ padding:"9px 22px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:800, fontSize:14,
            background:mode==="play"?"#845EF7":"#F0F0F0", color:mode==="play"?"#fff":"#555", transition:"all 0.2s" }}>
          🎹 I'll Play!
        </button>
      </div>

      {mode === "demo" && (
        <button onClick={playDemo} disabled={isPlaying}
          style={{ padding:"12px 36px", borderRadius:24, border:"none", cursor:isPlaying?"default":"pointer",
            background:isPlaying?"#CCC":"linear-gradient(135deg,#FF6B9D,#845EF7)",
            color:"#fff", fontWeight:900, fontSize:16,
            boxShadow:isPlaying?"none":"0 4px 16px rgba(132,94,247,0.3)" }}>
          {isPlaying ? "♪ Playing…" : "▶  Play Demo"}
        </button>
      )}

      {mode === "play" && !completed && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:13, color:"#888" }}>
            Note {Math.min(Math.max(currentIdx,0)+1, song.notes.length)} / {song.notes.length}
          </div>
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:6 }}>
            <span style={{ fontWeight:800, fontSize:20, color:"#845EF7" }}>⭐ {score}</span>
            {streak >= 3 && <span style={{ fontWeight:800, fontSize:16, color:"#FF6B9D" }}>🔥 ×{streak}</span>}
          </div>
          <div style={{ width:280, height:8, background:"#F0F0F0", borderRadius:4, marginTop:8, overflow:"hidden" }}>
            <div style={{ width:`${progress}%`, height:"100%",
              background:"linear-gradient(90deg,#FF6B9D,#845EF7)", borderRadius:4, transition:"width 0.2s" }} />
          </div>
        </div>
      )}

      <PianoKeyboard level={level} highlightNote={highlightNote} onNotePlay={handleNotePlay} showLabels />

      {/* Note strip */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center", maxWidth:520 }}>
        {song.notes.map((note, i) => {
          const base = note.replace(/[#\d]/g,"");
          const playIdx = currentIdx < 0 ? 0 : currentIdx;
          const done = mode==="play" ? i < playIdx : (isPlaying && i < currentIdx);
          const active = (mode==="demo" ? currentIdx : playIdx) === i && (mode==="play" || currentIdx>=0);
          return (
            <div key={i} style={{
              width:30, height:30, borderRadius:8, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:10, fontWeight:800,
              background:done ? (NOTE_COLORS[base]||"#845EF7") : active ? (NOTE_COLORS[base]||"#845EF7")+"55" : "#F0F0F0",
              color:done?"#fff":active?"#444":"#bbb",
              border:active?`2px solid ${NOTE_COLORS[base]||"#845EF7"}`:"2px solid transparent",
              transition:"all 0.15s",
            }}>
              {note.replace(/\d/,"")}
            </div>
          );
        })}
      </div>

      {completed && (
        <div style={{ background:"linear-gradient(135deg,#FF6B9D15,#845EF715)",
          border:"2px solid #FF6B9D", borderRadius:20, padding:"18px 32px",
          textAlign:"center", animation:"fadeIn 0.4s ease" }}>
          <div style={{ fontSize:36 }}>🎉</div>
          <div style={{ fontWeight:900, fontSize:18, color:"#FF6B9D" }}>
            {mode==="play" ? `Brilliant! You scored ${score} points!` : "That's how it sounds!"}
          </div>
          <div style={{ fontSize:13, color:"#888", marginTop:4 }}>
            {mode==="demo" ? "Now try playing it yourself →" : "Play again to beat your score!"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LESSON VIEWER
// ─────────────────────────────────────────────
function LessonViewer({ lesson, onClose }) {
  const [step, setStep] = useState(0);
  const cur = lesson.steps[step];
  const isLast = step === lesson.steps.length - 1;

  return (
    <div style={{ background:"#fff", borderRadius:28, padding:32,
      boxShadow:"0 24px 64px rgba(0,0,0,0.12)", maxWidth:480, width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <span style={{ fontSize:20, fontWeight:900, fontFamily:"'Fredoka One', cursive", color:"#333" }}>
          {lesson.emoji} {lesson.title}
        </span>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#bbb" }}>✕</button>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {lesson.steps.map((_,i) => (
          <div key={i} style={{ flex:1, height:6, borderRadius:3,
            background:i<=step?"#FF6B9D":"#F0F0F0", transition:"background 0.3s" }} />
        ))}
      </div>
      <div style={{ textAlign:"center", padding:"32px 20px",
        background:"linear-gradient(135deg,#FFF0F6,#F3F0FF)", borderRadius:20, marginBottom:24,
        minHeight:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>{cur.icon}</div>
        <p style={{ fontSize:17, lineHeight:1.65, color:"#444", fontWeight:600, margin:0 }}>{cur.text}</p>
      </div>
      <div style={{ display:"flex", gap:12, justifyContent:"space-between" }}>
        <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}
          style={{ padding:"11px 24px", borderRadius:16, border:"2px solid #E0E0E0",
            background:"none", cursor:step===0?"default":"pointer",
            color:step===0?"#ccc":"#888", fontWeight:800 }}>← Back</button>
        {isLast
          ? <button onClick={onClose} style={{ padding:"11px 32px", borderRadius:16, border:"none",
              background:"linear-gradient(135deg,#FF6B9D,#845EF7)", color:"#fff",
              fontWeight:900, fontSize:15, cursor:"pointer" }}>✅ Done!</button>
          : <button onClick={() => setStep(s => s+1)} style={{ padding:"11px 32px", borderRadius:16,
              border:"none", background:"#FF6B9D", color:"#fff", fontWeight:900, fontSize:15, cursor:"pointer" }}>
              Next →
            </button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// THEORY FLASHCARDS — fixed prev/next wrap
// ─────────────────────────────────────────────
function TheoryCards({ level }) {
  const cards = THEORY_CARDS[level] || THEORY_CARDS.explorer;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Always keep idx clamped when cards change
  const safeIdx = Math.min(idx, cards.length - 1);

  const prev = () => { setIdx(i => (i <= 0 ? cards.length - 1 : i - 1)); setFlipped(false); };
  const next = () => { setIdx(i => (i >= cards.length - 1 ? 0 : i + 1)); setFlipped(false); };
  const goTo = (i) => { setIdx(i); setFlipped(false); };

  const card = cards[safeIdx];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <div style={{ fontSize:13, color:"#888" }}>Card {safeIdx+1} of {cards.length}</div>
      <div onClick={() => setFlipped(f => !f)} style={{
        width:320, minHeight:190, borderRadius:24, cursor:"pointer",
        background:flipped
          ?"linear-gradient(135deg,#845EF7,#FF6B9D)"
          :"linear-gradient(135deg,#FF6B9D,#FF9F43)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:28, textAlign:"center",
        boxShadow:"0 12px 40px rgba(0,0,0,0.15)",
        transition:"background 0.35s ease",
      }}>
        <div style={{ color:"#fff", fontWeight:700, fontSize:17, lineHeight:1.6, whiteSpace:"pre-line" }}>
          {flipped ? card.a : card.q}
          {!flipped && <div style={{ marginTop:14, fontSize:12, opacity:0.75 }}>👆 Tap to reveal!</div>}
        </div>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={prev}
          style={{ padding:"10px 24px", borderRadius:16, border:"2px solid #E0E0E0",
            background:"none", cursor:"pointer", fontWeight:800, color:"#666" }}>← Prev</button>
        <button onClick={next}
          style={{ padding:"10px 24px", borderRadius:16, border:"none",
            background:"#845EF7", color:"#fff", cursor:"pointer", fontWeight:800 }}>Next →</button>
      </div>
      <div style={{ display:"flex", gap:7 }}>
        {cards.map((_,i) => (
          <div key={i} onClick={() => goTo(i)} style={{
            width:9, height:9, borderRadius:"50%", cursor:"pointer",
            background:i===safeIdx?"#845EF7":"#DDD", transition:"background 0.2s",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEACHER SECTION
// ─────────────────────────────────────────────
function TeacherSection() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"linear-gradient(135deg,#FFF8E7,#FFF0F6)",
        borderRadius:20, padding:"18px 22px", border:"2px solid #FFD43B" }}>
        <div style={{ fontSize:19, fontWeight:900, marginBottom:6 }}>👩‍🏫 Teacher's Corner</div>
        <p style={{ fontSize:14, color:"#666", lineHeight:1.65, margin:0 }}>
          Everything you need to guide your child's piano journey — no musical experience required.
          Just patience, enthusiasm, and 10 minutes a day!
        </p>
      </div>
      {TEACHER_TIPS.map((tip, i) => (
        <div key={i} style={{ background:"#fff", borderRadius:20,
          border:`2px solid ${open===i?"#845EF7":"#F0F0F0"}`, overflow:"hidden", transition:"border 0.2s" }}>
          <button onClick={() => setOpen(open===i ? null : i)}
            style={{ width:"100%", padding:"15px 20px", background:"none", border:"none",
              cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:15, fontWeight:900, color:"#333" }}>{tip.emoji} {tip.title}</span>
            <span style={{ fontSize:22, color:"#845EF7", transition:"transform 0.2s",
              display:"inline-block", transform:open===i?"rotate(90deg)":"none" }}>›</span>
          </button>
          {open===i && (
            <ul style={{ margin:0, padding:"0 20px 18px 36px" }}>
              {tip.content.map((item,j) => (
                <li key={j} style={{ marginBottom:9, fontSize:14, color:"#555", lineHeight:1.6 }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function PianoApp() {
  const [level, setLevel] = useState("explorer");
  const [tab, setTab] = useState("explore");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);

  const lvl = LEVELS[level];

  const filteredLessons = useMemo(() =>
    LESSONS.filter(l => l.levels.includes(level)), [level]);

  const filteredSongs = useMemo(() => {
    if (level === "explorer") return SONGS.filter(s => s.level === "explorer");
    if (level === "adventurer") return SONGS.filter(s => s.level !== "musician");
    return SONGS;
  }, [level]);

  const unlockAudio = () => {
    try { getAudioCtx().resume(); } catch (e) {}
  };

  const switchLevel = (k) => {
    setLevel(k);
    setSelectedSong(null);
    setSelectedLesson(null);
  };

  const switchTab = (t) => {
    setTab(t);
    setSelectedSong(null);
  };

  const TABS = [
    { id:"explore",  label:"🎹 Explore" },
    { id:"lessons",  label:"📚 Learn" },
    { id:"songs",    label:"🎵 Songs" },
    { id:"theory",   label:"🃏 Theory" },
    { id:"teacher",  label:"👩‍🏫 Parent" },
  ];

  // ── Lesson full-screen view ──
  if (selectedLesson) {
    return (
      <div onPointerDown={unlockAudio}
        style={{ minHeight:"100vh", background:"#FAF8FF",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:20, fontFamily:"'Nunito', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`* { box-sizing:border-box; } button { font-family:'Nunito',sans-serif; }`}</style>
        <LessonViewer lesson={selectedLesson} onClose={() => {
          setCompletedLessons(c => [...new Set([...c, selectedLesson.id])]);
          setSelectedLesson(null);
        }} />
      </div>
    );
  }

  return (
    <div onPointerDown={unlockAudio}
      style={{ minHeight:"100vh", background:"#FAF8FF", fontFamily:"'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        * { box-sizing:border-box; }
        button { font-family:'Nunito',sans-serif; }
        ::-webkit-scrollbar { height:4px; width:4px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background:`linear-gradient(${lvl.grad})`, padding:"18px 20px 14px", textAlign:"center" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", letterSpacing:2, textTransform:"uppercase", marginBottom:2 }}>
          🎹 Little Piano Star
        </div>
        <div style={{ fontSize:28, fontWeight:900, color:"#fff", fontFamily:"'Fredoka One', cursive", letterSpacing:1 }}>
          Piano Adventure
        </div>
        <div style={{ display:"flex", gap:7, justifyContent:"center", marginTop:12, flexWrap:"wrap" }}>
          {Object.entries(LEVELS).map(([key, val]) => (
            <button key={key} onClick={() => switchLevel(key)}
              style={{ padding:"6px 16px", borderRadius:18,
                border:`2px solid ${level===key?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)"}`,
                background:level===key?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.15)",
                color:level===key?val.color:"#fff",
                fontWeight:900, fontSize:12, cursor:"pointer", transition:"all 0.2s" }}>
              {val.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:5 }}>Age {lvl.age}</div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", background:"#fff", boxShadow:"0 2px 10px rgba(0,0,0,0.07)", overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)}
            style={{ flex:"0 0 auto", padding:"13px 16px", border:"none", background:"none",
              cursor:"pointer", whiteSpace:"nowrap", fontWeight:800, fontSize:13,
              color:tab===t.id?lvl.color:"#aaa",
              borderBottom:`3px solid ${tab===t.id?lvl.color:"transparent"}`,
              transition:"all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding:"24px 16px", maxWidth:660, margin:"0 auto" }}>

        {tab === "explore" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#333" }}>🎹 Free Explore</div>
              <p style={{ fontSize:14, color:"#888", marginTop:4 }}>Press any key and discover the sounds!</p>
            </div>
            <NoteExplorer level={level} />
          </div>
        )}

        {tab === "lessons" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#333" }}>📚 Lessons</div>
              <p style={{ fontSize:14, color:"#888", marginTop:4 }}>
                {filteredLessons.length} lessons for {lvl.label}
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
              {filteredLessons.map(lesson => {
                const done = completedLessons.includes(lesson.id);
                return (
                  <button key={lesson.id} onClick={() => setSelectedLesson(lesson)}
                    style={{ background:done?`${lvl.color}12`:"#fff",
                      border:`2px solid ${done?lvl.color:"#F0F0F0"}`,
                      borderRadius:20, padding:"16px 20px", textAlign:"left",
                      cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
                    <span style={{ fontSize:30 }}>{lesson.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:900, fontSize:15, color:"#333" }}>{lesson.title}</div>
                      <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{lesson.steps.length} steps</div>
                    </div>
                    {done && <span style={{ fontSize:18 }}>✅</span>}
                    <span style={{ color:"#ccc", fontSize:20 }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "songs" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {selectedSong ? (
              <div>
                <button onClick={() => setSelectedSong(null)}
                  style={{ background:"none", border:"none", color:"#888", cursor:"pointer",
                    fontWeight:800, marginBottom:16, fontSize:14 }}>← All Songs</button>
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:32 }}>{selectedSong.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"#333" }}>{selectedSong.title}</div>
                  <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
                    {selectedSong.notes.length} notes · {LEVELS[selectedSong.level]?.label}
                  </div>
                </div>
                <SongPlayer song={selectedSong} level={level} />
              </div>
            ) : (
              <div>
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:"#333" }}>🎵 Songs to Play</div>
                  <p style={{ fontSize:14, color:"#888", marginTop:4 }}>
                    {filteredSongs.length} songs unlocked at your level
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                  {filteredSongs.map(song => (
                    <button key={song.id} onClick={() => setSelectedSong(song)}
                      style={{ background:"#fff", border:"2px solid #F0F0F0", borderRadius:20,
                        padding:"16px 20px", textAlign:"left", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
                      <span style={{ fontSize:30 }}>{song.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:15, color:"#333" }}>{song.title}</div>
                        <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
                          {song.notes.length} notes · {LEVELS[song.level]?.label}
                        </div>
                      </div>
                      <span style={{ color:"#ccc", fontSize:20 }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "theory" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#333" }}>🃏 Theory Cards</div>
              <p style={{ fontSize:14, color:"#888", marginTop:4 }}>
                {(THEORY_CARDS[level]||[]).length} cards for {lvl.label} — tap to reveal!
              </p>
            </div>
            {/* key=level forces remount + fresh state when level changes */}
            <TheoryCards key={level} level={level} />
          </div>
        )}

        {tab === "teacher" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <TeacherSection />
          </div>
        )}

      </div>
    </div>
  );
}
