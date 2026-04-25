const fs = require('fs');
const path = require('path');
const fileContents = fs.readFileSync(path.join(__dirname, 'data', 'holdings.json'), 'utf8');
const { holdings } = JSON.parse(fileContents);
let txnsToInsert = [];
holdings.forEach((h) => {
  if (h.transactions) {
    h.transactions.forEach((t) => {
      txnsToInsert.push({
        userId: 'test-user',
        symbol: h.symbol.toUpperCase(),
        type: t.type || 'BUY',
        quantity: Number(t.quantity),
        avgBuyPrice: Number(t.price),
        date: t.date || new Date().toISOString().split('T')[0]
      });
    });
  }
});
console.log(txnsToInsert.length);
