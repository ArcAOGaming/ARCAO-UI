import React, { useState, useEffect } from 'react';
import './Header.css';
import styled from 'styled-components';
import WalletConnection from '../shared-components/Wallet/WalletConnection';
import { ARCAO_LINKS } from '../links';

interface HeaderProps {
  toggleSidebar: () => void;
}

const WalletWrapper = styled.div`
  position: fixed;
  right: 40px;
  top: 16px;
  z-index: 101;
`;

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [activeSection, setActiveSection] = useState('start');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const sections = ['start', 'games', 'about', 'join', 'delegate'].map(id => {
        const element = document.getElementById(id);
        if (!element) return { id, top: 0 };
        return {
          id,
          top: element.offsetTop
        };
      });

      for (let i = sections.length - 1; i >= 0; i--) {
        if (scrollPosition >= sections[i].top) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Height of the fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setActiveSection(sectionId);
  };

  return (
    <header className="header">
      <img
        src={require('../assets/logo.png')}
        alt="Arc Logo"
        className="header-logo"
        // onClick={toggleSidebar}
        style={{ cursor: 'pointer' }}
      />

      <div className="nav-container">
        <div className="radio-inputs">
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'start'}
              onChange={() => scrollToSection('start')}
            />
            <span className="name">Start</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'games'}
              onChange={() => scrollToSection('games')}
            />
            <span className="name">Games</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'about'}
              onChange={() => scrollToSection('about')}
            />
            <span className="name">About Us</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'join'}
              onChange={() => scrollToSection('join')}
            />
            <span className="name">Join</span>
          </label>
          {/* <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'mint'}
              onChange={() => scrollToSection('mint')}
            />
            <span className="name">Mint</span>
          </label> */}
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'delegate'}
              onChange={() => scrollToSection('delegate')}
            />
            <span className="name">Delegate</span>
          </label>
        </div>
      </div>

      <WalletWrapper>
        <WalletConnection />
      </WalletWrapper>
    </header>
  );
};

export default Header;
