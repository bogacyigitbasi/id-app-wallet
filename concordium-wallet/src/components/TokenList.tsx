import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { formatTokenAmount } from '../services/tokenService';
import type { TokenBalance } from '../types';

interface TokenListProps {
  onSendToken?: (token: TokenBalance) => void;
}

export function TokenList({ onSendToken }: TokenListProps) {
  const { state, refreshTokens } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const activeAccount = state.accounts[state.activeAccountIndex];
  const tokens = activeAccount
    ? state.tokenBalances[activeAccount.address] || []
    : [];

  useEffect(() => {
    if (activeAccount) {
      handleRefresh();
    }
  }, [activeAccount?.address]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenIcon = (token: TokenBalance) => {
    if (token.metadata?.thumbnail) {
      return token.metadata.thumbnail;
    }
    if (token.metadata?.icon) {
      return token.metadata.icon;
    }
    return null;
  };

  return (
    <div className="token-list">
      <div className="token-list-header">
        <h3>Tokens</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="refresh-button"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* CCD Balance */}
      <div className="token-item ccd-token">
        <div className="token-icon ccd-icon">
          <span>CCD</span>
        </div>
        <div className="token-info">
          <span className="token-name">Concordium CCD</span>
          <span className="token-symbol">CCD</span>
        </div>
        <div className="token-balance">
          <span className="token-amount">{activeAccount?.balance || '0'}</span>
          <span className="token-unit">CCD</span>
        </div>
      </div>

      {isLoading && tokens.length === 0 ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading tokens...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="empty-tokens">
          <p>No additional tokens found</p>
        </div>
      ) : (
        tokens.map((token) => {
          const iconUrl = getTokenIcon(token);
          const decimals = token.metadata?.decimals || 0;
          const formattedBalance = formatTokenAmount(token.balance, decimals);

          return (
            <div
              key={`${token.contractIndex}-${token.contractSubindex}-${token.tokenId}`}
              className="token-item"
              onClick={() => onSendToken?.(token)}
            >
              <div className="token-icon">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={token.metadata?.name || 'Token'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={iconUrl ? 'hidden' : ''}>
                  {(token.metadata?.symbol || '?').slice(0, 3)}
                </span>
              </div>
              <div className="token-info">
                <span className="token-name">
                  {token.metadata?.name || `Token ${token.tokenId}`}
                </span>
                <span className="token-symbol">
                  {token.metadata?.symbol || `Contract ${token.contractIndex}`}
                </span>
              </div>
              <div className="token-balance">
                <span className="token-amount">{formattedBalance}</span>
                <span className="token-unit">{token.metadata?.symbol || ''}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
