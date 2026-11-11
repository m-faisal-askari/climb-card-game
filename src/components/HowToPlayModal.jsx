import { useEffect, useState } from "react";
import PlayingCard from "./PlayingCard.jsx";
import cards from "../game/cards.js";
import soundManager from "../game/sounds.js";

const getCard = (id) => cards.find((c) => c.id === id);

// Sample cards for visual demonstrations
const card3Spades = getCard("spades-3");
const card4Hearts = getCard("hearts-4");
const card5Diamonds = getCard("diamonds-5");
const card6Clubs = getCard("clubs-6");
const card7Spades = getCard("spades-7");

const cardAceHearts = getCard("hearts-A");
const card2Spades = getCard("spades-2");

const bmjCard = getCard("BMJ");
const cmjCard = getCard("CMJ");
const bfjCard = getCard("BFJ");
const cfjCard = getCard("CFJ");

const pair7Hearts = getCard("hearts-7");
const pair7Diamonds = getCard("diamonds-7");

const HowToPlayModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        soundManager.playButtonClick();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  const handleTabClick = (tabId) => {
    soundManager.playButtonClick();
    setActiveTab(tabId);
  };

  return (
    <div
      className="guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div className="guide-modal">
        {/* Header */}
        <div className="guide-header">
          <div className="guide-title-group">
            <span className="guide-badge">Game Guide & Rulebook</span>
            <h2 id="how-to-play-title" className="guide-title">
              How to Play Climb
            </h2>
          </div>
          <button
            type="button"
            className="guide-close-btn"
            onClick={handleClose}
            aria-label="Close Guide (Esc)"
            title="Close Guide (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="guide-tabs no-scrollbar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`guide-tab-btn ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => handleTabClick("overview")}
          >
            <span>🎯 Overview</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "hierarchy"}
            className={`guide-tab-btn ${activeTab === "hierarchy" ? "is-active" : ""}`}
            onClick={() => handleTabClick("hierarchy")}
          >
            <span>🂠 Card Hierarchy</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "combinations"}
            className={`guide-tab-btn ${activeTab === "combinations" ? "is-active" : ""}`}
            onClick={() => handleTabClick("combinations")}
          >
            <span>⚔️ Combinations & 5-Card Sequences</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "jokers"}
            className={`guide-tab-btn ${activeTab === "jokers" ? "is-active" : ""}`}
            onClick={() => handleTabClick("jokers")}
          >
            <span>🃏 Joker Control</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "flow"}
            className={`guide-tab-btn ${activeTab === "flow" ? "is-active" : ""}`}
            onClick={() => handleTabClick("flow")}
          >
            <span>🔄 Turns & Passing</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="guide-body no-scrollbar">
          {/* TAB 1: Overview */}
          {activeTab === "overview" && (
            <div className="guide-section">
              <div className="guide-hero-banner">
                <span className="hero-emoji">🏆</span>
                <div>
                  <h3 className="guide-h3">The Objective</h3>
                  <p className="guide-p">
                    Climb is a strategic four-player climbing and shedding card game.
                    Your goal is to <strong>empty your entire hand first</strong> before your three
                    computer opponents (Dave, Grace, and Lily).
                  </p>
                </div>
              </div>

              <div className="guide-grid-2">
                <div className="guide-box">
                  <h4 className="guide-h4">🎴 The 56-Card Deck</h4>
                  <ul className="guide-list">
                    <li><strong>52 Standard Cards:</strong> 4 suits (♠, ♥, ♦, ♣) in ranks 3 through 2.</li>
                    <li><strong>4 Unique Custom Jokers:</strong> 2 Male Jokers and 2 Female Jokers.</li>
                    <li><strong>14 Cards Dealt:</strong> Each of the 4 players begins with exactly 14 cards.</li>
                  </ul>
                </div>

                <div className="guide-box">
                  <h4 className="guide-h4">🥇 Finishing Positions</h4>
                  <ul className="guide-list">
                    <li><strong>1st to empty hand:</strong> Champion 🥇</li>
                    <li><strong>2nd to empty hand:</strong> 2nd Place 🥈</li>
                    <li><strong>3rd to empty hand:</strong> 3rd Place 🥉</li>
                    <li><strong>Remaining player:</strong> 4th Place</li>
                  </ul>
                </div>
              </div>

              <div className="guide-box guide-highlight-box mt-3">
                <h4 className="guide-h4">⚡ Core Climbing Mechanic</h4>
                <p className="guide-p">
                  Players take turns playing cards in clockwise order. To challenge the cards on the table,
                  you must play a <strong>stronger legal combination</strong> or choose to <strong>Pass</strong>.
                  When every active opponent passes, the trick clears and whoever won the table leads the next trick!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Card Hierarchy */}
          {activeTab === "hierarchy" && (
            <div className="guide-section">
              <h3 className="guide-h3">Card Rank Hierarchy (Lowest to Highest)</h3>
              <p className="guide-p">
                In Climb, standard rank order is <strong>3 as the lowest rank</strong> up to{" "}
                <strong>2 as the highest standard rank</strong>, followed by the 4 powerful Jokers:
              </p>

              {/* Ladder visual */}
              <div className="rank-ladder-container no-scrollbar">
                <div className="rank-ladder">
                  <span className="rank-chip rank-low">3 (Lowest)</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">4</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">5</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">6</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">7</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">8</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">9</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">10</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">J</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">Q</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">K</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip">A</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip rank-high">2 (High)</span>
                  <span className="ladder-arrow">→</span>
                  <span className="rank-chip rank-joker">Jokers (Top)</span>
                </div>
              </div>

              {/* Visual Card Row */}
              <div className="guide-cards-row-wrapper mt-4">
                <h4 className="guide-h4 mb-2">Key Landmark Cards</h4>
                <div className="guide-cards-row">
                  <div className="guide-card-item">
                    <div className="guide-card-preview">
                      {card3Spades && <PlayingCard card={card3Spades} />}
                    </div>
                    <span className="guide-card-label">3♠ (Opening Card)</span>
                    <span className="guide-card-sub">Rank Value: 1</span>
                  </div>

                  <div className="guide-card-item">
                    <div className="guide-card-preview">
                      {cardAceHearts && <PlayingCard card={cardAceHearts} />}
                    </div>
                    <span className="guide-card-label">A♥ (Ace)</span>
                    <span className="guide-card-sub">Rank Value: 12</span>
                  </div>

                  <div className="guide-card-item">
                    <div className="guide-card-preview">
                      {card2Spades && <PlayingCard card={card2Spades} />}
                    </div>
                    <span className="guide-card-label">2♠ (Highest Standard)</span>
                    <span className="guide-card-sub">Rank Value: 13</span>
                  </div>

                  <div className="guide-card-item">
                    <div className="guide-card-preview">
                      {bmjCard && <PlayingCard card={bmjCard} />}
                    </div>
                    <span className="guide-card-label">BMJ (Male)</span>
                    <span className="guide-card-sub">Rank Value: 14</span>
                  </div>

                  <div className="guide-card-item">
                    <div className="guide-card-preview">
                      {cfjCard && <PlayingCard card={cfjCard} />}
                    </div>
                    <span className="guide-card-label">CFJ (Colored Female)</span>
                    <span className="guide-card-sub">Rank Value: 17 (Top)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Combinations & Sequences */}
          {activeTab === "combinations" && (
            <div className="guide-section">
              <h3 className="guide-h3">Valid Combinations</h3>

              <div className="guide-combo-block">
                <div className="combo-meta">
                  <h4 className="guide-h4 text-amber-300">1. Single Card</h4>
                  <p className="guide-p">Any single card. Beaten by a higher single card.</p>
                </div>
                <div className="guide-card-preview small">
                  {cardAceHearts && <PlayingCard card={cardAceHearts} />}
                </div>
              </div>

              <div className="guide-combo-block">
                <div className="combo-meta">
                  <h4 className="guide-h4 text-amber-300">2. Pair (Double)</h4>
                  <p className="guide-p">Two cards of the exact same rank. Beaten by a higher pair.</p>
                </div>
                <div className="guide-card-preview-group small">
                  {pair7Hearts && <PlayingCard card={pair7Hearts} />}
                  {pair7Diamonds && <PlayingCard card={pair7Diamonds} />}
                </div>
              </div>

              <div className="guide-combo-block">
                <div className="combo-meta">
                  <h4 className="guide-h4 text-amber-300">3. Three of a Kind (Triple) & Four of a Kind</h4>
                  <p className="guide-p">Three or four cards sharing the identical rank.</p>
                </div>
              </div>

              {/* 5-CARD SEQUENCE FEATURE */}
              <div className="guide-box guide-highlight-box mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⚡</span>
                  <h4 className="guide-h4 text-emerald-400 text-lg">
                    The 5-Card Sequence Rule
                  </h4>
                </div>
                <p className="guide-p mb-3">
                  A sequence consists of <strong>exactly five cards</strong> in consecutive rank order
                  (e.g., 3-4-5-6-7, 4-5-6-7-8, ..., 10-J-Q-K-A, or J-Q-K-A-2).
                </p>

                <div className="guide-cards-row justify-start mb-3">
                  <div className="guide-card-preview small">
                    {card3Spades && <PlayingCard card={card3Spades} />}
                  </div>
                  <div className="guide-card-preview small">
                    {card4Hearts && <PlayingCard card={card4Hearts} />}
                  </div>
                  <div className="guide-card-preview small">
                    {card5Diamonds && <PlayingCard card={card5Diamonds} />}
                  </div>
                  <div className="guide-card-preview small">
                    {card6Clubs && <PlayingCard card={card6Clubs} />}
                  </div>
                  <div className="guide-card-preview small">
                    {card7Spades && <PlayingCard card={card7Spades} />}
                  </div>
                </div>

                <ul className="guide-list">
                  <li>
                    <strong>Exactly 5 Cards:</strong> A sequence cannot have 4, 6, or more cards. It must be exactly five consecutive cards.
                  </li>
                  <li>
                    <strong>Suits Don't Matter:</strong> Any suits or card types can be mixed together in the sequence.
                  </li>
                  <li>
                    <strong>No Wrapping:</strong> Sequences cannot wrap from 2 back to 3 (e.g. Q-K-A-2-3 is invalid). Jokers cannot be part of a sequence.
                  </li>
                  <li>
                    <strong>In Lead:</strong> If you are in lead (table is clear), you can throw any legal 5-card sequence!
                  </li>
                  <li>
                    <strong>Beating Table Plays:</strong> A sequence can be thrown if the <strong>first (lowest) number</strong> in your sequence is strictly higher than the one on the table (whether beating a sequence, a single card, or a pair on the table)!
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Joker Control */}
          {activeTab === "jokers" && (
            <div className="guide-section">
              <h3 className="guide-h3">The Four Jokers & Joker Control</h3>
              <p className="guide-p">
                The four Jokers are the most powerful cards in Climb. They follow strict gender pairing
                and trumping rules:
              </p>

              {/* Jokers Display */}
              <div className="guide-cards-row mt-3 mb-4">
                <div className="guide-card-item">
                  <div className="guide-card-preview">
                    {bmjCard && <PlayingCard card={bmjCard} />}
                  </div>
                  <span className="guide-card-label font-bold text-slate-200">BMJ (14)</span>
                  <span className="guide-card-sub">B&W Male Joker</span>
                </div>

                <div className="guide-card-item">
                  <div className="guide-card-preview">
                    {cmjCard && <PlayingCard card={cmjCard} />}
                  </div>
                  <span className="guide-card-label font-bold text-amber-300">CMJ (15)</span>
                  <span className="guide-card-sub">Colored Male Joker</span>
                </div>

                <div className="guide-card-item">
                  <div className="guide-card-preview">
                    {bfjCard && <PlayingCard card={bfjCard} />}
                  </div>
                  <span className="guide-card-label font-bold text-slate-200">BFJ (16)</span>
                  <span className="guide-card-sub">B&W Female Joker</span>
                </div>

                <div className="guide-card-item">
                  <div className="guide-card-preview">
                    {cfjCard && <PlayingCard card={cfjCard} />}
                  </div>
                  <span className="guide-card-label font-bold text-amber-300">CFJ (17)</span>
                  <span className="guide-card-sub">Colored Female Joker</span>
                </div>
              </div>

              <div className="guide-grid-2">
                <div className="guide-box">
                  <h4 className="guide-h4 text-amber-300">Single Joker Rules</h4>
                  <ul className="guide-list">
                    <li>Played as a single card.</li>
                    <li><strong>Joker Counter:</strong> A single Joker can <em>only</em> be countered by a higher single Joker.</li>
                    <li>No standard card or sequence can beat a Joker.</li>
                  </ul>
                </div>

                <div className="guide-box">
                  <h4 className="guide-h4 text-amber-300">Double Joker (Same-Gender)</h4>
                  <ul className="guide-list">
                    <li>Two Jokers form a pair <strong>only if they share the same gender</strong>:
                      <ul>
                        <li>Male Pair: <code>BMJ + CMJ</code></li>
                        <li>Female Pair: <code>BFJ + CFJ</code></li>
                      </ul>
                    </li>
                    <li>Female Pair beats Male Pair!</li>
                    <li>Mixed-gender pairs (e.g. BMJ + BFJ) are invalid.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Turns & Passing */}
          {activeTab === "flow" && (
            <div className="guide-section">
              <h3 className="guide-h3">Turns, Passing & Game Flow</h3>

              <div className="guide-box mb-3">
                <h4 className="guide-h4 text-amber-300">♠️ The Opening Play (Turn 1)</h4>
                <p className="guide-p">
                  The player dealt the <strong>3 of Spades (3♠)</strong> starts the game.
                  Their opening play <strong>must contain the 3♠</strong> (for example, as a single 3♠,
                  a pair of 3s including 3♠, or a 3-4-5-6-7 sequence containing 3♠).
                </p>
              </div>

              <div className="guide-box mb-3">
                <h4 className="guide-h4 text-amber-300">🔄 Passing & Leading Tricks</h4>
                <ul className="guide-list">
                  <li><strong>Passing:</strong> You may pass your turn if you cannot or choose not to beat the cards on the table. Passing does not remove you from the round.</li>
                  <li><strong>Clearing the Table:</strong> When all other active players pass consecutively, the trick is completed and cleared.</li>
                  <li><strong>The Lead:</strong> The last player who successfully played cards wins the trick and leads the next trick with any combination of their choice!</li>
                </ul>
              </div>

              <div className="guide-box guide-highlight-box">
                <h4 className="guide-h4 text-emerald-400">⌨️ Keyboard Shortcuts</h4>
                <div className="guide-shortcuts-grid">
                  <div className="shortcut-item">
                    <kbd>P</kbd> or <kbd>Esc</kbd>
                    <span>Pause / Resume Game</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>M</kbd>
                    <span>Toggle Sound Effects</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>H</kbd>
                    <span>Open / Close How to Play Guide</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="guide-footer">
          <div className="flex flex-col gap-0.5">
            <span className="guide-tip-text">
              💡 Pro-Tip: Save pairs and 2s for late in a trick to seize the lead!
            </span>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Askari Labs. All rights reserved. · Developed by Faisal Askari
            </span>
          </div>
          <button
            type="button"
            className="btn-action btn-play is-ready guide-got-it-btn"
            onClick={handleClose}
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayModal;