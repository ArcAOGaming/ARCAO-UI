import React from 'react';
import DocCard from './components/DocCard';
import './Join.css';

const Join: React.FC = () => {
  return (
    <section id="join" className="join-section">
      <h2 className="join-section__title">Join ArcAO</h2>
        <p className="join-section__description">
          ArcAO has something for <strong>everyone</strong>! From building the next 
          <strong> revolutionary game</strong> to creating <strong>engaging content</strong>,
          from experiencing <strong>provably fair gaming</strong> to shaping the 
          <strong> future of blockchain gaming</strong> - discover your path in our ecosystem
          with our comprehensive guides and documentation.
        </p>
        <div className="join-section__form">
          <p>ee</p>

        </div>
      <div className="join-section__grid">
        <DocCard
          title="🎮 Game Developers"
          description={<>Build <strong>revolutionary games</strong> with our comprehensive technical guides and tools. Start creating the <strong>next generation</strong> of blockchain gaming experiences.</>}
          buttonText="Developer Docs"
          buttonUrl="https://docs-arcao_game.ar.ionode.online/docs/game-developers/overview"
        />
        <DocCard
          title="🎨 Content Creators"
          description={<>Create <strong>engaging content</strong> and build your community. Access exclusive tools and resources to <strong>amplify your impact</strong> in the ArcAO ecosystem.</>}
          buttonText="Creator Guides"
          buttonUrl="https://docs-arcao_game.ar.ionode.online/docs/content-creators/overview"
        />
        <DocCard
          title="🏆 Gamers"
          description={<>Experience <strong>provably fair gaming</strong> and earn while you play. Join a community of players shaping the <strong>future of gaming</strong>.</>}
          buttonText="Player Guides"
          buttonUrl="https://docs-arcao_game.ar.ionode.online/docs/gamers/overview"
        />
        <DocCard
          title="💰 Investors"
          description={<>Discover <strong>investment opportunities</strong> and participate in governance. Shape the future of gaming with <strong>strategic investments</strong> in the ArcAO ecosystem.</>}
          buttonText="Investor Info"
          buttonUrl="https://docs-arcao_game.ar.ionode.online/docs/investors/overview"
        />
      </div>
    </section>
  );
};

export default Join;
