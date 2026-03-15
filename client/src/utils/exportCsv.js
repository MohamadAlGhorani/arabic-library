/**
 * Export data as a CSV file download.
 * Uses BOM prefix for Arabic/Excel compatibility.
 *
 * @param {string} filename - The filename for the download (e.g., "report.csv")
 * @param {Array<Object>} rows - Array of data objects
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 */
export function exportToCsv(filename, rows, columns) {
  if (!rows.length) return;

  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','))
    .join('\n');

  const csv = '\uFEFF' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
