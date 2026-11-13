# Brag Plan: Climb

## What is this app?
Climb is a browser card game where one person sheds cards against three computer opponents in a four-player game.

## The angle
Treat a “quick hand” like a tiny tabletop showdown: a richly green felt table, crisp white cards, and a gold-lit 3♣ that starts the game. The playful tension comes from the real rules—three computer opponents, a 56-card deck, and Jokers that can be countered by higher Jokers—not from invented product claims.

## Hook (first 2–3 seconds)
“JUST ONE QUICK HAND?” lands over the Climb tabletop as a fan of cards snaps into frame. The question is a light setup; the table and cards identify the actual game immediately.

## Key moments (the middle)
- Four player seats resolve into one human and three computer opponents; a compact “56-card deck” stamp grounds the game in its real deck.
- The 3♣ lifts from the player’s hand and moves to the felt beside the source UI’s opening-play rule: “Must include 3♣.”
- A Joker play lands, then a higher Joker slides over it to show the counter rule.

## Outro / punchline
The results screen stacks the four finishing places, then resolves to “CLIMB” and the real “Play Again” action. The closing thought is “Empty your hand. Climb the standings.”

## User flow worth showing
Start with a dealt hand at the four-player table → select and play a valid combination (including the 3♣ in the opening play) while the computers take turns → see the finishing standings and choose “Play Again.”

## Tone
- Preset: `default`
- Creative direction: a polished tabletop showdown with a wink at the “quick hand” premise
- Interpretation: Warm, clean motion and readable copy; use the game’s dark felt, crisp cards, and restrained gold highlights, with card sounds and a light rhythmic music bed.

## Format: vertical — 1080×1920
## Duration: 19.8 seconds

## Visual identity (from the project)
- Background: `radial-gradient(ellipse at 50% 35%, #0f2e21 0%, #081a13 50%, #030a07 100%)`
- Accent: `#fbbf24` (gold); felt uses `#0d462c`, `#083320`, and `#052115`
- Text: `#f8fafc`
- Display font: Inter (the closest bundled face to the source UI’s system UI stack), heavy weight for headlines
- Body font: Inter
- Strongest visual element: the emerald felt table, white playing cards, gold selection state, and four-player layout

## Share copy (draft)
Climb: one human, three computer opponents, and a 56-card deck. One quick hand, they said. Music: Sascha Ende, ende.app (CC BY 4.0); card SFX: Kenney.

## Audio direction
- Role: upbeat rhythmic bed with a few motion-matched card accents
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`, a bright, clean groove
- Music treatment: start at 0s around 0.32 volume; fade in quickly and fade out over the final second. Let major card and results reveals land near strong cues where readability allows.
- Music cue guidance: bundled preset at `composition/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; 109.96 BPM. Strong cue targets: 9.29s for the 3♣ play, 13.11s for the Joker counter, and 17.47s for the standings reveal. Seat/card accents may follow the beat grid near 3.27, 3.82, 4.39, and 4.91s.
- Audio-reactive treatment: subtle; let the felt table and winning card scale breathe by 2–5% from the extracted music-energy samples, with no waveform graphics.
- SFX posture: moderate and tactile; a quiet shuffle, card slides/placements, and a restrained finish accent
- Audio-coupled moments: four player-seat/card reveals; the 3♣ play; the higher-Joker counter; results rows settling
- Restraint rule: no narration, no constant clicks, and no strobing or loud impact over the cards.

## Storyboard

### Scene 1 — One quick hand? — 2.8s
Open on a close view of emerald felt. A fan of white playing cards slides in, with one card catching the gold selection glow. Headline: “JUST ONE QUICK HAND?” Small product wordmark: “CLIMB.”
Sequential/interaction: yes — cards fan into the frame, then settle; no cursor.
Audio intent: friendly invitation with one soft shuffle and a card-slide accent.
Audio-coupled idea: the card fan lands on the opening beat.
Music: upbeat groove begins immediately at low volume.
Transition mood: clean push-in → Scene 2

