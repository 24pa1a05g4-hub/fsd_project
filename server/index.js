import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

app.use(cors());
app.use(express.json());

const friends = [
  { id: 'ava', name: 'Ava', color: '#7c6cf6' },
  { id: 'noah', name: 'Noah', color: '#32d6a6' },
  { id: 'liam', name: 'Liam', color: '#ff9f43' },
  { id: 'mia', name: 'Mia', color: '#ff5d8f' },
];

const expenses = [
  {
    id: 'exp-1',
    title: 'Groceries',
    amount: 240,
    paidBy: 'ava',
    splitAmong: ['ava', 'noah', 'liam', 'mia'],
    date: '2026-10-14',
  },
  {
    id: 'exp-2',
    title: 'Dinner',
    amount: 180,
    paidBy: 'noah',
    splitAmong: ['noah', 'ava', 'mia'],
    date: '2026-10-17',
  },
  {
    id: 'exp-3',
    title: 'Movie tickets',
    amount: 96,
    paidBy: 'liam',
    splitAmong: ['liam', 'ava', 'mia'],
    date: '2026-10-18',
  },
];

const getFriendMap = () => Object.fromEntries(friends.map((friend) => [friend.id, friend]));

const calculateSplit = (amount, participants) => {
  if (!participants || participants.length === 0) return 0;
  return Number((amount / participants.length).toFixed(2));
};

const getDashboard = () => {
  const friendMap = getFriendMap();
  const totals = Object.fromEntries(friends.map((friend) => [friend.id, { paid: 0, owes: 0, net: 0, share: 0 }]));

  expenses.forEach((expense) => {
    const splitValue = calculateSplit(expense.amount, expense.splitAmong);
    totals[expense.paidBy].paid += expense.amount;

    expense.splitAmong.forEach((memberId) => {
      totals[memberId].owes += splitValue;
    });
  });

  friends.forEach((friend) => {
    const record = totals[friend.id];
    record.net = Number((record.paid - record.owes).toFixed(2));
    record.share = Number(record.owes.toFixed(2));
  });

  const summary = {
    totalSpent: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    averagePerFriend: Number((expenses.reduce((sum, expense) => sum + expense.amount, 0) / friends.length).toFixed(2)),
    unsettled: friends.filter((friend) => totals[friend.id].net !== 0).length,
  };

  const balances = friends.map((friend) => ({
    ...friend,
    paid: totals[friend.id].paid,
    owes: totals[friend.id].owes,
    net: totals[friend.id].net,
    share: totals[friend.id].share,
  }));

  return {
    friends: friends.map((friend) => ({ ...friend })),
    expenses: expenses.map((expense) => ({
      ...expense,
      memberNames: expense.splitAmong.map((id) => friendMap[id]?.name || id),
      paidByName: friendMap[expense.paidBy]?.name || expense.paidBy,
      splitValue: calculateSplit(expense.amount, expense.splitAmong),
    })),
    balances,
    summary,
  };
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Expense tracker backend is running' });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(getDashboard());
});

app.post('/api/friends', (req, res) => {
  const { name } = req.body || {};
  const trimmed = String(name || '').trim();

  if (!trimmed) {
    return res.status(400).json({ message: 'Friend name is required.' });
  }

  const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (friends.some((friend) => friend.id === id)) {
    return res.status(409).json({ message: 'Friend already exists.' });
  }

  const newFriend = {
    id,
    name: trimmed,
    color: ['#7c6cf6', '#32d6a6', '#ff9f43', '#ff5d8f', '#5fa8ff', '#f7b267'][friends.length % 6],
  };

  friends.push(newFriend);
  return res.status(201).json(newFriend);
});

app.post('/api/expenses', (req, res) => {
  const { title, amount, paidBy, splitAmong } = req.body || {};

  const validAmount = Number(amount);
  if (!title || !Number.isFinite(validAmount) || validAmount <= 0) {
    return res.status(400).json({ message: 'Valid title and amount are required.' });
  }

  if (!paidBy || !friends.some((friend) => friend.id === paidBy)) {
    return res.status(400).json({ message: 'A valid payer is required.' });
  }

  const participants = Array.isArray(splitAmong) && splitAmong.length > 0
    ? splitAmong.filter((id) => friends.some((friend) => friend.id === id))
    : friends.map((friend) => friend.id);

  if (participants.length === 0) {
    return res.status(400).json({ message: 'At least one participant is required.' });
  }

  const newExpense = {
    id: `exp-${Date.now()}`,
    title: String(title).trim(),
    amount: Number(validAmount.toFixed(2)),
    paidBy,
    splitAmong: participants,
    date: new Date().toISOString().slice(0, 10),
  };

  expenses.unshift(newExpense);
  return res.status(201).json(newExpense);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
