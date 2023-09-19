import LetterRow, { COLOR_MAPPER, delayTime } from './components/letterRow';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import { getRandomWord } from './chosen_words';
import goodAnswerLingo from "./sounds/lingo-goed-word.wav";
import LetterSquare from './components/letterSquare';
import {words} from "./chosen_words";
import Alphabet from './components/alphabet';

function App() {
  const [attempts, setAttempts] = useState([]);
  const [lastAttempt, setLastAttempt] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [giveUp, setGiveUp] = useState("")
  const [wordLength, setWordLength] = useState(5);


  const childRef = useRef();
  const alphabetRef = useRef();

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
    alphabetRef.current.handleWord(result);
    if (currentWord === word) {
      new Audio(goodAnswerLingo).play();
      setTimeout(resetGame, 5000)
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

  const resetGame = () => {
    alphabetRef.current.resetAlphabet();
    setAttempts([]);
    setLastAttempt("");
    setCurrentWord(getRandomWord(wordLength));
  }

  const showAnswer = () => {
    if (giveUp === "") {
      setGiveUp(currentWord)
      setLastAttempt(currentWord)
      setTimeout(handleEnter, 500)
    }
  }

  const removeShownAnser = () => {
    setGiveUp("");
  }

  const changeWordLength = async (t) => {
    const len = Number(t.value);
    t.blur();
    setWordLength(len);
    setAttempts([]);
    setLastAttempt("");
    setCurrentWord(getRandomWord(len))
    alphabetRef.current.resetAlphabet();
  }

  return (
    <div className="App">
      <div className="fab_reset" onClick={resetGame}>New Game</div>
      <div className="fab_show_answer">
        <span onClick={showAnswer}>Give Up</span><br />
        {
          (giveUp.length) ? <span onClick={removeShownAnser}>{giveUp}</span> : null
        }
      </div>
      <div className="fab_select_length">
        <select onChange={(event) => changeWordLength(event.target)} value={wordLength}>
          {
            Object.keys(words).map(w => <option key={w} value={w}>Word with {w} letter{w > 1 ? 's' : null} ({words[w].length} possibilities)</option>)
          }
        </select>
      </div>
      <Alphabet ref={alphabetRef}/>
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
