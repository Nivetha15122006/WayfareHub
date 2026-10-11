/**
 * Export trip expenses to clean standard CSV (compatible with Excel & Sheets)
 */
export const exportExpensesToCSV = (trip, expenses = [], settlements = []) => {
  if (!expenses || expenses.length === 0) {
    alert('No expenses recorded yet to export.');
    return;
  }

  const baseCurrency = trip?.baseCurrency || 'USD';
  const headers = [
    'Date',
    'Description',
    'Category',
    'Paid By',
    'Original Amount',
    'Currency',
    'FX Exchange Rate',
    `Converted Amount (${baseCurrency})`,
    'Split Type',
    'Participants Count',
    'Notes',
  ];

  const rows = expenses.map((exp) => {
    const dateStr = new Date(exp.date).toLocaleDateString();
    const desc = `"${(exp.description || '').replace(/"/g, '""')}"`;
    const cat = `"${exp.category || 'Miscellaneous'}"`;
    const payer = `"${(exp.paidBy?.name || 'Unknown').replace(/"/g, '""')}"`;
    const origAmt = typeof exp.amount === 'number' ? exp.amount.toFixed(2) : exp.amount;
    const curr = exp.currency;
    const rate = exp.exchangeRate || 1.0;
    const convAmt = typeof exp.convertedAmount === 'number' ? exp.convertedAmount.toFixed(2) : exp.convertedAmount;
    const splitType = exp.splitType || 'equal';
    const participantsCount = exp.participants?.length || 1;
    const notes = `"${(exp.notes || '').replace(/"/g, '""')}"`;

    return [
      dateStr,
      desc,
      cat,
      payer,
      origAmt,
      curr,
      rate,
      convAmt,
      splitType,
      participantsCount,
      notes,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedTitle = (trip?.title || 'Trip').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizedTitle}_Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates an official, printable financial report in a new print window
 */
export const printExpenseReport = (trip, expenses = [], settlements = [], balances = []) => {
  if (!expenses || expenses.length === 0) {
    alert('No expenses recorded yet to print.');
    return;
  }

  const baseCurrency = trip?.baseCurrency || 'USD';
  const totalSpending = expenses.reduce((sum, e) => sum + (e.convertedAmount || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for WayfareHub to print the report.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${trip.title} - Expense Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand-title { font-size: 24px; font-weight: 800; color: #0f766e; margin: 0; }
          .brand-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
          .trip-name { font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 6px 0; }
          .trip-meta { font-size: 13px; color: #475569; }
          .summary-grid { display: flex; gap: 20px; margin-bottom: 28px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 20px; flex: 1; }
          .summary-card h4 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .summary-card p { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
          .text-right { text-align: right; }
          .settlement-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-top: 20px; }
          .settlement-title { font-size: 14px; font-weight: 700; color: #065f46; margin: 0 0 10px 0; }
          .settlement-item { font-size: 13px; color: #047857; margin-bottom: 6px; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">WayfareHub</h1>
            <p class="brand-sub">Travel & Foreign Exchange Financial Statement</p>
            <div class="trip-name">${trip.title}</div>
            <div class="trip-meta">Destination: <strong>${trip.destination}</strong> • Base Currency: <strong>${baseCurrency}</strong></div>
            <div class="trip-meta">Dates: ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #64748b;">Generated On</div>
            <div style="font-size: 14px; font-weight: 700;">${new Date().toLocaleDateString()}</div>
            <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 8px 16px; background: #0f766e; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Statement</button>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h4>Total Group Expenditure</h4>
            <p>${totalSpending.toFixed(2)} ${baseCurrency}</p>
          </div>
          <div class="summary-card">
            <h4>Transactions Logged</h4>
            <p>${expenses.length} Records</p>
          </div>
          <div class="summary-card">
            <h4>Travelers</h4>
            <p>${trip.members?.length || 1} Members</p>
          </div>
        </div>

        <h3>Itemized Group Ledger</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Paid By</th>
              <th class="text-right">Original Paid</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Total (${baseCurrency})</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .map(
                (e) => `
              <tr>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td><strong>${e.description}</strong>${e.notes ? `<br><small style="color: #64748b;">${e.notes}</small>` : ''}</td>
                <td>${e.category || 'Misc'}</td>
                <td>${e.paidBy?.name || 'Unknown'}</td>
                <td class="text-right">${typeof e.amount === 'number' ? e.amount.toFixed(2) : e.amount} ${e.currency}</td>
                <td class="text-right">${e.exchangeRate || 1.0}</td>
                <td class="text-right"><strong>${typeof e.convertedAmount === 'number' ? e.convertedAmount.toFixed(2) : e.convertedAmount}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${
          settlements && settlements.length > 0
            ? `
          <div class="settlement-box">
            <h4 class="settlement-title">Recommended Simplified Settlements (Greedy Min-Cash-Flow)</h4>
            ${settlements
              .map(
                (s) => `
              <div class="settlement-item">• <strong>${s.from}</strong> pays <strong>${s.to}</strong>: <strong>${s.amount.toFixed(2)} ${baseCurrency}</strong></div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="footer">
          WayfareHub Travel & FX Orchestrator • European Central Bank (Frankfurter) FX Rates
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
