import React from 'react';
import { PIToken, TickHistoryEntry, PITokenClient } from 'ao-process-clients/dist/src/clients/pi';
import { TokenClient } from 'ao-process-clients/dist/src/clients/ao';
import { DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';
import TokenCard from './TokenCard';
import '../../Mint.css';

interface TokenData {
  tokenId: string;
  processId: string;
  ticker: string;
  name: string;
  balance: string;
  claimableBalance: string;
  tickHistory: TickHistoryEntry[];
  isLoading: boolean;
  treasury?: string;
  status?: string;
  logoUrl?: string;
  infoData?: DryRunResult;
}

interface PITokensProps {
  piTokensData: PIToken[];
  tokenClientPairs: [PITokenClient, TokenClient][];
  tokenDataMap: Map<string, TokenData>;
  isRefreshing: { [key: string]: boolean };
  delegationMap: Map<string, number>;
  fetchTokenData: (piClient: PITokenClient, baseClient: TokenClient, isRefresh: boolean) => Promise<void>;
  refreshAllTokenData: () => Promise<void>;
  renderLoadingState: (key: string) => JSX.Element | null;
  renderError: (key: string) => JSX.Element | null;
}

const LoadingSpinner: React.FC = () => {
  return <div className="loading-spinner"></div>;
};

const PITokens: React.FC<PITokensProps> = ({
  piTokensData,
  tokenClientPairs,
  tokenDataMap,
  isRefreshing,
  delegationMap,
  fetchTokenData,
  refreshAllTokenData,
  renderLoadingState,
  renderError
}) => {
  return (
    <div>
      <h2 className="section-title">PI Tokens</h2>
      {renderLoadingState('piTokens') || renderLoadingState('tokenClientPairs')}
      {renderError('piTokens') || renderError('tokenClientPairs')}
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={refreshAllTokenData}
          disabled={Object.values(isRefreshing).some(val => val)}
          className="refresh-all-button"
        >
          {Object.values(isRefreshing).some(val => val) ? (
            <>
              <LoadingSpinner /> Refreshing All Token Data...
            </>
          ) : 'Refresh All Token Data'}
        </button>
      </div>
      
      <div className="data-card">
        <h3>Available PI Tokens</h3>
        {piTokensData.length > 0 ? (
          <div className="token-grid">
            {tokenClientPairs.map(([piClient, baseClient], index) => {
              const tokenId = piClient.baseConfig.processId;
              const processId = baseClient.baseConfig.processId;
              const token = piTokensData.find(t => 
                t.id === tokenId || 
                t.process === processId || 
                t.flp_token_process === processId
              );
              const tokenData = tokenDataMap.get(tokenId);
              const isTokenRefreshing = isRefreshing[tokenId] || false;
              
              return (
                <TokenCard
                  key={index}
                  index={index}
                  tokenId={tokenId}
                  processId={processId}
                  token={token}
                  tokenData={tokenData}
                  isRefreshing={isTokenRefreshing}
                  delegationMap={delegationMap}
                  fetchTokenData={fetchTokenData}
                  piClient={piClient}
                  baseClient={baseClient}
                />
              );
            })}
          </div>
        ) : (
          <p>No PI tokens available</p>
        )}
      </div>
    </div>
  );
};

export default PITokens;
