const faceCardImages = {
  "J-spades": "/Jack of spades.png",
  "Q-spades": "/Queen of Spades.png",
  "K-spades": "/King of spades.png",
  "J-hearts": "/Jack of Hearts.png",
  "Q-hearts": "/Queen of Hearts.png",
  "K-hearts": "/King of Hearts.png",
  "J-diamonds": "/Jack of diamonds.png",
  "Q-diamonds": "/Queen of diamonds.png",
  "K-diamonds": "/king of diamonds.png",
  "J-clubs": "/Jack of Clubs.png",
  "Q-clubs": "/Queen of Clubs.png",
  "K-clubs": "/King of Clubs.png",
};

function getJokerImagePath(card) {
  const { color, gender } = card.meta;
  if (color === "black-and-white" && gender === "male") {
    return "/black and white male joker.png";
  }
  if (color === "colored" && gender === "male") {
    return "/Colored male joker.png";
  }
  if (color === "black-and-white" && gender === "female") {
    return "/Black and White female joker.png";
  }
  return "/Colored Female Joker.png";
}

function CornerLabel({ card, className = "" }) {
  return (
    <div
      className={`corner-label flex flex-col items-center leading-none font-bold select-none tracking-tight ${className}`}
    >
      <span className="text-[0.9em] leading-tight">{card.rank}</span>
      <span className="text-[0.75em] leading-none mt-[-0.05em]">{card.suit.symbol}</span>
    </div>
  );
}

function CardSurface({ card, isSelected, onClick, className = "", children }) {
  const cardClassName = `card ${className} ${isSelected ? "selected" : ""}`;
  const description =
    card.type === "joker"
      ? `${card.meta.color} ${card.meta.gender} Joker`
      : `${card.rank} of ${card.suit.id}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={cardClassName}
        onClick={onClick}
        aria-label={description}
        aria-pressed={isSelected}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cardClassName} role="img" aria-label={description}>
      {children}
    </div>
  );
}

function PipPattern({ count, symbol }) {
  if (count === 2) {
    return (
      <div className="flex flex-col justify-between items-center h-[60%] text-[1.1em] leading-none py-0.5 select-none pointer-events-none">
        <span>{symbol}</span>
        <span className="rotate-180">{symbol}</span>
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="flex flex-col justify-between items-center h-[64%] text-[1.1em] leading-none py-0.5 select-none pointer-events-none">
        <span>{symbol}</span>
        <span>{symbol}</span>
        <span className="rotate-180">{symbol}</span>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 justify-between items-center w-[48%] h-[58%] text-[1.05em] leading-none select-none pointer-events-none">
        <span className="justify-self-start">{symbol}</span>
        <span className="justify-self-end">{symbol}</span>
        <span className="justify-self-start rotate-180">{symbol}</span>
        <span className="justify-self-end rotate-180">{symbol}</span>
      </div>
    );
  }

  if (count === 5) {
    return (
      <div className="relative w-[48%] h-[60%] select-none pointer-events-none">
        <div className="grid grid-cols-2 justify-between items-center w-full h-full text-[1.05em] leading-none">
          <span className="justify-self-start">{symbol}</span>
          <span className="justify-self-end">{symbol}</span>
          <span className="justify-self-start rotate-180">{symbol}</span>
          <span className="justify-self-end rotate-180">{symbol}</span>
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-[1.05em] leading-none">
          {symbol}
        </span>
      </div>
    );
  }

  const cols = count >= 9 ? 3 : 2;
  return (
    <div
      className={`grid ${cols === 3 ? "grid-cols-3 gap-x-1" : "grid-cols-2 gap-x-2"} gap-y-0.5 justify-items-center items-center max-w-[62%] max-h-[62%] text-[0.92em] leading-none select-none pointer-events-none`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i >= Math.floor(count / 2) ? "rotate-180" : ""}>
          {symbol}
        </span>
      ))}
    </div>
  );
}

function PlayingCard({ card, isSelected = false, onClick }) {
  if (card.type === "joker") {
    const isColored = card.meta.color === "colored";
    const jokerTextColor = isColored ? "text-amber-800" : "text-slate-800";

    return (
      <CardSurface card={card} isSelected={isSelected} onClick={onClick}>
        <div
          className={`absolute top-[4%] left-[5%] flex flex-col items-center leading-none select-none text-[0.52em] font-black tracking-tight ${jokerTextColor}`}
        >
          <span>J</span>
          <span>O</span>
          <span>K</span>
          <span>E</span>
          <span>R</span>
        </div>
        <img
          src={getJokerImagePath(card)}
          alt=""
          className="w-[62%] h-[62%] object-contain select-none pointer-events-none drop-shadow-sm"
        />
        <div
          className={`absolute bottom-[4%] right-[5%] rotate-180 flex flex-col items-center leading-none select-none text-[0.52em] font-black tracking-tight ${jokerTextColor}`}
        >
          <span>J</span>
          <span>O</span>
          <span>K</span>
          <span>E</span>
          <span>R</span>
        </div>
      </CardSurface>
    );
  }

  const isRed = card.suit.color === "red";
  const suitColorClass = isRed ? "card-suit-red" : "card-suit-black";
  const faceCardPath = faceCardImages[`${card.rank}-${card.suit.id}`];

  if (faceCardPath) {
    return (
      <CardSurface
        card={card}
        isSelected={isSelected}
        onClick={onClick}
        className={suitColorClass}
      >
        <span className="absolute top-[4%] left-[5%]">
          <CornerLabel card={card} />
        </span>
        <img
          src={faceCardPath}
          alt=""
          className="w-[62%] h-[62%] object-contain select-none pointer-events-none drop-shadow-sm"
        />
        <span className="absolute bottom-[4%] right-[5%] rotate-180">
          <CornerLabel card={card} />
        </span>
      </CardSurface>
    );
  }

  const pipCount = card.rank === "A" ? 1 : Number(card.rank);

  return (
    <CardSurface
      card={card}
      isSelected={isSelected}
      onClick={onClick}
      className={suitColorClass}
    >
      <span className="absolute top-[4%] left-[5%]">
        <CornerLabel card={card} />
      </span>
      {card.rank === "A" ? (
        <span className="text-[2.6em] leading-none select-none pointer-events-none drop-shadow-sm">
          {card.suit.symbol}
        </span>
      ) : (
        <PipPattern count={pipCount} symbol={card.suit.symbol} />
      )}
      <span className="absolute bottom-[4%] right-[5%] rotate-180">
        <CornerLabel card={card} />
      </span>
    </CardSurface>
  );
}

export default PlayingCard;
