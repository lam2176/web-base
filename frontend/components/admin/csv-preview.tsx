'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ParsedProductRow } from '@/lib/utils/csv-parser';

interface CsvPreviewProps {
  valid: ParsedProductRow[];
  invalid: ParsedProductRow[];
  totalRows: number;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
  locale: string;
}

export default function CsvPreview({
  valid,
  invalid,
  totalRows,
  onConfirm,
  onCancel,
  isImporting,
  locale,
}: CsvPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg font-bold text-blue-600">{totalRows}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {locale === 'vi' ? 'Tổng số dòng' : 'Total rows'}
              </p>
              <p className="text-xs text-gray-500">
                {locale === 'vi' ? 'Trong file CSV' : 'In CSV file'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {valid.length} {locale === 'vi' ? 'hợp lệ' : 'valid'}
              </p>
              <p className="text-xs text-gray-500">
                {locale === 'vi' ? 'Sẵn sàng import' : 'Ready to import'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {invalid.length} {locale === 'vi' ? 'lỗi' : 'invalid'}
              </p>
              <p className="text-xs text-gray-500">
                {locale === 'vi' ? 'Cần sửa trước' : 'Need to fix'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Valid Rows Preview */}
      {valid.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {locale === 'vi' ? 'Dữ liệu hợp lệ' : 'Valid Data'} ({valid.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">#</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">
                    {locale === 'vi' ? 'Tên (VN)' : 'Name (VN)'}
                  </th>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">
                    {locale === 'vi' ? 'Tên (EN)' : 'Name (EN)'}
                  </th>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">Slug</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">
                    {locale === 'vi' ? 'Giá' : 'Price'}
                  </th>
                  <th className="p-2 text-left text-xs font-medium text-gray-600">
                    {locale === 'vi' ? 'Tồn kho' : 'Stock'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {valid.slice(0, 10).map((row) => (
                  <tr key={row.rowNumber} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-gray-600">{row.rowNumber}</td>
                    <td className="p-2">{row.data.nameVi}</td>
                    <td className="p-2">{row.data.nameEn}</td>
                    <td className="p-2 text-gray-600">{row.data.slug}</td>
                    <td className="p-2">
                      {row.data.salePrice ? (
                        <span>
                          <span className="text-red-600">{row.data.salePrice.toLocaleString()}</span>
                          <span className="ml-1 text-xs text-gray-400 line-through">
                            {row.data.originalPrice.toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        <span>{row.data.originalPrice.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-2">{row.data.stockQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {valid.length > 10 && (
              <p className="mt-2 text-xs text-gray-500">
                {locale === 'vi'
                  ? `... và ${valid.length - 10} dòng khác`
                  : `... and ${valid.length - 10} more rows`}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Invalid Rows */}
      {invalid.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              {locale === 'vi' ? 'Dữ liệu lỗi' : 'Invalid Data'} ({invalid.length})
            </h3>
          </div>
          <div className="space-y-3">
            {invalid.slice(0, 5).map((row) => (
              <div key={row.rowNumber} className="rounded-md bg-white p-3 border border-red-200">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {locale === 'vi' ? 'Dòng' : 'Row'} {row.rowNumber}:
                  </span>
                  <span className="text-sm text-gray-600">
                    {row.data.nameVi || row.data.nameEn || '(Không có tên)'}
                  </span>
                </div>
                <ul className="ml-4 list-disc space-y-1">
                  {row.errors.map((error, idx) => (
                    <li key={idx} className="text-xs text-red-600">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {invalid.length > 5 && (
              <p className="text-xs text-red-600">
                {locale === 'vi'
                  ? `... và ${invalid.length - 5} dòng lỗi khác`
                  : `... and ${invalid.length - 5} more error rows`}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          {locale === 'vi' ? 'Hủy' : 'Cancel'}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isImporting || valid.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isImporting
            ? locale === 'vi'
              ? 'Đang import...'
              : 'Importing...'
            : locale === 'vi'
              ? `Import ${valid.length} sản phẩm`
              : `Import ${valid.length} products`}
        </Button>
      </div>
    </div>
  );
}

