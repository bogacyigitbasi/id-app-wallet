import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { formatCCD } from '../services/concordium';

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
    if (filter === 'sent') return tx.sender === activeAccount?.address;
    if (filter === 'received') return tx.destination === activeAccount?.address;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer': return 'Transfer';
      case 'transferWithMemo': return 'Transfer';
      case 'update': return 'Contract Update';
      case 'initContract': return 'Contract Init';
      case 'deployModule': return 'Module Deploy';
      case 'credentialDeployment': return 'Account Creation';
      case 'configureBaker': return 'Validator Config';
      case 'configureDelegation': return 'Delegation Config';
      default: return type;
    }
  };

  const isSent = (tx: typeof transactions[0]) => tx.sender === activeAccount?.address;

  const formatAmount = (amount?: string) => {
    if (!amount) return '';
    try {
      const microCCD = BigInt(amount);
      return formatCCD(microCCD);
    } catch {
      return amount;
    }
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
          {filteredTransactions.map((tx) => (
            <div
              key={tx.hash}
              className={`tx-item ${expandedTx === tx.hash ? 'expanded' : ''}`}
              onClick={() => setExpandedTx(expandedTx === tx.hash ? null : tx.hash)}
            >
              <div className="tx-summary">
                <div className="tx-icon">
                  {tx.result === 'rejected' ? (
                    <span className="tx-icon-badge rejected">!</span>
                  ) : isSent(tx) ? (
                    <span className="tx-icon-badge sent">&uarr;</span>
                  ) : (
                    <span className="tx-icon-badge received">&darr;</span>
                  )}
                </div>
                <div className="tx-info">
                  <span className="tx-type">{getTypeLabel(tx.type)}</span>
                  <span className="tx-date">{formatDate(tx.blockTime)}</span>
                </div>
                <div className="tx-amount">
                  {tx.amount && (
                    <span className={isSent(tx) ? 'amount-sent' : 'amount-received'}>
                      {isSent(tx) ? '-' : '+'}{formatAmount(tx.amount)} CCD
                    </span>
                  )}
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
                  <div className="detail-row">
                    <span className="label">Cost:</span>
                    <span>{formatAmount(tx.cost)} CCD</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Block:</span>
                    <code>{tx.blockHash.slice(0, 16)}...</code>
                  </div>
                  <a
                    href={`https://testnet.ccdscan.io/transactions/${tx.hash}`}
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
          ))}
        </div>
      )}
    </div>
  );
}