### Scene 2 — The table — 3.8s
Show the real four-seat table idea in a vertical composition: the human hand at the bottom and three opponent seats around the felt. Copy: “ONE HUMAN. / THREE COMPUTER OPPONENTS.” Add a quiet “56-CARD DECK” chip. Use generic labels (“YOU,” “COMPUTER 1–3”) instead of personal names.
Sequential/interaction: yes — four seat markers and card backs appear one by one; settle the full table before the copy exits.
Audio intent: card-fan texture, with one restrained sound per meaningful seat reveal.
Audio-coupled idea: seat/card accents follow nearby beats around 3.27–4.91s; keep the full text held for reading.
Music: steady under the reveal.
Transition mood: clean slide → Scene 3

### Scene 3 — The opening rule — 4.0s
Recreate the source game table and hand with a clearly readable 3♣. Lift the 3♣ from the hand and place it at center; show a simplified “Play Selected” control. Copy: “THE OPENING PLAY MUST INCLUDE 3♣.” A smaller felt badge reads “Opening Play.”
Sequential/interaction: yes — a selected 3♣ rises from the hand, then slides to the center like the real play action.
Audio intent: a crisp card placement signals the legal opening move.
Audio-coupled idea: land the 3♣ reveal near the 9.29s strong cue; keep the rule settled on screen.
Music: groove continues without ducking.
Transition mood: direct cut on the card landing → Scene 4

### Scene 4 — Joker counter — 4.2s
Show two actual Joker card artworks from the project on the felt. First Joker lands; a higher Joker follows and takes the lead. Copy: “A JOKER PLAY? / ONLY A HIGHER JOKER CAN BEAT IT.”
Sequential/interaction: yes — first card lands, a beat of space, then the higher Joker slides over it.
Audio intent: two tactile card placements and one small, bright accent for the counter.
Audio-coupled idea: time the counter near the 13.11s strong cue; the two card motions may use the nearby beat grid while the sentence remains readable.
Music: warm rhythmic bed under a slightly more dramatic card move.
Transition mood: fast card wipe → Scene 5

### Scene 5 — Finish — 5.0s
Recreate the source results card with four anonymized rows and a highlighted champion row, then settle the real “Play Again” button below. Close on “CLIMB” and “Empty your hand. Climb the standings.”
Sequential/interaction: yes — standings rows arrive in order and the champion highlight resolves; the button gets a final quiet glow.
Audio intent: a soft finish accent; let the last chord ring as the music fades.
Audio-coupled idea: begin the standings resolve near the 17.47s strong cue, with row accents on nearby beats.
Music: fade out during the final second; no extra voice or narration.
Transition mood: clean hold to end

**Music mood for this video:** upbeat, polished tabletop energy
**Audio summary:** A light groove carries a tactile card fan, two key plays, and a restrained standings payoff.

## Step 1 rubric answers
1. **What is the app?** A four-player browser-based card-shedding game: one human against three computer opponents.
2. **Funniest or most impressive claim?** The grounded hook is the “quick hand” framing against three opponents; the strongest product fact is the 56-card deck and special Joker counter rule.
3. **Visual hook?** Deep green felt, white cards, and a gold selected-card glow.
4. **What should be shown?** The working table, the 3♣ opening play, a Joker counter, and the finishing standings.
5. **Shortest satisfying video?** About 20 seconds gives the opening setup, two rule moments, and a results payoff.
6. **Tone?** `default`; clean, playful tabletop drama.
7. **Audio?** A bright groove with soft shuffle, placement, and finish accents.
8. **Share caption?** “Climb: one human, three computer opponents, and a 56-card deck. One quick hand, they said.”
9. **User flow?** Dealt hand → select/play or pass against the computers → results and Play Again.

## Source and privacy notes
The project is a React/Vite game with no marketing landing page. This video recreates actual UI ideas and uses the source’s opening-play rule, Joker rule, result action, palette, and card artwork. Any standings shown are a staged example; opponent labels are generic. The developer footer and personal names are omitted.
