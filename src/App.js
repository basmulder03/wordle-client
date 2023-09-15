import LetterRow from './components/letterRow';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import { getRandomWord } from './words';

function App() {
  const [attempts, setAttempts] = useState([]);
  const [lastAttempt, setLastAttempt] = useState("");
  const [currentWord, setCurrentWord] = useState("");

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
    }
  }

  const setup = () => {
    if (!currentWord) setCurrentWord(getRandomWord())
  }

  return (
    <div className="App">
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
