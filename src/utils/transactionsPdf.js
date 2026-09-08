import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TYPE_LABELS = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
};

const TYPE_COLORS = {
  expense: [190, 24, 93],
  income: [5, 150, 105],
  transfer: [37, 99, 235],
};

const formatAmount = (amount) =>
  Math.abs(Number(amount || 0)).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const categoryLabel = (categories, value) =>
  categories.find((category) => category.value === value)?.label ||
  value ||
  'Otro';

const periodLabel = (period) => {
  const labels = {
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
  };

  return labels[period] || 'Todo el historial';
};

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const buildCategorySummary = (transactions, categories) => {
  const rows = new Map();

  transactions.forEach((transaction) => {
    if (transaction.type === 'transfer') return;

    const type = transaction.type || 'expense';
    const category = categoryLabel(categories, transaction.category);
    const currency = transaction.currency || 'USD';
    const amount = Math.abs(Number(transaction.amount || 0));
    const key = `${type}::${category}::${currency}`;

    const current = rows.get(key) || {
      type,
      category,
      currency,
      amount: 0,
    };

    current.amount += amount;
    rows.set(key, current);
  });

  return [...rows.values()].sort((a, b) => {
    const typeDifference = a.type.localeCompare(b.type, 'es');

    if (typeDifference !== 0) return typeDifference;

    return b.amount - a.amount;
  });
};

const buildFinalTotals = (transactions) => {
  const totals = new Map();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'income' && transaction.type !== 'expense') {
      return;
    }

    const currency = transaction.currency || 'USD';
    const current = totals.get(currency) || {
      currency,
      income: 0,
      expense: 0,
    };

    const amount = Math.abs(Number(transaction.amount || 0));

    if (transaction.type === 'income') current.income += amount;
    if (transaction.type === 'expense') current.expense += amount;

    totals.set(currency, current);
  });

  return [...totals.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency, 'es')
  );
};

const drawHeader = ({ doc, period, count }) => {
  const width = doc.internal.pageSize.getWidth();

  doc.setFillColor(8, 20, 38);
  doc.rect(0, 0, width, 34, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte de movimientos', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Período: ${periodLabel(period)}`, 14, 23);
  doc.text(`Registros: ${count}`, 14, 29);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-BO')}`,
    width - 14,
    29,
    { align: 'right' }
  );
};

const drawFooter = (doc) => {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, height - 12, width - 14, height - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text('Reporte financiero personal', 14, height - 7);
    doc.text(`Página ${page} de ${pages}`, width - 14, height - 7, {
      align: 'right',
    });
  }
};

export const downloadTransactionsPdf = ({
  transactions,
  categories,
  period,
  filename,
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();

  drawHeader({
    doc,
    period,
    count: transactions.length,
  });

  const movementRows = transactions.map((transaction) => {
    const type = transaction.type || 'expense';

    return [
      transaction.date || '',
      TYPE_LABELS[type] || 'Movimiento',
      categoryLabel(categories, transaction.category),
      normalizeText(transaction.concept || transaction.title || 'Sin concepto'),
      `${formatAmount(transaction.amount)} ${transaction.currency || 'USD'}`,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto']],
    body: movementRows,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 27 },
      1: { cellWidth: 29 },
      2: { cellWidth: 49 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 39, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 1) return;

      const type =
        data.cell.raw === 'Gasto'
          ? 'expense'
          : data.cell.raw === 'Ingreso'
            ? 'income'
            : 'transfer';

      data.cell.styles.textColor = TYPE_COLORS[type];
      data.cell.styles.fontStyle = 'bold';
    },
  });

  const categorySummary = buildCategorySummary(transactions, categories);
  const afterMovements = doc.lastAutoTable.finalY + 12;

  if (afterMovements > pageHeight - 55) {
    doc.addPage();
    drawHeader({
      doc,
      period,
      count: transactions.length,
    });
  }

  const categoryStartY =
    afterMovements > pageHeight - 55 ? 40 : afterMovements;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Resumen por categoría', margin, categoryStartY);

  autoTable(doc, {
    startY: categoryStartY + 5,
    head: [['Tipo', 'Categoría', 'Monto', 'Moneda']],
    body: categorySummary.map((item) => [
      TYPE_LABELS[item.type] || 'Movimiento',
      item.category,
      formatAmount(item.amount),
      item.currency,
    ]),
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.7,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 35, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 0) return;

      const type =
        data.cell.raw === 'Gasto' ? 'expense' : 'income';

      data.cell.styles.textColor = TYPE_COLORS[type];
      data.cell.styles.fontStyle = 'bold';
    },
  });

  const totals = buildFinalTotals(transactions);
  const afterCategorySummary = doc.lastAutoTable.finalY + 12;

  if (afterCategorySummary > pageHeight - 52) {
    doc.addPage();
    drawHeader({
      doc,
      period,
      count: transactions.length,
    });
  }

  const totalsStartY =
    afterCategorySummary > pageHeight - 52 ? 40 : afterCategorySummary;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Totales finales', margin, totalsStartY);

  autoTable(doc, {
    startY: totalsStartY + 5,
    head: [['Moneda', 'Total ingresos', 'Total egresos', 'Balance']],
    body: totals.map((total) => [
      total.currency,
      formatAmount(total.income),
      formatAmount(total.expense),
      formatAmount(total.income - total.expense),
    ]),
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: [203, 213, 225],
      lineWidth: 0.12,
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 55, halign: 'right', textColor: [5, 150, 105] },
      2: { cellWidth: 55, halign: 'right', textColor: [190, 24, 93] },
      3: { cellWidth: 55, halign: 'right' },
    },
  });

  drawFooter(doc);
  doc.save(filename);
};