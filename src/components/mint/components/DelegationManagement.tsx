import React from 'react';
import { DelegationInfo } from 'ao-process-clients/dist/src/clients/pi';
import { PIToken } from 'ao-process-clients/dist/src/clients/pi';
import '../../Mint.css';

interface DelegationManagementProps {
  delegationData: DelegationInfo | null;
  delegationForm: {
    walletTo: string;
    factor: number;
    formDirty: boolean;
  };
  loading: {
    delegationInfo: boolean;
    updatingDelegation: boolean;
  };
  handleDelegationChange: (field: 'walletTo' | 'factor', value: string) => void;
  updateDelegation: () => Promise<void>;
  renderLoadingState: (key: string) => JSX.Element | null;
  renderError: (key: string) => JSX.Element | null;
  tokens?: PIToken[];
  processToTokenMap?: Map<string, PIToken>;
}

const DelegationManagement: React.FC<DelegationManagementProps> = ({
  delegationData,
  delegationForm,
  loading,
  handleDelegationChange,
  updateDelegation,
  renderLoadingState,
  renderError,
  tokens = [],
  processToTokenMap = new Map()
}) => {
  return (
    <div>
      <h2 className="section-title">Delegation Management</h2>
      {renderLoadingState('delegationInfo')}
      {renderError('delegationInfo')}
      {renderLoadingState('updatingDelegation')}
      {renderError('updatingDelegation')}
      <div className="data-card">
        <h3>Your Delegation Preferences</h3>
        {delegationData && (
          <>
            <p>Total Factor: {delegationData.totalFactor} ({delegationData.totalFactor === '10000' ? '100%' : `${parseInt(delegationData.totalFactor)/100}%`})</p>
            <p>Last Updated: {new Date(delegationData.lastUpdate).toLocaleString()}</p>
            <p>Your Address: {delegationData.wallet ? <span title="Click to copy" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(delegationData.wallet)}>{`${delegationData.wallet.slice(0, 4)}...${delegationData.wallet.slice(-4)}`}</span> : 'N/A'}</p>
            
            <div className="form-section">
              <h4>Set Single Delegation</h4>
              <div className="form-row">
                <label className="form-label">Delegation Address:</label>
                <input 
                  className="form-input"
                  type="text" 
                  value={delegationForm.walletTo}
                  onChange={(e) => handleDelegationChange('walletTo', e.target.value)}
                  placeholder="Enter destination process ID or wallet address"
                />
              </div>
              <div className="form-row">
                <label className="form-label">Factor (0-10000):</label>
                <input 
                  className="form-input"
                  type="number" 
                  value={delegationForm.factor}
                  onChange={(e) => handleDelegationChange('factor', e.target.value)}
                  placeholder="Enter factor value (basis points out of 10000)"
                />
              </div>
              <div className="form-row">
                <button 
                  className="button"
                  onClick={updateDelegation} 
                  disabled={!delegationForm.formDirty || loading.updatingDelegation || !delegationForm.walletTo}
                >
                  {loading.updatingDelegation ? 'Setting Delegation...' : 'Set Delegation'}
                </button>
              </div>
              <p className="factor-note">
                Note: Factor is measured in basis points (1/100 of a percent). 10000 = 100%, 5000 = 50%, 500 = 5%, etc.
              </p>
            </div>
            
            <h4>Current Delegations</h4>
            <div style={{ marginTop: '10px' }}>
              {delegationData.delegationPrefs && delegationData.delegationPrefs.length > 0 ? (
                <table className="delegations-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Delegation Address</th>
                      <th className="right">Factor</th>
                      <th className="right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegationData.delegationPrefs.map((pref: {walletTo: string; factor: number}, index: number) => {
                      const percentage = parseFloat(((pref.factor / parseInt(delegationData.totalFactor)) * 100).toFixed(2));
                      // Find token associated with this address
                      const matchingToken = processToTokenMap.get(pref.walletTo);
                      const token = matchingToken || null;
                      const ticker = token?.ticker || token?.flp_token_ticker || '';
                      const shortAddr = `${pref.walletTo.slice(0, 4)}...${pref.walletTo.slice(-4)}`;
                      
                      return (
                        <tr key={index}>
                          <td>
                            {token ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {token.flp_token_logo ? (
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden' }}>
                                    <img 
                                      src={`https://arweave.net/${token.flp_token_logo}`}
                                      alt={ticker} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    color: '#777'
                                  }}>
                                    {ticker.slice(0, 2)}
                                  </div>
                                )}
                                <span>{ticker}</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span 
                              title="Click to copy to clipboard"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigator.clipboard.writeText(pref.walletTo)}
                            >
                              {`${pref.walletTo.slice(0, 4)}...${pref.walletTo.slice(-4)}`}
                            </span>
                          </td>
                          <td className="right">{pref.factor}</td>
                          <td className="right">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No delegation preferences set.</p>
              )}
            </div>
          </>
        )}
        {!delegationData && !loading.delegationInfo && (
          <p>No delegation data available. Connect your wallet to view and manage delegations.</p>
        )}
      </div>
    </div>
  );
};

export default DelegationManagement;
