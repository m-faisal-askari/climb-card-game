# Hyperframes Composition Brief: Climb

## Objective
Create a short, polished launch-style brag video for Climb, a browser card game.

## Output
- Composition directory: `brag/composition/`
- Rendered video: `brag/brag.mp4`
- Format: vertical — 1080×1920
- Duration: 19.8 seconds

## Source Material
- Project root: `C:/Users/IT-HOME/Downloads/Projects/Program Files/Climb 0003/climb-card-game`
- Primary files read: `index.html`, `README.md`, `Product Overview.md`, `src/App.jsx`, `src/App.css`, `src/index.css`, `src/components/GameTable.jsx`, `src/components/PlayingCard.jsx`, `src/components/PlayerHand.jsx`, `src/components/ResultsScreen.jsx`, and `src/game/`
- Product name: Climb (page title: “Climb: Card Game”)
- Strongest grounded facts: one human and three computer opponents; a 56-card deck; an opening play must include 3♣; a Joker play requires a higher Joker play of the same size to counter it; the results screen offers “Play Again.”
- Key UI moments to recreate: four-player felt table and hand; selected 3♣ moving to the table; Joker counter; final standings.
- Copy that must appear verbatim:
  - “Climb”
  - “Must include 3♣.”
  - “Play Again”
- Use generic opponent labels, omit the developer footer, and do not include personal names or other user data.

## Creative Direction
- Tone preset: `default`
- Creative direction: polished tabletop showdown with a wink at the “quick hand” premise
- Interpretation: warm, clean, rhythmic, and lightly playful; let real game rules carry the story.
- Angle: A “quick hand” becomes a small showdown: one human plays a real card game against three computer opponents through a 56-card deck, a 3♣ opening rule, and higher-Joker counters.
- Hook: “JUST ONE QUICK HAND?” over an emerald felt table and a card fan.
- Outro / punchline: “CLIMB” followed by “Empty your hand. Climb the standings.” and the actual “Play Again” action.
- Avoid: generic SaaS copy, abstract filler visuals, unsupported performance claims, personal names, and unrelated visual redesign.

## Visual Identity
- Background: `radial-gradient(ellipse at 50% 35%, #0f2e21 0%, #081a13 50%, #030a07 100%)`
- Felt: `#0d462c`, `#083320`, `#052115`
- Text: `#f8fafc`
- Accent: `#fbbf24` (gold)
- Display font: Inter (closest bundled face to the source UI’s system UI stack), 900 weight for headlines
- Body font: Inter, 600–850 weight
- Visual references: actual card face and Joker art from `public/`; green felt table; white card surfaces; amber selection treatment; source UI’s player seats, opening rule, and results card.

## LOOK
LOOK: 9:16 at 1080×1920; a green felt table (#0f2e21, #0d462c, #083320, #052115) against near-black green (#030a07), white card faces (#ffffff), slate text (#f8fafc), and gold focal accents (#fbbf24); Inter 900 headline / Inter 600–850 supporting text, 28–92px; 2px gold hairlines; 20–28px card corners; 18–24px card depth; one centered tabletop subject; keep all readable copy and game UI within y=168–1330px. BANNED: abstract particles, teal/purple gradients, waveforms, tiny footer copy, personal names.

## Storyboard
Use `brag/brag-plan.md` as the creative contract.

1. One quick hand? — 2.8s — felt and card fan; “JUST ONE QUICK HAND?”
2. The table — 3.8s — four player seats/cards resolve; “ONE HUMAN. THREE COMPUTER OPPONENTS.” and “56-CARD DECK.”
3. The opening rule — 4.0s — select and play 3♣; “THE OPENING PLAY MUST INCLUDE 3♣.”
4. Joker counter — 4.2s — actual project Joker artwork; a higher Joker takes the lead.
5. Finish — 5.0s — anonymized standings, champion highlight, “CLIMB,” and “Play Again.”

## Audio
- Audio role: upbeat music bed with a few tactile card accents
- Audio arc: immediate low-volume groove, card fan and placements on the relevant motions, light results accent, fade music in the final second.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: 0.32 volume, quick fade-in, one-second fade-out; no voiceover.
- Music cue guidance: use `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (109.96 BPM). Major cue targets are 9.29s for the 3♣, 13.11s for the Joker counter, and 17.47s for standings. Sequential seat/card accents can follow the beat grid around 3.27, 3.82, 4.39, and 4.91s. These are timing hints; readability is primary.
- Audio-reactive treatment: `assets/music/audio-data.json` contains 30fps, 8-band extracted samples; use the sampled bass energy for a subtle 2–5% scale pulse on the felt/card or champion reveal. No waveform/equalizer graphics.
- Audio-coupled moments: the seat/card reveal, 3♣ placement, Joker counter, results rows.
- SFX selection guidance: choose card shuffle/slide/place sounds and a restrained finish accent; use the accompanying `assets/sfx/sfx-analysis.md` as sound-selection guidance. Keep repeated sounds soft and avoid bright, harsh accents.
- Audio files: local copies live under `brag/composition/assets/`.

## Hyperframes Instructions
Use the installed Hyperframes CLI v0.8.196 and its current composition contract. The source-project recreation, storyboard, and audio choices above are the creative brief. Keep every composition, media, cue, and render file under `brag/`. Use a paused timeline registered as `root`, with the required `data-composition-id`, `data-width`, and `data-height` attributes. Run `hyperframes check` before rendering, inspect rendered frames, and deliver locally; do not publish.
