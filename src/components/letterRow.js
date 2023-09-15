import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import LetterSquare from "./letterSquare";
import './letterRow.css';
import { checkIfWordValid } from "../words";
import letterBeeps from "../sounds/mixkit-censorship-beep-1082.wav";
import wrongAnswerBuzzer from "../sounds/Wrong-answer-sound-effect.mp3";

const delayTime = (time) => new Promise(resolve => setTimeout(() => resolve(), time))


const word_length = 5;

const LetterRow = forwardRef(({word, currentWord, handleWord, active, index = 1}, ref) => {
   const [wordState, setWordState] = useState([]); 

   const enterPressed = async () => {
    if (word.length === 5) {
      if (checkIfWordValid(word)) {
        const localWordState = await checkWord();
        handleWord(word, localWordState);
      }
      else {
        new Audio(wrongAnswerBuzzer).play()
        const localWordState = [...wordState];
        for (const element of localWordState) {
          element.color = COLOR_MAPPER.INVALID;
        }
        setWordState(localWordState);
      }
    }
   }

   const checkWord = async () => {
    const letters = currentWord.split('');
    const localWordState = [...wordState];
    const availableLetters = [...letters];
    for (let i = 0; i < word.length; i++) {
      localWordState[i] = {
        key: i,
        letter: word[i],
        color: letters[i] === word[i] ? COLOR_MAPPER.CORRECT_POSITION : COLOR_MAPPER.DEFAULT,
        selected: false
      };
      if (letters[i] === word[i]) {
        availableLetters.splice(availableLetters.indexOf(word[i]), 1)
      }
    }
    for (let i = 0; i < word.length; i++) {
      if (localWordState[i].color !== COLOR_MAPPER.CORRECT_POSITION) {
        if (availableLetters.includes(word[i])) {
          localWordState[i].color = COLOR_MAPPER.CORRECT_LETTER;
          availableLetters.splice(availableLetters.indexOf(word[i]), 1);
        }
      }
    }
    if (active) {
      for (let i = 0; i < localWordState.length; i++) {
        await updateStateAtIndex(localWordState, i);
      }
      new Audio(letterBeeps).play()
    }
    setWordState(localWordState)
    return localWordState;
   }

   const updateStateAtIndex = async (newState, index) => {
      const currentState = [...wordState];
      new Audio(letterBeeps).play()
      await delayTime(200);
      for (let i = 0; i <= index; i++) {
        currentState[i] = newState[i];
        currentState[i].selected = false;
      }
      currentState[index].selected = true;
      setWordState(currentState);
   }

   useImperativeHandle(ref, () => ({
    enterPressed
   }))

  useEffect(() => {
      if (word.length <= word_length) { 
          const newWordState = [];
          for (let i = 0; i < word.length; i++) {
              newWordState.push({
                  key: i,
                  letter: word[i],
                  color: COLOR_MAPPER.DEFAULT,
                  selected: false
              })
          }
          for (let i = word.length; i < word_length; i++) {
              newWordState.push({
                  key: i,
                  letter: "",
                  color: COLOR_MAPPER.DEFAULT,
                  selected: false
              })
          }
          setWordState(newWordState);
      }
      if (!active) checkWord();
    }, [word])

  return (
    <div className="row">
      <LetterSquare letter={`${index}.`} background="beige" selected={false} />
      {
        wordState.map(ws => <LetterSquare key={ws.key} letter={ws.letter} background={ws.color} selected={ws.selected} />)
      }
    </div>
  );
});

export const COLOR_MAPPER = {
  DEFAULT: "aqua",
  CORRECT_LETTER: "yellow",
  CORRECT_POSITION: "green",
  INVALID: "red"
}

export default LetterRow;
