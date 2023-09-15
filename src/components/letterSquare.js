import './letterSquare.css';

function LetterSquare({ letter, background = "aqua", selected = false, selectedColor = "aqua"}) {
  return (
    <div className="square" style={{background, borderBottom: (selected) ? `5px solid ${selectedColor}` : "none"}}>
      <span className="letter">{letter}</span>
    </div>
  );
}

export default LetterSquare;
