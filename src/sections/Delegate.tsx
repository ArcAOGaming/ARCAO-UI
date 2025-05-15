import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Delegate2ArcAO from '../components/Delegate2ArcAO';

// Set this to false to disable the countdown and show the delegate component normally
const SHOW_COUNTDOWN = true;

// Target date: Friday, May 23rd 2025, 8AM Eastern Time
const TARGET_DATE = new Date('2025-05-23T08:00:00-04:00').getTime();

const CountdownContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  color: white;
  font-family: 'Roboto Mono', monospace;
  backdrop-filter: blur(4px);
`;

const CountdownTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #00aaff;
  text-shadow: 0 0 10px rgba(0, 170, 255, 0.7);
  animation: glow 1.5s ease-in-out infinite alternate;

  @keyframes glow {
    from {
      text-shadow: 0 0 10px rgba(0, 170, 255, 0.7);
    }
    to {
      text-shadow: 0 0 20px rgba(0, 170, 255, 1.0), 0 0 30px rgba(0, 170, 255, 0.8);
    }
  }
`;

const CountdownTimer = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
`;

const CountdownUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CountdownValue = styled.div`
  font-size: 5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #00aaff, #00ff6c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  min-width: 120px;
  text-align: center;
`;

const CountdownLabel = styled.div`
  font-size: 1.2rem;
  text-transform: uppercase;
  color: #aaa;
  letter-spacing: 2px;
`;

const CountdownMessage = styled.p`
  font-size: 1.5rem;
  max-width: 800px;
  text-align: center;
  line-height: 1.6;
  color: #ddd;
  margin: 0 2rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  border-radius: 1rem;
`;

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const CountdownComponent: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = TARGET_DATE - new Date().getTime();
    let timeLeft: TimeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <CountdownContainer>
      <CountdownTitle>Coming Soon</CountdownTitle>
      <CountdownTimer>
        <CountdownUnit>
          <CountdownValue>{timeLeft.days}</CountdownValue>
          <CountdownLabel>Days</CountdownLabel>
        </CountdownUnit>
        <CountdownUnit>
          <CountdownValue>{timeLeft.hours}</CountdownValue>
          <CountdownLabel>Hours</CountdownLabel>
        </CountdownUnit>
        <CountdownUnit>
          <CountdownValue>{timeLeft.minutes}</CountdownValue>
          <CountdownLabel>Minutes</CountdownLabel>
        </CountdownUnit>
        <CountdownUnit>
          <CountdownValue>{timeLeft.seconds}</CountdownValue>
          <CountdownLabel>Seconds</CountdownLabel>
        </CountdownUnit>
      </CountdownTimer>
      <CountdownMessage>
        ARCAO Delegation will be available on Friday, May 23rd at 8:00 AM Eastern Time. 
        Please check back then to participate. You can see a preview of the delegation interface behind this overlay.
      </CountdownMessage>
    </CountdownContainer>
  );
};

const Delegate: React.FC = () => {
  return (
    <div className="delegate-page" id="delegate" style={{ position: 'relative' }}>
      {SHOW_COUNTDOWN && <CountdownComponent />}
      <Delegate2ArcAO />
    </div>
  );
};

export default Delegate;
