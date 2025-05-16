import React, { useState, useEffect } from 'react';
import './Header.css';
import styled from 'styled-components';
import WalletConnection from '../shared-components/Wallet/WalletConnection';
import { ARCAO_LINKS } from '../links';
import { scrollToSection, VALID_SECTIONS, SectionId } from '../utils/scrollUtils';

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
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    // Initialize active section from URL hash if present
    const hash = window.location.hash.slice(1);
    return (VALID_SECTIONS.includes(hash as SectionId) ? hash : 'start') as SectionId;
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const sections = VALID_SECTIONS.map(id => {
        const element = document.getElementById(id);
        if (!element) return { id, top: 0 };
        return {
          id,
          top: element.offsetTop
        };
      });

      for (let i = sections.length - 1; i >= 0; i--) {
        if (scrollPosition >= sections[i].top) {
          const newSection = sections[i].id;
          if (activeSection !== newSection) {
            setActiveSection(newSection);
            // Update URL hash without triggering scroll
            window.history.replaceState(null, '', `#${newSection}`);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    scrollToSection(sectionId);
    // Update URL hash without triggering scroll
    window.history.pushState(null, '', `#${sectionId}`);
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
              onChange={() => handleSectionChange('start')}
            />
            <span className="name">Start</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'games'}
              onChange={() => handleSectionChange('games')}
            />
            <span className="name">Play</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'about'}
              onChange={() => handleSectionChange('about')}
            />
            <span className="name">Learn</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="section"
              checked={activeSection === 'join'}
              onChange={() => handleSectionChange('join')}
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
              onChange={() => handleSectionChange('delegate')}
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
