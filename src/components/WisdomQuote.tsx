"use client";

import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const QUOTES = [
  "Time in the market beats timing the market.",
  "Be fearful when others are greedy, and greedy when others are fearful.",
  "The stock market is a device for transferring money from the impatient to the patient.",
  "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.",
  "In the short run, the market is a voting machine but in the long run, it is a weighing machine.",
  "Invest for the long haul. Don't get too greedy and don't get too scared.",
  "The most important quality for an investor is temperament, not intellect.",
  "Behind every stock is a company. Find out what it's doing.",
  "Risk comes from not knowing what you're doing.",
  "An investment in knowledge pays the best interest."
];

export default function WisdomQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Change quote every 2 minutes (120,000 ms)
    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);
      
      // Wait for fade out, change quote, fade in
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setIsVisible(true);
      }, 500); // 500ms matches transition duration
      
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-fintech-card/50 border border-fintech-border rounded-2xl backdrop-blur-sm max-w-2xl mx-auto shadow-sm">
      <Quote size={20} className="text-fintech-accent opacity-70 shrink-0" />
      <p 
        className={`text-sm italic font-medium text-slate-300 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        "{QUOTES[quoteIndex]}"
      </p>
    </div>
  );
}
