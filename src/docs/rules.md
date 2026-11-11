# Climb local game rules

This file records the rules used by the first playable local version. It resolves the open implementation questions in `data-model.md` so the game engine and computer players use the same behavior.

## Deck and opening play

- The deck has 52 standard cards and four distinct Jokers (56 cards total), dealt evenly as 14 cards per player.
- Standard rank order is 3 through 2, followed by BMJ, CMJ, BFJ, and CFJ for Joker comparisons.
- The player holding 3♠ starts. Their opening play must contain 3♠. Later leads do not need it.

## Combinations

- A single card, a same-rank pair, three of a kind, or four of a kind is a valid combination.
- Two Jokers form a pair only when they have the same gender. A Joker cannot be combined with a standard card.
- A sequence must contain exactly five standard cards of consecutive ranks. Jokers cannot be part of a sequence. Sequences do not wrap from 2 back to 3. A sequence does not care about suits or pairs within the combination; any five standard cards in consecutive order form a valid sequence.
- When leading (table is clear), a player can lead with any valid five-card sequence. When responding to a play on the table, a sequence can be thrown if the first (lowest) number in the sequence is bigger than the one on the table (whether responding to another sequence, a single card, a pair, or a triple). Equal rank values do not use suit as a tiebreaker.
- For other non-sequence responses, a response must match the combination type and card count of the play on the table, and beat it in rank value.

## Joker control

- A single Joker can only be countered by a higher single Joker.
- A double Joker can only be countered by a higher double Joker. The pair must still follow the same-gender rule.
- Other players continue in normal turn order and may pass or counter the Joker play.

## Passing and finishing

- When every other active player has passed, the last player who played leads the next trick.
- Finished players are skipped. If the last player who played has finished, the next active player clockwise receives the lead after all active players pass.
- Players finish in the order they empty their hands. The game ends after all four players finish so the full ranking is available.
