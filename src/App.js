import LetterRow, { COLOR_MAPPER, delayTime } from './components/letterRow';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import { getRandomWord } from './chosen_words';
import goodAnswerLingo from "./sounds/lingo-goed-word.wav";
import LetterSquare from './components/letterSquare';
import {words} from "./chosen_words";

const alphabet = [
  { letter: "a", active: true, color: 'beige' },
  { letter: "b", active: true, color: 'beige' },
  { letter: "c", active: true, color: 'beige' },
  { letter: "d", active: true, color: 'beige' },
  { letter: "e", active: true, color: 'beige' },
  { letter: "f", active: true, color: 'beige' },
  { letter: "g", active: true, color: 'beige' },
  { letter: "h", active: true, color: 'beige' },
  { letter: "i", active: true, color: 'beige' },
  { letter: "j", active: true, color: 'beige' },
  { letter: "k", active: true, color: 'beige' },
  { letter: "l", active: true, color: 'beige' },
  { letter: "m", active: true, color: 'beige' },
  { letter: "n", active: true, color: 'beige' },
  { letter: "o", active: true, color: 'beige' },
  { letter: "p", active: true, color: 'beige' },
  { letter: "q", active: true, color: 'beige' },
  { letter: "r", active: true, color: 'beige' },
  { letter: "s", active: true, color: 'beige' },
  { letter: "t", active: true, color: 'beige' },
  { letter: "u", active: true, color: 'beige' },
  { letter: "v", active: true, color: 'beige' },
  { letter: "w", active: true, color: 'beige' },
  { letter: "x", active: true, color: 'beige' },
  { letter: "y", active: true, color: 'beige' },
  { letter: "z", active: true, color: 'beige' }
];

function App() {
  const [attempts, setAttempts] = useState([]);
  const [lastAttempt, setLastAttempt] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [giveUp, setGiveUp] = useState("")
  const [allLetters, setAllLetters] = useState([...alphabet])
  const [wordLength, setWordLength] = useState(5);

  const childRef = useRef();

  const handleInput = (event) => {
    if (event.key === 'Enter') {
      handleEnter();
    }

    if (event.key === 'Backspace') {
      handleBackSpace();
    }

    if (event.code.match('Key[a-zA-Z]{1}')) {
      if (lastAttempt.length < wordLength) {
        addLetter(event.key);
      }
    }
  }

  const handleEnter = () => {
    childRef.current.enterPressed();
  }

  const handleBackSpace = () => {
    if (lastAttempt.length) {
      setLastAttempt(lastAttempt.substring(0, lastAttempt.length - 1))
    }
  }

  const addLetter = (letter) => {
    setLastAttempt(lastAttempt + letter);
  }

  useEffect(() => {
    window.addEventListener('keydown', handleInput);

    setup();

    return () => window.removeEventListener('keydown', handleInput);
  }, [lastAttempt])


  const handleWord = (word, result) => {
      const allLetterLocal = [...allLetters];
      for (const letter of result) {
        const charIndex = allLetterLocal.findIndex(e => e.letter === letter.letter);
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
      setAllLetters(allLetterLocal);
    } 
    if (currentWord === word) {
      new Audio(goodAnswerLingo).play();
    } else {
      setLastAttempt("")
      const newList = [...attempts];
      newList.push(word);
      setAttempts(newList);
      setGiveUp("")
    }
  }

  const setup = () => {
    if (!currentWord) setCurrentWord(getRandomWord(wordLength));
  }

  const resetGame = async () => {
    await delayTime(5000)
    setAttempts([]);
    setLastAttempt("");
    setCurrentWord(getRandomWord(wordLength));
    setAllLetters([...alphabet]);
  }

  const showAnswer = () => {
    if (giveUp === "") {
      setGiveUp(currentWord)
      setLastAttempt(currentWord)
      setTimeout(handleEnter, 500)
    }
  }

  const changeWordLength = async (l) => {
    const len = Number(l);
    setWordLength(len);
    await delayTime(1000)
  }

  return (
    <div className="App">
      <div className="fab_reset" onClick={resetGame}>New Game</div>
      <div className="fab_show_answer">
        <span onClick={showAnswer}>Give Up</span><br />
        {
          (giveUp.length) ? giveUp : null
        }
      </div>
      <div className="fab_select_length">
        <select onChange={(event) => changeWordLength(event.target.value)} value={wordLength}>
          {
            Object.keys(words).map(w => <option key={w} value={w}>Word with {w} letter{w > 1 ? 's' : null} ({words[w].length} possibilities)</option>)
          }
        </select>
      </div>
      <div className="letters">
        {
          allLetters.map(char => (
            <div key={char.letter} className="cell">
              <LetterSquare letter={char.letter} background={char.color} selected={char.active} selectedColor={char.active ? "blue" : "none"} disabled={!char.active && char.color === 'beige'} />
            </div>
          )
          )
        }
      </div>
      {wordLength ? (<div className="wordle">
        {
          attempts.map((a, i) => <LetterRow key={i} word={a} active={false} currentWord={currentWord} index={i + 1} wordLength={wordLength} />)
        }
        {
          <LetterRow word={lastAttempt} currentWord={currentWord} ref={childRef} handleWord={handleWord} active={true} index={attempts.length + 1} wordLength={wordLength} />
        }
      </div>) : null
}
    </div>
  );
}

export default App;
