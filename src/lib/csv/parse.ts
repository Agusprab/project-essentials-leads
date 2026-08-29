export type CsvRow = Record<string, string>;

export function parseCsv(input: string): CsvRow[] {
  const rows = parseCsvRows(input);

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => header.trim());

  return dataRows
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) => {
      const record: CsvRow = {};

      normalizedHeaders.forEach((header, index) => {
        if (header) {
          record[header] = row[index]?.trim() ?? "";
        }
      });

      return record;
    });
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
