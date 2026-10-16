export interface ExportParams {
  holdings: any[];
  watchlist: any[];
  aiResults: any[];
  selectedCurrency: string;
  convertValue: (val: number, fromCurrency?: string) => number;
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalPortfolioDividends: number;
  totalDailyChange: number;
  avgYield: number;
}

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildHoldingsRows(params: ExportParams) {
  const { holdings, aiResults, selectedCurrency, convertValue, totalMarketValue } = params;

  const headers = [
    'Symbol',
    'Shares',
    `Avg Buy Price (${selectedCurrency})`,
    `Current Price (${selectedCurrency})`,
    'Portfolio %',
    `Market Value (${selectedCurrency})`,
    `Daily Change (${selectedCurrency})`,
    'Daily Change %',
    `Unrealized P/L (${selectedCurrency})`,
    'Unrealized P/L %',
    'Div Yield %',
    `Received Dividends (${selectedCurrency})`,
    'AI GARP Score',
    'AI Moat Score',
    'AI Value Score',
    'Sector',
    'Industry',
  ];

  const rows = holdings.map((h) => {
    const avgBuy = convertValue(h.avgBuyPrice || 0, h.currency);
    const curPrice = convertValue(h.currentPrice || 0, h.currency);
    const mktVal = convertValue(h.marketValue || 0, h.currency);
    const portPct = totalMarketValue > 0 && h.marketValue ? (mktVal / totalMarketValue) * 100 : 0;
    const dailyChg = convertValue((h.dailyChange || 0) * (h.quantity || 0), h.currency);
    const dailyChgPct = h.dailyChangePct || 0;
    const unrlPL = convertValue(h.unrealizedPL || 0, h.currency);
    const unrlPLPct = h.unrealizedPLPercent ?? h.unrealizedPLPct ?? 0;
    const yieldPct = h.yieldPct || 0;
    const divs = convertValue(h.totalDividendsReceived || 0, h.currency);
    const aiData = aiResults.find((r) => r.symbol === h.symbol);

    return [
      h.symbol || '',
      Number((h.quantity || 0).toFixed(4)),
      Number(avgBuy.toFixed(2)),
      Number(curPrice.toFixed(2)),
      Number(portPct.toFixed(2)),
      Number(mktVal.toFixed(2)),
      Number(dailyChg.toFixed(2)),
      Number(dailyChgPct.toFixed(2)),
      Number(unrlPL.toFixed(2)),
      Number(unrlPLPct.toFixed(2)),
      Number(yieldPct.toFixed(2)),
      Number(divs.toFixed(2)),
      aiData ? aiData.garpScore : '',
      aiData ? aiData.moatScore : '',
      aiData ? aiData.valueScore : '',
      h.sector || 'Unknown',
      h.industry || 'Unknown',
    ];
  });

  const totalPLPct = params.totalCostBasis > 0 ? (params.totalUnrealizedPL / params.totalCostBasis) * 100 : 0;
  const totalDailyPct = totalMarketValue > 0 ? (params.totalDailyChange / totalMarketValue) * 100 : 0;

  const summaryRow = [
    'TOTAL / PORTFOLIO SUMMARY',
    '',
    Number(params.totalCostBasis.toFixed(2)),
    '',
    100,
    Number(totalMarketValue.toFixed(2)),
    Number(params.totalDailyChange.toFixed(2)),
    Number(totalDailyPct.toFixed(2)),
    Number(params.totalUnrealizedPL.toFixed(2)),
    Number(totalPLPct.toFixed(2)),
    Number(params.avgYield.toFixed(2)),
    Number(params.totalPortfolioDividends.toFixed(2)),
    '',
    '',
    '',
    '',
    '',
  ];

  return { headers, rows, summaryRow };
}

/**
 * Downloads a UTF-8 BOM CSV file compatible with Excel and Google Sheets.
 */
