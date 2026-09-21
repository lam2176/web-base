import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'common' })
  
  return {
    title: t('about'),
    description: t('footer.description'),
  }
}

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          {locale === 'vi' ? 'Về chúng tôi' : 'About Us'}
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === 'vi' ? 'Câu chuyện của chúng tôi' : 'Our Story'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {locale === 'vi' 
                ? 'Chúng tôi là một cửa hàng thương mại điện tử chuyên cung cấp các sản phẩm chất lượng cao với giá cả hợp lý. Với nhiều năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến cho khách hàng những trải nghiệm mua sắm tuyệt vời nhất.'
                : 'We are an e-commerce store specializing in providing high-quality products at reasonable prices. With many years of experience in the industry, we are committed to bringing customers the best shopping experiences.'
              }
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {locale === 'vi'
                ? 'Sứ mệnh của chúng tôi là làm cho việc mua sắm trực tuyến trở nên dễ dàng, an toàn và đáng tin cậy. Chúng tôi luôn đặt khách hàng lên hàng đầu và không ngừng cải thiện dịch vụ để đáp ứng nhu cầu ngày càng cao của người tiêu dùng.'
                : 'Our mission is to make online shopping easy, safe and reliable. We always put customers first and constantly improve our services to meet the increasing needs of consumers.'
              }
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === 'vi' ? 'Giá trị cốt lõi' : 'Core Values'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'vi' ? 'Chất lượng' : 'Quality'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Chúng tôi chỉ cung cấp những sản phẩm đạt tiêu chuẩn chất lượng cao nhất.'
                    : 'We only provide products that meet the highest quality standards.'
                  }
                </p>
              </div>
              
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'vi' ? 'Uy tín' : 'Reputation'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Xây dựng niềm tin với khách hàng thông qua sự minh bạch và trung thực.'
                    : 'Building trust with customers through transparency and honesty.'
                  }
                </p>
              </div>
              
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'vi' ? 'Dịch vụ' : 'Service'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Hỗ trợ khách hàng tận tâm, chu đáo trong suốt quá trình mua sắm.'
                    : 'Dedicated and thoughtful customer support throughout the shopping process.'
                  }
                </p>
              </div>
              
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'vi' ? 'Đổi mới' : 'Innovation'}
                </h3>
                <p className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Không ngừng cải tiến và áp dụng công nghệ mới để phục vụ tốt hơn.'
                    : 'Continuously improving and applying new technologies to serve better.'
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {locale === 'vi' ? 'Tại sao chọn chúng tôi?' : 'Why Choose Us?'}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Sản phẩm chính hãng, đa dạng và phong phú'
                    : 'Genuine, diverse and rich products'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Giá cả cạnh tranh, nhiều ưu đãi hấp dẫn'
                    : 'Competitive prices, many attractive offers'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Giao hàng nhanh chóng, an toàn'
                    : 'Fast and safe delivery'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Chính sách đổi trả linh hoạt'
                    : 'Flexible return policy'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span className="text-muted-foreground">
                  {locale === 'vi'
                    ? 'Hỗ trợ khách hàng 24/7'
                    : '24/7 customer support'
                  }
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

