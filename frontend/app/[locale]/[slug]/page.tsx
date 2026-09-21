import { notFound } from 'next/navigation';
import { pageService } from '@/lib/api/services/page.service';
import { sanitizeHtml } from '@/lib/utils';

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export default async function DynamicPage({ params: { locale, slug } }: PageProps) {
  try {
    const page = await pageService.getBySlug(slug);

    // Get content based on locale
    const title = locale === 'vi' ? page.titleVi : page.titleEn;
    const content = locale === 'vi' ? page.contentVi : page.contentEn;

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="prose prose-lg mx-auto max-w-4xl">
          {/* Featured Image */}
          {page.featuredImage?.url && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <img
                src={page.featuredImage.url}
                alt={page.featuredImageAlt || title}
                className="h-auto w-full max-w-[500px] object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold text-gray-900">{title}</h1>

          {/* Featured Video */}
          {page.featuredVideo?.url && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <video
                src={page.featuredVideo.url}
                controls
                className="h-auto w-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Content */}
          {content && (
            <div
              className="prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />
          )}
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error loading page:', error);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params: { locale, slug } }: PageProps) {
  try {
    const page = await pageService.getBySlug(slug);
    const title = locale === 'vi' ? page.titleVi : page.titleEn;

    return {
      title: page.metaTitle || title,
      description: page.metaDescription,
      keywords: page.keywords,
      openGraph: {
        title: page.metaTitle || title,
        description: page.metaDescription,
        images: page.featuredImage?.url ? [page.featuredImage.url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Page Not Found',
    };
  }
}

