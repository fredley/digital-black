export function Letter({ letter, handleLetter }) {
  return (
    <li className="letter" onClick={() => handleLetter(letter)}>
      {letter}
    </li>
  );
}
