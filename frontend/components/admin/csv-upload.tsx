'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CsvUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFile?: File | null;
  locale: string;
}

export default function CsvUpload({ onFileSelect, acceptedFile, locale }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find((file) => file.name.endsWith('.csv'));

      if (csvFile) {
        onFileSelect(csvFile);
      }
    },
    [onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.csv')) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileSelect(null as any);
    },
    [onFileSelect],
  );

  return (
    <Card
      className={`relative border-2 border-dashed transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : acceptedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        {acceptedFile ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{acceptedFile.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {(acceptedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemove}>
              <X className="mr-2 h-4 w-4" />
              {locale === 'vi' ? 'Xóa file' : 'Remove file'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {locale === 'vi' ? 'Kéo thả file CSV vào đây' : 'Drag and drop CSV file here'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {locale === 'vi' ? 'hoặc' : 'or'}
              </p>
              <label htmlFor="csv-upload" className="mt-2 inline-block">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    {locale === 'vi' ? 'Chọn file' : 'Choose file'}
                  </span>
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

