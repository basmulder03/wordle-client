import LetterRow from './components/letterRow';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import { getRandomWord } from './chosen_words';
import goodAnswerLingo from "./sounds/lingo-goed-word.wav";

function App() {
  const [attempts, setAttempts] = useState([]);
  const [lastAttempt, setLastAttempt] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [giveUp, setGiveUp] = useState("")

  const childRef = useRef();

  useEffect(() => {
    const handleInput = (event) => {
      if (event.key === 'Enter') {
        handleEnter();
      }
  
      if (event.key === 'Backspace') {
        handleBackSpace();
      }
  
      if (event.code.match('Key[a-zA-Z]{1}')) {
        if (lastAttempt.length < 5) {
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

    window.addEventListener('keydown', handleInput);

    setup();

    return () => window.removeEventListener('keydown', handleInput);
  }, [lastAttempt])
  

  const handleWord = (word) => {
    if (word !== currentWord) {
      setLastAttempt("")
      const newList = [...attempts];
      newList.push(word);
      setAttempts(newList);
      setGiveUp("")
    } else {
      new Audio(goodAnswerLingo).play();
      setTimeout(resetGame, 5000);
    }
  }

  const setup = () => {
    if (!currentWord) setCurrentWord(getRandomWord());
  }

  const resetGame = () => {
    setAttempts([]);
    setLastAttempt("");
    setCurrentWord(getRandomWord())
  }

  const showAnswer = () => {
    setGiveUp(currentWord)
    resetGame();
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
      {
        attempts.map((a, i) => <LetterRow key={i} word={a} active={false} currentWord={currentWord} />)
      }
      {
        <LetterRow word={lastAttempt} currentWord={currentWord} ref={childRef} handleWord={handleWord} active={true} />
      }
    </div>
  );
}

export default App;