export function exportPortfolioToCsv(params: ExportParams) {
  const { headers, rows, summaryRow } = buildHoldingsRows(params);
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    '',
    summaryRow.map(escapeCsvCell).join(','),
  ];

  // Prefix with UTF-8 BOM (\uFEFF) so Excel opens symbols and currencies properly
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(blob, `portfolio_holdings_${dateStr}.csv`);
}

/**
 * Downloads a multi-sheet Excel Workbook (.xls SpreadsheetML) containing:
 * 1. Holdings Summary
 * 2. Transactions Ledger
 * 3. Watchlist
 */
export function exportPortfolioToExcel(params: ExportParams) {
  const { headers, rows, summaryRow } = buildHoldingsRows(params);

  const renderXmlRow = (cells: any[], styleId?: string) => {
    const cellXml = cells
      .map((cell) => {
        const isNumber = typeof cell === 'number' && !Number.isNaN(cell);
        const type = isNumber ? 'Number' : 'String';
        const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : '';
        return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
      })
      .join('');
    return `<Row>${cellXml}</Row>`;
  };

  // Sheet 1: Holdings
  const holdingsXmlRows = [
    renderXmlRow(headers, 'Header'),
    ...rows.map((r) => renderXmlRow(r)),
    renderXmlRow(summaryRow, 'Summary'),
  ].join('\n');

  // Sheet 2: Transactions Ledger
  const txnHeaders = ['Symbol', 'Type', 'Quantity', 'Price', 'Date'];
  const txnRows: any[][] = [];
  params.holdings.forEach((h) => {
    if (Array.isArray(h.transactions)) {
      h.transactions.forEach((t: any) => {
        txnRows.push([
          h.symbol || '',
          t.type || 'BUY',
          Number(t.quantity || 0),
          Number(t.price ?? t.avgBuyPrice ?? 0),
          t.date || '',
        ]);
      });
    }
  });
  const txnXmlRows = [
    renderXmlRow(txnHeaders, 'Header'),
    ...txnRows.map((r) => renderXmlRow(r)),
  ].join('\n');

  // Sheet 3: Watchlist
  const watchlistHeaders = [
    'Symbol',
    'Company Name',
    `Current Price (${params.selectedCurrency})`,
    'Daily Change %',
    'Added Price',
    'Since Added %',
    'Starred',
  ];
  const watchlistRows = (params.watchlist || []).map((w) => [
    w.symbol || '',
    w.name || w.symbol || '',
    Number(params.convertValue(w.price || 0, w.currency).toFixed(2)),
    Number((w.change || 0).toFixed(2)),
    w.addedPrice ? Number(params.convertValue(w.addedPrice, w.currency).toFixed(2)) : '',
    w.sinceAddedChangePct ? Number(w.sinceAddedChangePct.toFixed(2)) : '',
    w.isStarred ? 'Yes' : 'No',
  ]);
  const watchlistXmlRows = [
    renderXmlRow(watchlistHeaders, 'Header'),
    ...watchlistRows.map((r) => renderXmlRow(r)),
  ].join('\n');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Summary">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Holdings">
  <Table>
   ${holdingsXmlRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Transactions">
  <Table>
   ${txnXmlRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Watchlist">
  <Table>
   ${watchlistXmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(blob, `portfolio_workbook_${dateStr}.xls`);
}

/**
 * Copies Tab-Separated Values (TSV) to the clipboard so the user can paste
 * directly into Google Sheets (Ctrl+V / Cmd+V) with automatic column splitting.
 */
export async function copyPortfolioForGoogleSheets(params: ExportParams): Promise<void> {
  const { headers, rows, summaryRow } = buildHoldingsRows(params);
  const tsvLines = [
    headers.join('\t'),
    ...rows.map((r) => r.map((cell) => (cell === null || cell === undefined ? '' : String(cell))).join('\t')),
    summaryRow.map((cell) => (cell === null || cell === undefined ? '' : String(cell))).join('\t'),
  ];
  await navigator.clipboard.writeText(tsvLines.join('\n'));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
