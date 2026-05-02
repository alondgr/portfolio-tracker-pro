import { useState, useEffect } from 'react';

export function useConversionTimer() {
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    // Check if the timer was already started in a previous session
    const savedStartTime = localStorage.getItem('ghost_timer_start');
    if (savedStartTime) {
      const startTime = parseInt(savedStartTime, 10);
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const threeMinutes = 180000;

      if (elapsed >= threeMinutes) {
        setShowSignupPrompt(true);
      } else {
        setTimerStarted(true);
        const remaining = threeMinutes - elapsed;
        const timeout = setTimeout(() => {
          setShowSignupPrompt(true);
        }, remaining);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  const startTimer = () => {
    if (timerStarted) return;
    
    const startTime = Date.now();
    localStorage.setItem('ghost_timer_start', startTime.toString());
    setTimerStarted(true);
    
    setTimeout(() => {
      setShowSignupPrompt(true);
    }, 180000); // 3 minutes
  };

  const resetTimer = () => {
    localStorage.removeItem('ghost_timer_start');
    setTimerStarted(false);
    setShowSignupPrompt(false);
  };

  return { showSignupPrompt, startTimer, resetTimer };
}
