'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Edit, Trash2, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Page } from '@/lib/types/api';

interface PageRowProps {
  page: Page;
  locale: string;
  getTitle: (page: Page) => string;
  getStatusLabel: (status: string) => string;
  onDelete: () => void;
}

export function PageRow({ page, locale, getTitle, getStatusLabel, onDelete }: PageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${isDragging ? 'bg-gray-100' : ''}`}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900 mb-1">{getTitle(page)}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{page.slug}</p>
              <p className="text-sm text-gray-600">/{page.slug}</p>
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            page.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getStatusLabel(page.status)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/${locale}/${page.slug}`} target="_blank">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/pages/${page.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

