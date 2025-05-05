import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PIOracleClient, PIOracleClientBuilder, PITokenClient, PIToken, TickHistoryEntry, DelegationInfo, PIDelegateClient, PIDelegateClientBuilder } from 'ao-process-clients/dist/src/clients/pi';
import { TokenClient } from 'ao-process-clients/dist/src/clients/ao';
import { AOToken } from 'ao-process-clients/dist/src/clients/tokens/AOTokenClient';
import { DryRunResult } from '@permaweb/aoconnect/dist/lib/dryrun';
import { AO_CONFIG } from '../config/aoConnection';
import { useWallet } from '../shared-components/Wallet/WalletContext';

// Define interfaces for component state
interface StateStructure {
  oracleClient: boolean;
  delegateClient: boolean;
  delegateInfo: boolean;
  piTokens: boolean;
  tokenInfo: boolean;
  tickHistory: boolean;
  balance: boolean;
  claimableBalance: boolean;
  tokenClients: boolean;
  tokenClientPairs: boolean;
  delegationInfo: boolean;
  updatingDelegation: boolean;
}

// Form interfaces aren't needed anymore since we're using a simpler state object

const MintContainer = styled.div`
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  max-width: 1200px;
  margin: 2rem auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #333;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
  color: #444;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
`;

const DataCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: auto;
  max-height: 300px;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const TokenCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #eee;
  
  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0.3rem 0;
    font-size: 0.9rem;
  }
  
  button.refresh {
    padding: 4px 8px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
  }
  
  button.refresh:hover {
    background: #3a80d2;
  }
  
  button.refresh:disabled {
    background: #a0a0a0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  background: #ffebee;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin: 0.5rem 0;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #333;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusLabel = styled.div<{ $isLoading?: boolean; $isError?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: ${props => props.$isLoading ? '#f8f9fa' : props.$isError ? '#fff0f0' : 'transparent'};
  color: ${props => props.$isError ? '#d32f2f' : 'inherit'};
  border-radius: 4px;
  font-style: italic;
`;

const FormSection = styled.div`
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
`;

const FormRow = styled.div`
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  gap: 10px;
`;

const FormLabel = styled.label`
  width: 150px;
  font-weight: bold;
`;

const FormInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px 15px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  &.danger {
    background: #e74c3c;
  }
  
  &.secondary {
    background: #95a5a6;
  }
`;

const PreBlock = styled.pre`
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
  font-size: 0.85rem;
`;

interface TokenClientPair {
  piClient: PITokenClient;
  baseClient: TokenClient;
}

interface TokenClientMap {
  [key: string]: TokenClientPair;
}

interface TokenData {
  tokenId: string;      // PI Token Process ID
  processId: string;    // Base Token Process ID
  ticker: string;       // Token ticker
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

const Mint: React.FC = () => {
  // Get the wallet address from the wallet context
  const { address: walletAddress } = useWallet();
  
  const [oracleClient, setOracleClient] = useState<PIOracleClient | null>(null);
  const [delegateClient, setDelegateClient] = useState<PIDelegateClient | null>(null);
  const [infoData, setInfoData] = useState<DryRunResult | null>(null);
  const [tokenInfo, setTokenInfo] = useState<DryRunResult | null>(null);
  const [delegateInfo, setDelegateInfo] = useState<DryRunResult | null>(null);
  const [delegationData, setDelegationData] = useState<DelegationInfo | null>(null);
  const [tickHistoryData, setTickHistoryData] = useState<TickHistoryEntry[]>([]);
  const [piTokensData, setPiTokensData] = useState<PIToken[]>([]);
  const [balanceData, setBalanceData] = useState<string>('');
  const [claimableBalanceData, setClaimableBalanceData] = useState<string>('');
  const [tokenClients, setTokenClients] = useState<TokenClientMap>({});
  const [tokensMap, setTokensMap] = useState<Map<string, PIToken>>(new Map());
  const [tokenClientPairs, setTokenClientPairs] = useState<[PITokenClient, TokenClient][]>([]);
  const [tokenDataMap, setTokenDataMap] = useState<Map<string, TokenData>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState<{[key: string]: boolean}>({});
  const [delegationMap, setDelegationMap] = useState<Map<string, number>>(new Map()); // Map of token ID to delegation percentage
  
  const [loading, setLoading] = useState<StateStructure>({
    oracleClient: false,
    delegateClient: false,
    delegateInfo: false,
    piTokens: false,
    tokenInfo: false,
    tickHistory: false,
    balance: false,
    claimableBalance: false,
    tokenClients: false,
    tokenClientPairs: false,
    delegationInfo: false,
    updatingDelegation: false
  });
  
  // State for delegation management form
  const [delegationForm, setDelegationForm] = useState({
    walletTo: '',
    factor: 500,
    formDirty: false
  });
  
  const [errors, setErrors] = useState<{[key: string]: string | null}>({
    oracleClient: null,
    delegateClient: null,
    delegateInfo: null,
    piTokens: null,
    tokenInfo: null,
    tickHistory: null,
    balance: null,
    claimableBalance: null,
    tokenClients: null,
    tokenClientPairs: null,
    delegationInfo: null,
    updatingDelegation: null
  });

  // Use ref to track if we've already loaded data
  // This prevents duplicate data loading in React StrictMode
  const dataLoadedRef = React.useRef(false);

  useEffect(() => {
    // Skip duplicate initialization in StrictMode
    if (dataLoadedRef.current) {
      console.log('Skipping duplicate initialization in StrictMode');
      return;
    }
    
    // Mark as loaded to prevent duplicates
    dataLoadedRef.current = true;
    
    // Initialize the Oracle client with custom CU URL
    const initOracleClient = () => {
      // Create an instance with custom CU URL
      const builder = new PIOracleClientBuilder();
      const client = builder.withAOConfig({
        MODE: 'legacy',
        CU_URL: "https://ur-cu.randao.net"
      }).build();
      setOracleClient(client);
      return client;
    };
    
    // Initialize the Delegate client with custom CU URL
    const initDelegateClient = () => {
      // Create a new instance with the custom CU URL
      const builder = new PIDelegateClientBuilder();
      const client = builder.withAOConfig({
        MODE: 'legacy',
        CU_URL: "https://ur-cu.randao.net"
      }).build();
      setDelegateClient(client);
      return client;
    };
    
    console.log('Initializing clients and fetching data (first load)');
    // Create the clients and fetch all data
    const oracleClientInstance = initOracleClient();
    const delegateClientInstance = initDelegateClient();
    fetchAllData(oracleClientInstance, delegateClientInstance);
  }, []);
  
  // We don't need this useEffect anymore since we're handling token data fetching in fetchAllData
  // This useEffect was causing duplicate API calls for each token

  const fetchAllData = async (oracleClient: PIOracleClient, delegateClient: PIDelegateClient) => {
    console.log('Starting initial data fetch - optimized to avoid duplicate API calls');
    
    try {
      // IMPORTANT: We need to fetch tokens data FIRST and only ONCE
      // This avoids the duplicate network requests
      let tokensData: string = '';
      let parsedTokens: PIToken[] = [];
      
      try {
        setLoading(prev => ({ ...prev, piTokens: true, tokensMap: true }));
        console.log('Fetching PI tokens (single request)');
        
        // Get tokens data just once
        tokensData = await oracleClient.getPITokens();
        parsedTokens = oracleClient.parsePITokens(tokensData);
        
        // Store the parsed token data
        setPiTokensData(parsedTokens);
        
        // Create and store the tokens map manually (without making another API call)
        const tokensMap = new Map<string, PIToken>();
        for (const token of parsedTokens) {
          if (token.flp_token_ticker) {
            tokensMap.set(token.flp_token_ticker, token);
          }
        }
        setTokensMap(tokensMap);
        
        setErrors(prev => ({ ...prev, piTokens: null, tokensMap: null }));
        console.log(`Successfully fetched ${parsedTokens.length} PI tokens in a single request`);
      } catch (error: any) {
        console.error('Error fetching PI tokens:', error);
        setErrors(prev => ({
          ...prev,
          piTokens: error.message,
          tokensMap: error.message
        }));
      } finally {
        setLoading(prev => ({ ...prev, piTokens: false, tokensMap: false }));
      }
      
      // Now fetch oracle info and delegation info in parallel
      const [infoResult, delegationInfoResult] = await Promise.all([
        // Get general info
        (async () => {
          try {
            setLoading(prev => ({ ...prev, info: true }));
            const data = await oracleClient.getInfo();
            setInfoData(data);
            setErrors(prev => ({ ...prev, info: null }));
            return data;
          } catch (error: any) {
            console.error('Error fetching info:', error);
            setErrors(prev => ({ ...prev, info: error.message }));
            return null;
          } finally {
            setLoading(prev => ({ ...prev, info: false }));
          }
        })(),
        
        // Get delegation info
        (async () => {
          if (!walletAddress) return null;
          return fetchDelegationInfo(delegateClient);
        })()
      ]);
      
      // Step 3: Now create token clients using the information we already have
      try {
        setLoading(prev => ({ ...prev, tokenClients: true, tokenClientPairs: true }));
        
        // Instead of calling createTokenClientPairsArray() which would make another getPITokens call,
        // create the client pairs manually using our already fetched tokens data
        const clientPairs: [PITokenClient, TokenClient][] = [];
        
        // Create client pairs for each token using our existing parsedTokens data
        for (const token of parsedTokens) {
          const ticker = token.ticker || token.flp_token_ticker;
          const id = token.id;
          const processId = token.process || token.flp_token_process;
          
          // Only create clients if we have both ID and process
          if (ticker && id && processId) {
            // Create PITokenClient using the ID field
            const piTokenClient = new PITokenClient({
              ...oracleClient.baseConfig,
              processId: id
            });
            
            // Create TokenClient using the process field
            const baseClient = new TokenClient({
              ...oracleClient.baseConfig,
              processId: processId
            });
            
            // Add the pair to our array
            clientPairs.push([piTokenClient, baseClient]);
          }
        }
        
        console.log(`Created ${clientPairs.length} token client pairs (without redundant API call)`);
        setTokenClientPairs(clientPairs);
        
        // Convert to map format for backward compatibility
        const clientsObj: TokenClientMap = {};
        clientPairs.forEach(([piClient, baseClient], index) => {
          const key = piClient.baseConfig.processId;
          clientsObj[key] = {
            piClient,
            baseClient
          };
          
          // Only process the token data using the information we already have from tokensMap
          // This eliminates redundant API calls to each token
          const tokenId = piClient.baseConfig.processId;
          const processId = baseClient.baseConfig.processId;
          
          // Find matching token in the tokens map (we already have this data)
          const token = Array.from(tokensMap.values()).find(t => 
            t.id === tokenId || t.process === processId || t.flp_token_process === processId);
          
          if (token) {
            // Pre-populate token data with what we already know from tokensMap
            // This eliminates the need for separate API calls to each token
            const ticker = token.ticker || token.flp_token_ticker || 'Unknown';
            const name = token.flp_token_name || ticker;
            const treasury = token.treasury || '';
            const status = token.status || '';
            const logoUrl = token.flp_token_logo ? `https://arweave.net/${token.flp_token_logo}` : '';
            
            setTokenDataMap(prev => new Map(prev).set(tokenId, {
              tokenId,
              processId,
              ticker,
              name,
              treasury,
              status,
              logoUrl,
              balance: '0',         // These will be fetched only when a user interacts with the token
              claimableBalance: '0', // to eliminate unnecessary network requests on page load
              tickHistory: [],
              isLoading: false
            }));
          }
          
          // We'll load detailed token data (balance, history) only when a user interacts with a token or uses refresh
        });
        
        setTokenClients(clientsObj);
        setErrors(prev => ({ ...prev, tokenClients: null, tokenClientPairs: null }));
      } catch (error: any) {
        console.error('Error creating token clients:', error);
        setErrors(prev => ({ ...prev, tokenClients: error.message, tokenClientPairs: error.message }));
      } finally {
        setLoading(prev => ({ ...prev, tokenClients: false, tokenClientPairs: false }));
      }
    } catch (error) {
      console.error('Error in fetchAllData:', error);
    }
  };

  // Oracle client functions
  const fetchInfo = async (client: PIOracleClient) => {
    try {
      setLoading(prev => ({ ...prev, info: true }));
      const data = await client.getInfo();
      setInfoData(data);
      setErrors(prev => ({ ...prev, info: null }));
    } catch (error: any) {
      console.error('Error fetching info:', error);
      setErrors(prev => ({ ...prev, info: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, info: false }));
    }
  };

  const fetchPITokens = async (client: PIOracleClient) => {
    try {
      setLoading(prev => ({ ...prev, piTokens: true }));
      const data = await client.getPITokens();
      const parsedData = client.parsePITokens(data);
      setPiTokensData(parsedData);
      setErrors(prev => ({ ...prev, piTokens: null }));
    } catch (error: any) {
      console.error('Error fetching PI tokens:', error);
      setErrors(prev => ({ ...prev, piTokens: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, piTokens: false }));
    }
  };

  const fetchTokensMap = async (client: PIOracleClient) => {
    try {
      setLoading(prev => ({ ...prev, tokensMap: true }));
      const map = await client.getTokensMap();
      setTokensMap(map);
      setErrors(prev => ({ ...prev, tokensMap: null }));
    } catch (error: any) {
      console.error('Error fetching tokens map:', error);
      setErrors(prev => ({ ...prev, tokensMap: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tokensMap: false }));
    }
  };
  
  const fetchTokenClients = async (client: PIOracleClient) => {
    try {
      setLoading(prev => ({ ...prev, tokenClients: true }));
      // Using the new client pairs method instead of the deprecated createTokenClients
      const clientPairsMap = await client.createTokenClientPairs();
      
      // Convert Map to object for easier state management
      const clientsObj: TokenClientMap = {};
      clientPairsMap.forEach((value: [PITokenClient, TokenClient], key: string) => {
        const [piClient, baseClient] = value;
        clientsObj[key] = {
          piClient,
          baseClient
        };
      });
      
      setTokenClients(clientsObj);
      setErrors(prev => ({ ...prev, tokenClients: null }));
    } catch (error: any) {
      console.error('Error creating token clients:', error);
      setErrors(prev => ({ ...prev, tokenClients: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tokenClients: false }));
    }
  };

  const fetchTokenClientPairs = async (client: PIOracleClient) => {
    try {
      setLoading(prev => ({ ...prev, tokenClientPairs: true }));
      const clientPairs = await client.createTokenClientPairsArray();
      setTokenClientPairs(clientPairs);
      setErrors(prev => ({ ...prev, tokenClientPairs: null }));
    } catch (error: any) {
      console.error('Error creating token client pairs:', error);
      setErrors(prev => ({ ...prev, tokenClientPairs: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tokenClientPairs: false }));
    }
  };
  
  // Function to fetch delegation information
  const fetchDelegationInfo = async (client: PIDelegateClient) => {
    try {
      setLoading(prev => ({ ...prev, delegationInfo: true }));
      console.log('Fetching delegation information...');
      
      // Check if wallet address is available
      if (!walletAddress) {
        console.warn('No wallet address available for delegation check');
        return;
      }
      
      console.log(`Using wallet address for delegation check: ${walletAddress}`);
      
      // Get delegation data with wallet address
      let delegationDataStr = '';
      try {
        // Using the updated getDelegation method that accepts wallet address
        delegationDataStr = await client.getDelegation(walletAddress);
        console.log('Raw delegation data string:', delegationDataStr);
        
        // Log the raw data as an object if possible
        try {
          const rawDataObj = JSON.parse(delegationDataStr);
          console.log('Raw delegation data as object:', rawDataObj);
          console.log('Total factor:', rawDataObj.totalFactor);
          console.log('Delegation preferences:', rawDataObj.delegationPrefs);
          console.log('Last update:', new Date(rawDataObj.lastUpdate).toLocaleString());
          console.log('Wallet:', rawDataObj.wallet);
        } catch (parseErr) {
          console.error('Error parsing raw delegation data:', parseErr);
        }
      } catch (error) {
        console.error('Error getting delegation data:', error);
        return; // Exit early if we can't get delegation data
      }
      
      if (!delegationDataStr) {
        console.log('No delegation data available');
        return;
      }
      
      // Parse delegation info with robust error handling
      let delegationInfo: DelegationInfo | null = null;
      try {
        delegationInfo = client.parseDelegationInfo(delegationDataStr);
        setDelegationData(delegationInfo);
        console.log('Parsed delegation info:', delegationInfo);
        
        // Don't initialize the form with preferences since we now handle one delegation at a time
        console.log('Current wallet address:', walletAddress);
      } catch (error) {
        console.error('Error parsing delegation data:', error);
        return;
      }
      
      // Calculate delegation percentages for each token
      const newDelegationMap = new Map<string, number>();
      
      if (delegationInfo && delegationInfo.delegationPrefs && delegationInfo.delegationPrefs.length > 0) {
        const totalFactor = parseInt(delegationInfo.totalFactor) || 10000;
        console.log(`Total delegation factor: ${totalFactor}`);
        
        // Process each delegation preference
        for (const pref of delegationInfo.delegationPrefs) {
          const { walletTo, factor } = pref;
          
          // Calculate percentage with 2 decimal places
          const percentage = parseFloat(((factor / totalFactor) * 100).toFixed(2));
          
          // Add to the map
          newDelegationMap.set(walletTo, percentage);
          console.log(`Delegation to ${walletTo}: ${percentage}%`);
        }
        
        console.log(`Found ${newDelegationMap.size} delegation entries`);
      } else {
        console.log('No delegation preferences found in the data');
      }
      
      setDelegationMap(newDelegationMap);
      setErrors(prev => ({ ...prev, delegationInfo: null }));
    } catch (error: any) {
      console.error('Error in delegation info flow:', error);
      setErrors(prev => ({ ...prev, delegationInfo: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, delegationInfo: false }));
    }
  };
  
  // Function to update delegation preferences with new format
  const updateDelegation = async () => {
    if (!delegateClient || !walletAddress) {
      console.error('Delegate client or wallet address not available');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, updatingDelegation: true }));
      console.log('Updating delegation preference...');
      console.log('Delegation data to send:', {
        walletFrom: walletAddress,
        walletTo: delegationForm.walletTo,
        factor: delegationForm.factor
      });
      
      // Need to use type assertion because the updated interface isn't reflected in the distributed types yet
      const result = await delegateClient.setDelegation({
        walletFrom: walletAddress,
        walletTo: delegationForm.walletTo,
        factor: delegationForm.factor
      } as any);
      
      console.log('Delegation update result:', result);
      setDelegationForm(prev => ({ ...prev, formDirty: false }));
      
      // Refresh delegation info
      fetchDelegationInfo(delegateClient);
      
      setErrors(prev => ({ ...prev, updatingDelegation: null }));
    } catch (error: any) {
      console.error('Error updating delegation:', error);
      setErrors(prev => ({ ...prev, updatingDelegation: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, updatingDelegation: false }));
    }
  };
  
  // Helper function to handle delegation field changes
  const handleDelegationChange = (field: 'walletTo' | 'factor', value: string) => {
    setDelegationForm(prev => ({
      ...prev,
      [field]: field === 'factor' ? (parseInt(value) || 0) : value,
      formDirty: true
    }));
  };

  // PI Token client functions
  const fetchTokenInfo = async (client: PITokenClient) => {
    try {
      setLoading(prev => ({ ...prev, tokenInfo: true }));
      const data = await client.getInfo();
      setTokenInfo(data);
      setErrors(prev => ({ ...prev, tokenInfo: null }));
    } catch (error: any) {
      console.error('Error fetching token info:', error);
      setErrors(prev => ({ ...prev, tokenInfo: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tokenInfo: false }));
    }
  };

  const fetchTickHistory = async (client: PITokenClient) => {
    try {
      setLoading(prev => ({ ...prev, tickHistory: true }));
      const data = await client.getTickHistory();
      const parsedData = client.parseTickHistory(data);
      setTickHistoryData(parsedData);
      setErrors(prev => ({ ...prev, tickHistory: null }));
    } catch (error: any) {
      console.error('Error fetching tick history:', error);
      setErrors(prev => ({ ...prev, tickHistory: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, tickHistory: false }));
    }
  };

  const fetchBalance = async (client: PITokenClient) => {
    try {
      setLoading(prev => ({ ...prev, balance: true }));
      const data = await client.getBalance();
      setBalanceData(data);
      setErrors(prev => ({ ...prev, balance: null }));
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      setErrors(prev => ({ ...prev, balance: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const fetchClaimableBalance = async (client: PITokenClient) => {
    try {
      setLoading(prev => ({ ...prev, claimableBalance: true }));
      const data = await client.getClaimableBalance();
      setClaimableBalanceData(data);
      setErrors(prev => ({ ...prev, claimableBalance: null }));
    } catch (error: any) {
      console.error('Error fetching claimable balance:', error);
      setErrors(prev => ({ ...prev, claimableBalance: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, claimableBalance: false }));
    }
  };

  // Update to accept any string key to maintain backward compatibility
  const renderLoadingState = (key: string) => {
    if (loading[key as keyof typeof loading]) {
      return (
        <StatusLabel $isLoading={true}>
          <LoadingSpinner /> Loading...
        </StatusLabel>
      );
    }
    return null;
  };

  const renderError = (key: string) => {
    if (errors[key]) {
      return (
        <StatusLabel $isError={true}>
          Error: {errors[key]}
        </StatusLabel>
      );
    }
    return null;
  };

  // Function to fetch data for a specific token client pair and store in state
  const fetchTokenData = async (piClient: PITokenClient, baseClient: TokenClient, isRefresh = false) => {
    const tokenId = piClient.baseConfig.processId;
    const processId = baseClient.baseConfig.processId;
    
    try {
      // Set loading state for this token
      if (isRefresh) {
        setIsRefreshing(prev => ({ ...prev, [tokenId]: true }));
      }
      
      console.log(`Fetching data for token ${tokenId}${isRefresh ? ' (refresh)' : ''}`);
      
      // Try to find the token in the tokens map to get ticker and status
      const token = Array.from(tokensMap.values()).find(t => 
        t.id === tokenId || t.process === processId);
      const ticker = token?.ticker || token?.flp_token_ticker || 'Unknown';
      const name = token?.flp_token_name || ticker;
      const treasury = token?.treasury || '';
      const status = token?.status || '';
      const logoUrl = token?.flp_token_logo ? `https://arweave.net/${token.flp_token_logo}` : '';
      
      // Initialize token data if it doesn't exist
      if (!tokenDataMap.has(tokenId)) {
        setTokenDataMap(prev => new Map(prev).set(tokenId, {
          tokenId,
          processId,
          ticker,
          name,
          treasury,
          status,
          logoUrl,
          balance: '0',
          claimableBalance: '0',
          tickHistory: [],
          isLoading: true
        }));
      } else {
        // Set loading state
        setTokenDataMap(prev => {
          const newMap = new Map(prev);
          const currentData = newMap.get(tokenId);
          if (currentData) {
            newMap.set(tokenId, { ...currentData, isLoading: true });
          }
          return newMap;
        });
      }
      
      // Fetch essential data in parallel (removing token info as it's already available in the FLP data)
      const [balance, claimableBalance, tickHistoryStr] = await Promise.all([
        piClient.getBalance().catch(error => {
          console.error(`Error fetching balance for ${tokenId}:`, error);
          return '0';
        }),
        piClient.getClaimableBalance().catch(error => {
          console.error(`Error fetching claimable balance for ${tokenId}:`, error);
          return '0';
        }),
        piClient.getTickHistory().catch(error => {
          console.error(`Error fetching tick history for ${tokenId}:`, error);
          return '[]';
        })
      ]);
      
      // Parse tick history
      let tickHistory: TickHistoryEntry[] = [];
      try {
        tickHistory = piClient.parseTickHistory(tickHistoryStr);
        console.log(`Received ${tickHistory.length} tick history entries for ${tokenId}`);
      } catch (error) {
        console.error(`Error parsing tick history for ${tokenId}:`, error);
      }
      
      // Update state with fetched data
      setTokenDataMap(prev => {
        const newMap = new Map(prev);
        newMap.set(tokenId, {
          tokenId,
          processId,
          ticker,
          name,
          treasury,
          status,
          logoUrl,
          balance,
          claimableBalance,
          tickHistory,
          isLoading: false
        });
        return newMap;
      });
      
      console.log(`Successfully fetched data for token ${tokenId}: Balance=${balance}, Claimable=${claimableBalance}`);
    } catch (error) {
      console.error(`Error in fetchTokenData for ${tokenId}:`, error);
      // Update error state
      setTokenDataMap(prev => {
        const newMap = new Map(prev);
        const currentData = newMap.get(tokenId) || {
          tokenId,
          processId,
          ticker: 'Unknown',
          name: 'Unknown Token',
          balance: '0',
          claimableBalance: '0',
          tickHistory: [],
          isLoading: false
        };
        newMap.set(tokenId, { ...currentData, isLoading: false });
        return newMap;
      });
    } finally {
      if (isRefresh) {
        setIsRefreshing(prev => ({ ...prev, [tokenId]: false }));
      }
    }
  };
  
  // Function to refresh all token data
  const refreshAllTokenData = async () => {
    if (tokenClientPairs.length === 0) return;
    
    console.log(`Refreshing data for all ${tokenClientPairs.length} tokens`);
    setIsRefreshing(prev => {
      const newState = { ...prev };
      tokenClientPairs.forEach(([piClient, baseClient]) => {
        newState[piClient.baseConfig.processId] = true;
      });
      return newState;
    });
    
    await Promise.all(tokenClientPairs.map(([piClient, baseClient]) => 
      fetchTokenData(piClient, baseClient, true)));
  };
  
  return (
    <MintContainer id="mint">
      <Title>PI Token Integration</Title>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          onClick={refreshAllTokenData}
          disabled={Object.values(isRefreshing).some(val => val)}
          style={{
            padding: '8px 16px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {Object.values(isRefreshing).some(val => val) ? (
            <>
              <LoadingSpinner /> Refreshing All Token Data...
            </>
          ) : 'Refresh All Token Data'}
        </button>
      </div>
      
      <SectionTitle>Delegation Management</SectionTitle>
      {renderLoadingState('delegationInfo')}
      {renderError('delegationInfo')}
      {renderLoadingState('updatingDelegation')}
      {renderError('updatingDelegation')}
      <DataCard>
        <h3>Your Delegation Preferences</h3>
        {delegationData && (
          <>
            <p>Total Factor: {delegationData.totalFactor} ({delegationData.totalFactor === '10000' ? '100%' : `${parseInt(delegationData.totalFactor)/100}%`})</p>
            <p>Last Updated: {new Date(delegationData.lastUpdate).toLocaleString()}</p>
            <p>Wallet: {delegationData.wallet}</p>
            
            <FormSection>
              <h4>Set Single Delegation</h4>
              <FormRow>
                <FormLabel>Wallet Address To:</FormLabel>
                <FormInput 
                  type="text" 
                  value={delegationForm.walletTo}
                  onChange={(e) => handleDelegationChange('walletTo', e.target.value)}
                  placeholder="Enter destination wallet address"
                />
              </FormRow>
              <FormRow>
                <FormLabel>Factor (0-10000):</FormLabel>
                <FormInput 
                  type="number" 
                  value={delegationForm.factor}
                  onChange={(e) => handleDelegationChange('factor', e.target.value)}
                  placeholder="Enter factor value (basis points out of 10000)"
                />
              </FormRow>
              <FormRow>
                <Button 
                  onClick={updateDelegation} 
                  disabled={!delegationForm.formDirty || loading.updatingDelegation || !delegationForm.walletTo}
                >
                  {loading.updatingDelegation ? 'Setting Delegation...' : 'Set Delegation'}
                </Button>
              </FormRow>
              <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#777' }}>
                Note: Factor is measured in basis points (1/100 of a percent). 10000 = 100%, 5000 = 50%, 500 = 5%, etc.
              </p>
            </FormSection>
            
            <h4>Current Delegations</h4>
            <div style={{ marginTop: '10px' }}>
              {delegationData.delegationPrefs && delegationData.delegationPrefs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Wallet</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Factor</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegationData.delegationPrefs.map((pref: {walletTo: string; factor: number}, index: number) => {
                      const percentage = parseFloat(((pref.factor / parseInt(delegationData.totalFactor)) * 100).toFixed(2));
                      return (
                        <tr key={index}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{pref.walletTo}</td>
                          <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{pref.factor}</td>
                          <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>{percentage}%</td>
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
      </DataCard>
      
      <SectionTitle>Oracle Information</SectionTitle>
      {renderLoadingState('info')}
      {renderError('info')}
      <DataCard>
        <h3>Oracle Process Info</h3>
        <PreBlock>
          {infoData ? JSON.stringify(infoData, null, 2) : 'No data available'}
        </PreBlock>
      </DataCard>
      
      <SectionTitle>PI Tokens</SectionTitle>
      {renderLoadingState('piTokens') || renderLoadingState('tokenClientPairs')}
      {renderError('piTokens') || renderError('tokenClientPairs')}
      <DataCard>
        <h3>Available PI Tokens</h3>
        {piTokensData.length > 0 ? (
          <TokenGrid>
            {tokenClientPairs.map(([piClient, baseClient], index) => {
              const tokenId = piClient.baseConfig.processId;
              const processId = baseClient.baseConfig.processId;
              const token = piTokensData.find(t => 
                t.id === tokenId || 
                t.process === processId || 
                t.flp_token_process === processId
              );
              const ticker = token?.ticker || token?.flp_token_ticker || 'Unknown';
              const tokenData = tokenDataMap.get(tokenId);
              const isTokenRefreshing = isRefreshing[tokenId] || false;
              
              return (
                <TokenCard key={index} style={{ maxWidth: '350px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {token?.flp_token_logo ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #eee' }}>
                          <img 
                            src={`https://arweave.net/${token.flp_token_logo}`}
                            alt={ticker} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            onError={(e) => {
                              // Handle image loading errors by hiding the broken image
                              (e.target as HTMLImageElement).style.display = 'none';
                              // Show fallback
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#777;">${ticker.slice(0, 2)}</div>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '6px', 
                          backgroundColor: '#f0f0f0', 
                          border: '1px solid #eee',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#777',
                          flexShrink: 0
                        }}>
                          {ticker.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 style={{ margin: '0 0 2px 0' }}>{ticker} <span style={{ fontSize: '0.7em', opacity: 0.7 }}>({tokenId.slice(0, 6)}...)</span></h3>
                        {tokenData?.name && tokenData.name !== ticker && (
                          <div style={{ fontSize: '0.85em', color: '#666' }}>{tokenData.name}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button 
                        className="refresh" 
                        onClick={() => fetchTokenData(piClient, baseClient, true)}
                        disabled={isTokenRefreshing}
                        title="Fetch latest balance and yield data for this token"
                      >
                        {isTokenRefreshing ? <LoadingSpinner /> : '⟳'} Load Data
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                    <p><strong>Process ID:</strong> {tokenId ? `${tokenId.slice(0, 8)}...` : 'N/A'}</p>
                    <p><strong>Token Address:</strong> {token?.flp_token_process ? (
                      <span title={token.flp_token_process} style={{ cursor: 'pointer' }}>
                        {`${token.flp_token_process.slice(0, 8)}...${token.flp_token_process.slice(-4)}`}
                      </span>
                    ) : 'N/A'}</p>
                    <p><strong>Treasury:</strong> {token?.treasury ? (
                      <span title={token.treasury} style={{ cursor: 'pointer' }}>
                        {`${token.treasury.slice(0, 8)}...${token.treasury.slice(-4)}`}
                      </span>
                    ) : 'N/A'}</p>
                    <p><strong>Status:</strong> {token?.status || 'N/A'}</p>
                    <p><strong>Created:</strong> {token?.created_at_ts ? new Date(token.created_at_ts).toLocaleDateString() : 'N/A'}</p>
                    {/* Check if this token is in the delegation map */}
                    {delegationMap.has(tokenId) && (
                      <p>
                        <strong>Your Delegation:</strong>{' '}
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                          {delegationMap.get(tokenId)}%
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ marginBottom: '4px' }}>Balance Information</h4>
                    {tokenData?.isLoading ? (
                      <StatusLabel $isLoading={true}>
                        <LoadingSpinner /> Loading balance information...
                      </StatusLabel>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                        <div style={{ padding: '8px', background: '#eefff5', borderRadius: '4px', flex: 1 }}>
                          <p><strong>Balance:</strong></p>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{tokenData?.balance || '0'}</p>
                        </div>
                        <div style={{ padding: '8px', background: '#f5f5ff', borderRadius: '4px', flex: 1 }}>
                          <p><strong>Claimable:</strong></p>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{tokenData?.claimableBalance || '0'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ marginBottom: '4px' }}>Yield History</h4>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        {tokenData?.tickHistory.length || 0} entries
                      </span>
                    </div>
                    
                    {tokenData?.tickHistory && tokenData.tickHistory.length > 0 ? (
                      <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#f7f9fa', padding: '8px', borderRadius: '4px' }}>
                        {tokenData.tickHistory.slice(0, 5).map((entry, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '4px', padding: '4px', background: idx % 2 === 0 ? '#eef2f5' : 'transparent', borderRadius: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Timestamp: {entry.Timestamp}</span>
                              <span>Amount: {entry.TokensDistributed || entry.PiReceived || '0'}</span>
                            </div>
                            {entry.YieldCycle && <div style={{ fontSize: '0.7rem', color: '#666' }}>Cycle: {entry.YieldCycle}</div>}
                          </div>
                        ))}
                        {tokenData.tickHistory.length > 5 && (
                          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                            ...and {tokenData.tickHistory.length - 5} more entries
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '8px', background: '#f7f9fa', borderRadius: '4px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                        No yield history available
                      </div>
                    )}
                  </div>
                </TokenCard>
              );
            })}
          </TokenGrid>
        ) : (
          <p>No PI tokens available</p>
        )}
      </DataCard>
      
      <SectionTitle>Tokens Map</SectionTitle>
      {renderLoadingState('tokensMap')}
      {renderError('tokensMap')}
      <DataCard>
        <h3>Tokens Map (Complete Data)</h3>
        {tokensMap.size > 0 ? (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {Array.from(tokensMap.values()).map((token, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  maxWidth: '120px',
                  textAlign: 'center'
                }}>
                  {token.flp_token_logo ? (
                    <div style={{ width: '50px', height: '50px', margin: '0 auto 8px' }}>
                      <img 
                        src={`https://arweave.net/${token.flp_token_logo}`} 
                        alt={token.flp_token_ticker || 'Token'} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      background: '#eee',
                      margin: '0 auto 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {token.flp_token_ticker?.slice(0, 2) || '??'}
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{token.flp_token_ticker || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {token.flp_token_name || 'No name'}
                  </div>
                </div>
              ))}
            </div>

            <PreBlock>
              {JSON.stringify(Array.from(tokensMap.entries()).map(([key, token]) => [
                key, 
                // Show ALL available fields on the token object
                {
                  // Essential info
                  id: token.id,
                  ticker: token.flp_token_ticker,
                  name: token.flp_token_name,
                  token_address: token.flp_token_process,
                  treasury: token.treasury,
                  status: token.status,
                  
                  // Token metrics
                  token_denom: token.flp_token_denomination,
                  total_supply: token.total_token_supply,
                  token_supply_to_use: token.token_supply_to_use,
                  decay_factor: token.decay_factor,
                  
                  // Important dates
                  created_at: token.created_at_ts ? new Date(token.created_at_ts).toLocaleDateString() : 'N/A',
                  last_updated_at: token.last_updated_at_ts ? new Date(token.last_updated_at_ts).toLocaleDateString() : 'N/A',
                  starts_at: token.starts_at_ts ? new Date(token.starts_at_ts).toLocaleDateString() : 'N/A',
                  ends_at: token.ends_at_ts ? new Date(token.ends_at_ts).toLocaleDateString() : 'N/A',
                  
                  // Distribution info
                  total_yield_ticks: token.total_yield_ticks,
                  last_day_distribution: token.last_day_distribution,
                  accumulated_qty: token.accumulated_qty,
                  distributed_qty: token.distributed_qty,
                  withdrawn_qty: token.withdrawn_qty,
                  accumulated_pi_qty: token.accumulated_pi_qty,
                  withdrawn_pi_qty: token.withdrawn_pi_qty,
                  exchanged_for_pi_qty: token.exchanged_for_pi_qty,
                  
                  // Metadata
                  deployer: token.deployer,
                  flp_token_logo: token.flp_token_logo ? `https://arweave.net/${token.flp_token_logo}` : 'N/A',
                  flp_token_disclaimer: token.flp_token_disclaimer,
                  website_url: token.website_url,
                  twitter_handle: token.twitter_handle,
                  telegram_handle: token.telegram_handle,
                  
                  // Debug info
                  stats_updated_at: token.stats_updated_at ? new Date(token.stats_updated_at).toLocaleString() : 'N/A',
                }
              ]), null, 2)}
            </PreBlock>
          </div>
        ) : (
          <p>No tokens in map</p>
        )}
      </DataCard>
    </MintContainer>
  );
};

export default Mint;
