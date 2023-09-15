import './letterSquare.css';

function LetterSquare({ letter, background = "aqua", selected = false, selectedColor = "aqua", disabled = false}) {
  return (
    <div className="square" style={{background, borderBottom: (selected) ? `5px solid ${selectedColor}` : "none"}}>
      <span className="letter" style={{color: disabled ? 'transparent' : '#0f0f0a'}}>{letter}</span>
    </div>
  );
}

export default LetterSquare;
