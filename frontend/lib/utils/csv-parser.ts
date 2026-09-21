export interface ParsedProductRow {
  rowNumber: number;
  data: {
    nameVi: string;
    nameEn: string;
    slug: string;
    descriptionVi?: string;
    descriptionEn?: string;
    originalPrice: number;
    salePrice?: number;
    stockQuantity: number;
    categorySlug?: string;
    status?: 'active' | 'inactive' | 'out_of_stock';
    featured?: boolean;
    categoryId?: number;
  };
  errors: string[];
  warnings: string[];
}

export interface ParseResult {
  valid: ParsedProductRow[];
  invalid: ParsedProductRow[];
  totalRows: number;
}

const REQUIRED_FIELDS = ['nameVi', 'nameEn', 'slug', 'originalPrice', 'stockQuantity'];
const FIELD_MAPPING: Record<string, string> = {
  'Tên (Tiếng Việt)': 'nameVi',
  'Tên (English)': 'nameEn',
  'Tên Tiếng Việt': 'nameVi',
  'Tên English': 'nameEn',
  'Name (Vietnamese)': 'nameVi',
  'Name (English)': 'nameEn',
  'Name Vietnamese': 'nameVi',
  'Name English': 'nameEn',
  Slug: 'slug',
  'Mô tả (Tiếng Việt)': 'descriptionVi',
  'Mô tả (English)': 'descriptionEn',
  'Mô tả Tiếng Việt': 'descriptionVi',
  'Mô tả English': 'descriptionEn',
  'Description (Vietnamese)': 'descriptionVi',
  'Description (English)': 'descriptionEn',
  'Description Vietnamese': 'descriptionVi',
  'Description English': 'descriptionEn',
  'Giá gốc': 'originalPrice',
  'Original Price': 'originalPrice',
  'Giá bán': 'salePrice',
  'Sale Price': 'salePrice',
  'Số lượng': 'stockQuantity',
  'Stock Quantity': 'stockQuantity',
  'Danh mục': 'categorySlug',
  'Category': 'categorySlug',
  'Trạng thái': 'status',
  'Status': 'status',
  'Nổi bật': 'featured',
  'Featured': 'featured',
};

function normalizeFieldName(fieldName: string): string {
  const trimmed = fieldName.trim();
  return FIELD_MAPPING[trimmed] || trimmed.toLowerCase().replace(/\s+/g, '');
}

function parseValue(value: string, fieldName: string): any {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  switch (fieldName) {
    case 'originalPrice':
    case 'salePrice':
      const num = parseFloat(trimmed.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? undefined : num;
    case 'stockQuantity':
      const int = parseInt(trimmed, 10);
      return isNaN(int) ? 0 : int;
    case 'featured':
      return trimmed.toLowerCase() === 'true' || trimmed === '1' || trimmed.toLowerCase() === 'yes';
    case 'status':
      const status = trimmed.toLowerCase();
      if (['active', 'inactive', 'out_of_stock'].includes(status)) {
        return status;
      }
      return 'active';
    default:
      return trimmed;
  }
}

function validateRow(row: any, rowNumber: number, headers: string[]): ParsedProductRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: any = {};

  // Map headers to normalized field names
  const headerMap: Record<string, string> = {};
  headers.forEach((header, index) => {
    const normalized = normalizeFieldName(header);
    headerMap[normalized] = header;
  });

  // Parse each field
  headers.forEach((header, index) => {
    const normalized = normalizeFieldName(header);
    const value = row[header] || row[index] || '';
    const parsed = parseValue(value, normalized);

    if (normalized === 'nameVi' || normalized === 'nameEn' || normalized === 'slug') {
      data[normalized] = parsed || '';
    } else if (normalized === 'originalPrice' || normalized === 'stockQuantity') {
      data[normalized] = parsed !== undefined ? parsed : (normalized === 'stockQuantity' ? 0 : 0);
    } else if (parsed !== undefined) {
      data[normalized] = parsed;
    }
  });

  // Validate required fields
  REQUIRED_FIELDS.forEach((field) => {
    if (!data[field] && data[field] !== 0) {
      errors.push(`${field} is required`);
    }
  });

  // Validate price
  if (data.originalPrice !== undefined && data.originalPrice < 0) {
    errors.push('Original price must be >= 0');
  }

  if (data.salePrice !== undefined && data.salePrice < 0) {
    errors.push('Sale price must be >= 0');
  }

  if (data.salePrice !== undefined && data.originalPrice !== undefined && data.salePrice > data.originalPrice) {
    warnings.push('Sale price is greater than original price');
  }

  // Validate stock
  if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
    errors.push('Stock quantity must be >= 0');
  }

  // Validate slug format
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  return {
    rowNumber,
    data: data as ParsedProductRow['data'],
    errors,
    warnings,
  };
}

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Parse data rows
  const valid: ParsedProductRow[] = [];
  const invalid: ParsedProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const parsed = validateRow(row, i + 1, headers);

    if (parsed.errors.length > 0) {
      invalid.push(parsed);
    } else {
      valid.push(parsed);
    }
  }

  return {
    valid,
    invalid,
    totalRows: lines.length - 1,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((field) => field.trim());
}

export function generateSampleCSV(): string {
  const headers = [
    'Tên (Tiếng Việt)',
    'Tên (English)',
    'Slug',
    'Mô tả (Tiếng Việt)',
    'Mô tả (English)',
    'Giá gốc',
    'Giá bán',
    'Số lượng',
    'Danh mục',
    'Trạng thái',
    'Nổi bật',
  ];

  const sampleRows = [
    [
      'Áo thun nam',
      'Men T-Shirt',
      'ao-thun-nam',
      'Áo thun nam chất lượng cao',
      'High quality men t-shirt',
      '200000',
      '150000',
      '100',
      'ao-thun',
      'active',
      'true',
    ],
    [
      'Quần jean nữ',
      'Women Jeans',
      'quan-jean-nu',
      'Quần jean nữ form đẹp',
      'Beautiful fit women jeans',
      '500000',
      '',
      '50',
      'quan',
      'active',
      'false',
    ],
  ];

  return [headers.join(','), ...sampleRows.map((row) => row.join(','))].join('\n');
}

