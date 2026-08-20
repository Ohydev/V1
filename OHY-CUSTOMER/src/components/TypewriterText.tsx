import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  words: string[];
  className?: string;
}

const TypewriterText = ({ words, className = '' }: TypewriterTextProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (isDeleting) {
        // Deleting characters
        setCurrentText(currentWord.substring(0, currentText.length - 1));
        
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      } else {
        // Typing characters
        setCurrentText(currentWord.substring(0, currentText.length + 1));
        
        if (currentText === currentWord) {
          // Wait before starting to delete
          setTimeout(() => setIsDeleting(true), 1200);
        }
      }
    }, isDeleting ? 60 : 80);

    return () => clearTimeout(timeout);
  }, [currentText, currentWordIndex, isDeleting, words]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 400);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={className}>
      {currentText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>
        |
      </span>
    </span>
  );
};

export default TypewriterText;