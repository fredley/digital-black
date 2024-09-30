import React from "react";
import {
  faArrowUp,
  faBackspace,
  faCheckDouble,
  faKeyboard,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Letter } from "./Letter";

export function Keyboard({
  handleLetter,
  handleBackspace,
  handleEnter,
  handleClear,
}) {
  const [showing, setShowing] = React.useState(false);

  const keyboard = ["1234567890", "QWERTYUIOP+", "ASDFGHJKL", "ZXCVBNM,."];

  return (
    <>
      {showing && (
        <div className="keyboardWrapper">
          <ul className="keyboardRow">
            {keyboard[0].split("").map((letter) => (
              <Letter
                letter={letter}
                key={letter}
                handleLetter={handleLetter}
              />
            ))}
            <li className="green" onClick={handleBackspace}>
              <FontAwesomeIcon icon={faBackspace} />
            </li>
          </ul>
          <ul className="keyboardRow">
            {keyboard[1].split("").map((letter) => (
              <Letter
                letter={letter}
                key={letter}
                handleLetter={handleLetter}
              />
            ))}
          </ul>
          <ul className="keyboardRow right">
            <li className="return" onClick={handleEnter}>
              +
            </li>
            {keyboard[2]
              .split("")
              .reverse()
              .map((letter) => (
                <Letter
                  letter={letter}
                  key={letter}
                  handleLetter={handleLetter}
                />
              ))}
          </ul>
          <ul className="keyboardRow">
            <li className="green">
              <FontAwesomeIcon icon={faArrowUp} />
            </li>
            {keyboard[3].split("").map((letter) => (
              <Letter
                letter={letter}
                key={letter}
                handleLetter={handleLetter}
              />
            ))}
            <li
              className="hide"
              onClick={() => {
                setShowing(false);
              }}
            >
              <FontAwesomeIcon icon={faKeyboard} />
            </li>
          </ul>
          <ul className="keyboardRow">
            <li
              className="green"
              onClick={() => {
                window.location.reload();
              }}
            >
              <FontAwesomeIcon icon={faSync} />
            </li>
            <li className="space green" onClick={() => handleLetter(" ")}></li>
            <li className="green" onClick={handleClear}>
              <FontAwesomeIcon icon={faCheckDouble} />
            </li>
          </ul>
        </div>
      )}
      {!showing && (
        <div
          id="show-keyboard"
          onClick={(e) => {
            setShowing(true);
          }}
        >
          <FontAwesomeIcon icon={faKeyboard} />
        </div>
      )}
    </>
  );
}
