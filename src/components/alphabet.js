import { forwardRef, useState, useImperativeHandle } from "react";
import { COLOR_MAPPER } from "./letterRow";
import LetterSquare from "./letterSquare";
import './alphabet.css'

const alphabet = [
    { letter: "a", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "b", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "c", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "d", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "e", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "f", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "g", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "h", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "i", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "j", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "k", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "l", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "m", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "n", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "o", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "p", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "q", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "r", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "s", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "t", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "u", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "v", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "w", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "x", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "y", active: true, color: COLOR_MAPPER.BACKGROUND },
    { letter: "z", active: true, color: COLOR_MAPPER.BACKGROUND }
  ];

const Alphabet = forwardRef((props, ref) => {
    const [allLetters, setAllLetters] = useState([...alphabet]);

    const handleWord = (result) => {
        const allLetterLocal = [...allLetters];
        for (const letter of result) {
            const charIndex = allLetterLocal.findIndex(e => e.letter.toLowerCase() === letter.letter.toLowerCase());
            switch (letter.color) {
                case COLOR_MAPPER.DEFAULT:
                if (allLetterLocal[charIndex].color === COLOR_MAPPER.BACKGROUND) {
                    allLetterLocal[charIndex].color = COLOR_MAPPER.BACKGROUND;
                    allLetterLocal[charIndex].active = false;
                }
                break;
                case COLOR_MAPPER.CORRECT_LETTER:
                  allLetterLocal[charIndex].color = COLOR_MAPPER.CORRECT_LETTER;
                  allLetterLocal[charIndex].active = false;
                break;
                case COLOR_MAPPER.CORRECT_POSITION:
                  allLetterLocal[charIndex].color = COLOR_MAPPER.CORRECT_POSITION;
                  allLetterLocal[charIndex].active = false;
                break;
                default:
                  console.log(letter.color)
            }
        } 
        setAllLetters(allLetterLocal);
    }

    const resetAlphabet = () => {
        setAllLetters(JSON.parse(JSON.stringify([...alphabet])));
    }

    useImperativeHandle(ref, () => ({
        handleWord,
        resetAlphabet
       }))

    return (
        
      <div className="letters">
      {
        allLetters.map(char => (
          <div key={char.letter} className="cell">
            <LetterSquare letter={char.letter} background={char.color} selected={char.active} selectedColor={char.active ? "blue" : "none"} disabled={!char.active && char.color === COLOR_MAPPER.BACKGROUND} />
          </div>
        )
        )
      }
    </div>
    )
});

export default Alphabet;