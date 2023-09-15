import './letterSquare.css';

function LetterSquare({ letter, background = "aqua", selected = false}) {
  return (
    <div className="square" style={{background, borderBottom: (selected) ? "3px solid blue" : "none"}}>
      <span className="letter">{letter}</span>
    </div>
  );
}

export default LetterSquare;
