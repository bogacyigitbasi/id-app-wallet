import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { formatCCD } from '../services/concordium';
import { formatTokenAmount } from '../services/tokenService';
import type { Transaction } from '../types';

interface TransactionHistoryProps {
  onClose: () => void;
}

type FilterType = 'all' | 'sent' | 'received' | 'contract';

export function TransactionHistory({ onClose }: TransactionHistoryProps) {
  const { state, fetchTransactions } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const activeAccount = state.accounts[state.activeAccountIndex];
  const transactions = activeAccount
    ? state.transactions[activeAccount.address] || []
    : [];

  useEffect(() => {
    if (activeAccount) {
      handleRefresh();
    }
  }, [activeAccount?.address]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchTransactions();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return isSent(tx);
    if (filter === 'received') return !isSent(tx);
    if (filter === 'contract') return tx.type === 'update' || tx.type === 'initContract';
    return true;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (tx: Transaction) => {
    // If it's a token transfer, check if it's PLT
    if (tx.tokenTransfer) {
      const tokens = activeAccount
        ? state.tokenBalances[activeAccount.address] || []
        : [];
      const match = tokens.find(
        (t) => t.contractIndex === tx.tokenTransfer!.contractIndex && t.tokenId === tx.tokenTransfer!.tokenId
      );
      return match?.isPLT ? 'PLT Transfer' : 'Token Transfer';
    }
    switch (tx.type) {
      case 'transfer': return 'Transfer';
      case 'transferWithMemo': return 'Transfer';
      case 'update': return 'Contract Update';
      case 'initContract': return 'Contract Init';
      case 'deployModule': return 'Module Deploy';
      case 'credentialDeployment': return 'Account Creation';
      case 'configureBaker': return 'Validator Config';
      case 'configureDelegation': return 'Delegation Config';
      default: return tx.type;
    }
  };

  const isSent = (tx: Transaction) => {
    // For token transfers, check the CIS-2 event from/to
    if (tx.tokenTransfer) {
      return tx.tokenTransfer.from === activeAccount?.address;
    }
    return tx.sender === activeAccount?.address;
  };

  const isTokenTx = (tx: Transaction) => !!tx.tokenTransfer;

  const formatAmount = (amount?: string) => {
    if (!amount) return '';
    try {
      const microCCD = BigInt(amount);
      return formatCCD(microCCD);
    } catch {
      return amount;
    }
  };

  const getTokenDisplayAmount = (tx: Transaction): string => {
    if (!tx.tokenTransfer) return '';
    const tt = tx.tokenTransfer;
    // Find metadata from token balances if available
    const tokens = activeAccount
      ? state.tokenBalances[activeAccount.address] || []
      : [];
    const match = tokens.find(
      (t) => t.contractIndex === tt.contractIndex && t.tokenId === tt.tokenId
    );
    const decimals = match?.metadata?.decimals || 0;
    const symbol = match?.metadata?.symbol || 'Token';
    const formatted = formatTokenAmount(tt.amount, decimals);
    return `${formatted} ${symbol}`;
  };

  return (
    <div className="transaction-history">
      <div className="modal-header">
        <h2>Transaction History</h2>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>

      <div className="tx-filters">
        {(['all', 'sent', 'received', 'contract'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`filter-button ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="refresh-button"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="tx-list">
          {filteredTransactions.map((tx) => {
            const sent = isSent(tx);
            const tokenTx = isTokenTx(tx);

            return (
              <div
                key={tx.hash}
                className={`tx-item ${expandedTx === tx.hash ? 'expanded' : ''}`}
                onClick={() => setExpandedTx(expandedTx === tx.hash ? null : tx.hash)}
              >
                <div className="tx-summary">
                  <div className="tx-icon">
                    {tx.result === 'rejected' ? (
                      <span className="tx-icon-badge rejected">!</span>
                    ) : sent ? (
                      <span className="tx-icon-badge sent">&uarr;</span>
                    ) : (
                      <span className="tx-icon-badge received">&darr;</span>
                    )}
                  </div>
                  <div className="tx-info">
                    <span className="tx-type">{getTypeLabel(tx)}</span>
                    <span className="tx-date">{formatDate(tx.blockTime)}</span>
                  </div>
                  <div className="tx-amount">
                    {tokenTx ? (
                      <span className={sent ? 'amount-sent' : 'amount-received'}>
                        {sent ? '-' : '+'}{getTokenDisplayAmount(tx)}
                      </span>
                    ) : tx.amount ? (
                      <span className={sent ? 'amount-sent' : 'amount-received'}>
                        {sent ? '-' : '+'}{formatAmount(tx.amount)} CCD
                      </span>
                    ) : null}
                    <span className={`tx-status ${tx.result}`}>
                      {tx.result === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>

                {expandedTx === tx.hash && (
                  <div className="tx-details-expanded">
                    <div className="detail-row">
                      <span className="label">Hash:</span>
                      <code>{tx.hash}</code>
                    </div>
                    {tx.sender && (
                      <div className="detail-row">
                        <span className="label">From:</span>
                        <code>{tx.sender}</code>
                      </div>
                    )}
                    {tx.destination && (
                      <div className="detail-row">
                        <span className="label">To:</span>
                        <code>{tx.destination}</code>
                      </div>
                    )}
                    {tx.tokenTransfer && (
                      <>
                        <div className="detail-row">
                          <span className="label">Token:</span>
                          <span>{getTokenDisplayAmount(tx)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Contract:</span>
                          <code>{tx.tokenTransfer.contractIndex},{tx.tokenTransfer.contractSubindex}</code>
                        </div>
                      </>
                    )}
                    <div className="detail-row">
                      <span className="label">Cost:</span>
                      <span>{formatAmount(tx.cost)} CCD</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Block:</span>
                      <code>{tx.blockHash.slice(0, 16)}...</code>
                    </div>
                    <a
                      href={`https://testnet.ccdscan.io/?dcount=2&dentity=transaction&dhash=${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
