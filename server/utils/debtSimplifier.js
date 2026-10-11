/**
 * Debt Simplification Utility using a greedy bipartite matching algorithm
 * 
 * 1. Computes net balances for all trip members from real expenses:
 *    net balance = (total amount paid by user) - (total amount owed by user)
 * 2. Positive balance => creditor (should receive money)
 * 3. Negative balance => debtor (owes money)
 * 4. Greedily pairs the largest debtor with the largest creditor until all debts settle.
 */

function roundTwoDecimals(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates debt settlements for a list of expenses, settled payments, and members
 * @param {Array} expenses - Array of Mongoose Expense documents (populated with paidBy and participants.user)
 * @param {Array} members - Array of Trip member User objects (with _id, name, email)
 * @param {String} baseCurrency - Currency code of the trip (e.g. 'USD', 'INR')
 * @param {Array} settledPayments - Array of settled settlement payment records
 * @returns {Object} { balances: Array, settlements: Array, totalExpense: Number, settledPayments: Array }
 */
function simplifyDebts(expenses, members, baseCurrency = 'USD', settledPayments = []) {
  // Map to store net balance per user ID: balanceMap[userId] = { user, net: 0, paid: 0, owed: 0 }
  const balanceMap = new Map();

  // Initialize with all trip members
  members.forEach((member) => {
    const userId = member._id ? member._id.toString() : member.toString();
    balanceMap.set(userId, {
      id: userId,
      name: member.name || 'Member',
      email: member.email || '',
      paid: 0,
      owed: 0,
      net: 0,
    });
  });

  let totalTripSpending = 0;

  // Aggregate paid amounts and owed amounts from expenses
  expenses.forEach((expense) => {
    const expenseAmount = expense.convertedAmount != null ? Number(expense.convertedAmount) : Number(expense.amount);
    totalTripSpending += expenseAmount;

    // Credit the payer
    const payerId = expense.paidBy?._id
      ? expense.paidBy._id.toString()
      : expense.paidBy?.toString();

    if (payerId) {
      if (!balanceMap.has(payerId)) {
        balanceMap.set(payerId, {
          id: payerId,
          name: expense.paidBy.name || 'Unknown',
          email: expense.paidBy.email || '',
          paid: 0,
          owed: 0,
          net: 0,
        });
      }
      const payerRecord = balanceMap.get(payerId);
      payerRecord.paid += expenseAmount;
    }

    // Debit participants based on their allocated amounts
    if (Array.isArray(expense.participants)) {
      expense.participants.forEach((part) => {
        const participantId = part.user?._id
          ? part.user._id.toString()
          : part.user?.toString();

        if (participantId) {
          if (!balanceMap.has(participantId)) {
            balanceMap.set(participantId, {
              id: participantId,
              name: part.user.name || 'Unknown',
              email: part.user.email || '',
              paid: 0,
              owed: 0,
              net: 0,
            });
          }
          const partRecord = balanceMap.get(participantId);
          const allocated = part.allocatedAmount != null ? Number(part.allocatedAmount) : 0;
          partRecord.owed += allocated;
        }
      });
    }
  });

  // Factor in directly recorded settlements (settledPayments)
  // When 'from' pays 'to', from's paid balance increases by payment, and to's received balance adjusts
  if (Array.isArray(settledPayments)) {
    settledPayments.forEach((p) => {
      const fromId = p.fromId ? p.fromId.toString() : null;
      const toId = p.toId ? p.toId.toString() : null;
      const amt = Number(p.amount) || 0;

      if (fromId && balanceMap.has(fromId)) {
        balanceMap.get(fromId).paid += amt;
      }
      if (toId && balanceMap.has(toId)) {
        balanceMap.get(toId).owed += amt;
      }
    });
  }

  // Calculate net balances
  const balances = [];
  const debtors = []; // negative net
  const creditors = []; // positive net

  balanceMap.forEach((entry) => {
    entry.paid = roundTwoDecimals(entry.paid);
    entry.owed = roundTwoDecimals(entry.owed);
    entry.net = roundTwoDecimals(entry.paid - entry.owed);

    balances.push(entry);

    if (entry.net < -0.01) {
      debtors.push({
        id: entry.id,
        name: entry.name,
        amount: Math.abs(entry.net),
      });
    } else if (entry.net > 0.01) {
      creditors.push({
        id: entry.id,
        name: entry.name,
        amount: entry.net,
      });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = roundTwoDecimals(Math.min(debtor.amount, creditor.amount));

    if (settledAmount > 0) {
      settlements.push({
        from: debtor.name,
        fromId: debtor.id,
        to: creditor.name,
        toId: creditor.id,
        amount: settledAmount,
        currency: baseCurrency,
        isSettled: false,
      });

      debtor.amount = roundTwoDecimals(debtor.amount - settledAmount);
      creditor.amount = roundTwoDecimals(creditor.amount - settledAmount);
    }

    if (debtor.amount < 0.01) {
      dIdx++;
    }
    if (creditor.amount < 0.01) {
      cIdx++;
    }
  }

  return {
    totalSpending: roundTwoDecimals(totalTripSpending),
    currency: baseCurrency,
    balances,
    settlements,
    settledPayments: settledPayments || [],
  };
}

module.exports = {
  simplifyDebts,
  roundTwoDecimals,
};
