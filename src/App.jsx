import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  title: '',
  amount: '',
  paidBy: 'ava',
  splitAmong: ['ava', 'noah', 'liam', 'mia'],
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export default function App() {
  const [dashboard, setDashboard] = useState({ friends: [], expenses: [], balances: [], summary: {} });
  const [form, setForm] = useState(initialForm);
  const [friendName, setFriendName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Could not load dashboard');
      const data = await response.json();
      setDashboard(data);
      setForm((current) => ({
        ...current,
        paidBy: data.friends[0]?.id || 'ava',
        splitAmong: data.friends.map((friend) => friend.id),
      }));
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalBalance = useMemo(
    () => dashboard.balances.reduce((sum, balance) => sum + balance.net, 0),
    [dashboard.balances],
  );

  const handleFriendSubmit = async (event) => {
    event.preventDefault();
    if (!friendName.trim()) return;

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: friendName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to add friend');

      setFriendName('');
      await fetchDashboard();
    } catch (addFriendError) {
      setError(addFriendError.message);
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          amount: Number(form.amount),
          paidBy: form.paidBy,
          splitAmong: form.splitAmong,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to add expense');

      setForm({ ...initialForm, paidBy: dashboard.friends[0]?.id || 'ava', splitAmong: dashboard.friends.map((friend) => friend.id) });
      setError('');
      await fetchDashboard();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const toggleParticipant = (id) => {
    setForm((current) => {
      const next = current.splitAmong.includes(id)
        ? current.splitAmong.filter((entry) => entry !== id)
        : [...current.splitAmong, id];

      return { ...current, splitAmong: next };
    });
  };

  const applySplitPreset = (count) => {
    const selectedFriends = dashboard.friends.slice(0, count).map((friend) => friend.id);
    setForm((current) => ({ ...current, splitAmong: selectedFriends }));
  };

  const selectAllParticipants = () => {
    setForm((current) => ({
      ...current,
      splitAmong: dashboard.friends.map((friend) => friend.id),
    }));
  };

  const clearParticipants = () => {
    setForm((current) => ({ ...current, splitAmong: [] }));
  };

  if (loading) {
    return <div className="loading-shell">Loading your split dashboard…</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Friends budget</p>
          <h1>Splitly</h1>
        </div>
        <div className="status-pill">{dashboard.summary.unsettled || 0} uneven balances</div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="dashboard-grid">
        <section className="panel hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Group summary</p>
            <h2>Keep everyone in sync.</h2>
            <p>
              Track shared costs, settle balances, and see who owes what after every trip or dinner.
            </p>
          </div>
          <div className="summary-cards">
            <div className="summary-card accent">
              <span>Total spend</span>
              <strong>{currency.format(dashboard.summary.totalSpent || 0)}</strong>
            </div>
            <div className="summary-card">
              <span>Average / friend</span>
              <strong>{currency.format(dashboard.summary.averagePerFriend || 0)}</strong>
            </div>
          </div>
        </section>

        <section className="panel balance-panel">
          <div className="panel-header">
            <h3>Balances</h3>
            <span>{currency.format(totalBalance)}</span>
          </div>
          <div className="balance-list">
            {dashboard.balances.map((friend) => (
              <div key={friend.id} className="friend-balance">
                <div className="avatar" style={{ background: friend.color }}>
                  {friend.name.slice(0, 1)}
                </div>
                <div className="friend-meta">
                  <strong>{friend.name}</strong>
                  <small>{friend.net >= 0 ? 'Should receive' : 'Owes'}</small>
                </div>
                <div className={`balance-amount ${friend.net >= 0 ? 'positive' : 'negative'}`}>
                  {currency.format(Math.abs(friend.net))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel form-panel">
          <div className="panel-header">
            <h3>Add expense</h3>
          </div>
          <form onSubmit={handleExpenseSubmit} className="expense-form">
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Brunch, tickets, rent..."
              />
            </label>

            <div className="two-col">
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="0.00"
                />
              </label>

              <label>
                Paid by
                <select value={form.paidBy} onChange={(event) => setForm({ ...form, paidBy: event.target.value })}>
                  {dashboard.friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>{friend.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="preset-row">
              {[2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="mini-btn"
                  onClick={() => applySplitPreset(count)}
                >
                  {count} way
                </button>
              ))}
              <button type="button" className="mini-btn ghost" onClick={selectAllParticipants}>
                All
              </button>
              <button type="button" className="mini-btn ghost" onClick={clearParticipants}>
                Clear
              </button>
            </div>

            <div className="checklist">
              {dashboard.friends.map((friend) => (
                <label key={friend.id} className="check-option">
                  <input
                    type="checkbox"
                    checked={form.splitAmong.includes(friend.id)}
                    onChange={() => toggleParticipant(friend.id)}
                  />
                  <span>{friend.name}</span>
                </label>
              ))}
            </div>

            <button type="submit" className="primary-btn">Save expense</button>
          </form>
        </section>

        <section className="panel friend-panel">
          <div className="panel-header">
            <h3>Friends</h3>
          </div>
          <form onSubmit={handleFriendSubmit} className="friend-form">
            <input
              value={friendName}
              onChange={(event) => setFriendName(event.target.value)}
              placeholder="Add a friend"
            />
            <button type="submit" className="secondary-btn">Add</button>
          </form>
          <div className="friend-chips">
            {dashboard.friends.map((friend) => (
              <div key={friend.id} className="chip" style={{ background: `${friend.color}20`, color: friend.color }}>
                {friend.name}
              </div>
            ))}
          </div>
        </section>

        <section className="panel expenses-panel">
          <div className="panel-header">
            <h3>Recent activity</h3>
          </div>
          <div className="expense-list">
            {dashboard.expenses.map((expense) => (
              <article key={expense.id} className="expense-item">
                <div className="expense-main">
                  <div className="expense-title-row">
                    <strong>{expense.title}</strong>
                    <span>{currency.format(expense.amount)}</span>
                  </div>
                  <div className="expense-meta">
                    <span>Paid by {expense.paidByName}</span>
                    <span>{expense.date}</span>
                  </div>
                </div>
                <div className="expense-split">
                  {expense.memberNames.join(' • ')}
                  <small>{currency.format(expense.splitValue)} each</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
