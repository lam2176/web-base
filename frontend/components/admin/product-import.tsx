'use client';

import { useState, useCallback } from 'react';
import { FileDown, Upload as UploadIcon, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CsvUpload from './csv-upload';
import CsvPreview from './csv-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseCSV, generateSampleCSV, ParsedProductRow } from '@/lib/utils/csv-parser';
import { useImportProducts } from '@/lib/hooks/use-admin';

interface ProductImportProps {
  locale: string;
}

type Step = 'upload' | 'preview' | 'complete';

export default function ProductImport({ locale }: ProductImportProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{
    valid: ParsedProductRow[];
    invalid: ParsedProductRow[];
    totalRows: number;
  } | null>(null);
  const { mutate: importProducts, isPending: isImporting } = useImportProducts();

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setParseResult(null);
      setStep('upload');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const result = parseCSV(csvText);
        setParseResult(result);
        setStep('preview');
      } catch (error: any) {
        alert(locale === 'vi' ? `Lỗi đọc file: ${error.message}` : `Error reading file: ${error.message}`);
        setFile(null);
      }
    };

    reader.readAsText(selectedFile, 'UTF-8');
  }, [locale]);

  const handleDownloadSample = useCallback(() => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product-import-sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleConfirmImport = useCallback(() => {
    if (!parseResult || parseResult.valid.length === 0) {
      return;
    }

    const productsToImport = parseResult.valid.map((row) => ({
      nameVi: row.data.nameVi,
      nameEn: row.data.nameEn,
      slug: row.data.slug,
      descriptionVi: row.data.descriptionVi,
      descriptionEn: row.data.descriptionEn,
      originalPrice: row.data.originalPrice,
      salePrice: row.data.salePrice,
      stockQuantity: row.data.stockQuantity,
      status: row.data.status || 'active',
      featured: row.data.featured || false,
      categorySlug: row.data.categorySlug,
    }));

    importProducts(productsToImport, {
      onSuccess: (result) => {
        alert(
          locale === 'vi'
            ? `Import thành công ${result.success} sản phẩm. ${result.failed > 0 ? `${result.failed} sản phẩm thất bại.` : ''}`
            : `Successfully imported ${result.success} products. ${result.failed > 0 ? `${result.failed} products failed.` : ''}`,
        );
        router.refresh();
        setStep('upload');
        setFile(null);
        setParseResult(null);
      },
      onError: (error: any) => {
        console.error('Import failed:', error);
        alert(
          error?.response?.data?.message ||
            (locale === 'vi' ? 'Không thể import sản phẩm' : 'Failed to import products'),
        );
      },
    });
  }, [parseResult, importProducts, locale, router]);

  const handleCancel = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/products`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'vi' ? 'Import sản phẩm từ CSV' : 'Import Products from CSV'}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === 'vi'
              ? 'Tải file CSV mẫu và điền thông tin sản phẩm, sau đó upload lại để import'
              : 'Download sample CSV file, fill in product information, then upload to import'}
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadSample}>
          <FileDown className="mr-2 h-4 w-4" />
          {locale === 'vi' ? 'Tải mẫu CSV' : 'Download Sample'}
        </Button>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === 'vi' ? 'Bước 1: Chọn file CSV' : 'Step 1: Select CSV File'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Kéo thả file CSV vào đây hoặc click để chọn file'
                : 'Drag and drop CSV file here or click to select'}
            </p>
          </div>
          <CsvUpload onFileSelect={handleFileSelect} acceptedFile={file} locale={locale} />
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && parseResult && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === 'vi' ? 'Bước 2: Xem trước và xác nhận' : 'Step 2: Preview and Confirm'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Kiểm tra dữ liệu trước khi import. Chỉ các sản phẩm hợp lệ sẽ được import.'
                : 'Review data before importing. Only valid products will be imported.'}
            </p>
          </div>
          <CsvPreview
            valid={parseResult.valid}
            invalid={parseResult.invalid}
            totalRows={parseResult.totalRows}
            onConfirm={handleConfirmImport}
            onCancel={handleCancel}
            isImporting={isImporting}
            locale={locale}
          />
        </Card>
      )}
    </div>
  );
}

