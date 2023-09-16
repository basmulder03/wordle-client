import './letterSquare.css';

function LetterSquare({ letter, background = "aqua", selected = false, selectedColor = "aqua", disabled = false, noShadow = false}) {
  return (
    <div className="square" style={{background, borderBottom: (selected) ? `5px solid ${selectedColor}` : "none", boxShadow: !noShadow ? "inset 0 0 20px rgba(0, 0, 0, 0.25)" : "none"}}>
      <span className="letter" style={{color: disabled ? 'transparent' : '#0f0f0a'}}>{letter}</span>
    </div>
  );
}

export default LetterSquare;
