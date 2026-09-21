"use client"

import { useTranslations } from 'next-intl'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useStoreInfoStore } from '@/lib/stores/store-info.store'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('common')
  const { storeInfo, fetchStoreInfo } = useStoreInfoStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!storeInfo) {
      fetchStoreInfo()
    }
  }, [storeInfo, fetchStoreInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: locale === 'vi' ? 'Gửi thành công!' : 'Sent successfully!',
        description: locale === 'vi' 
          ? 'Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.'
          : 'We will contact you as soon as possible.',
      })
      setFormData({ name: '', email: '', phone: '', message: '' })
      setIsSubmitting(false)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {locale === 'vi' ? 'Liên hệ với chúng tôi' : 'Contact Us'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {locale === 'vi'
              ? 'Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây.'
              : 'We are always ready to support you. Please contact us through the channels below.'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                {locale === 'vi' ? 'Thông tin liên hệ' : 'Contact Information'}
              </h2>
              
              <div className="space-y-6">
                {storeInfo?.address && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {locale === 'vi' ? 'Địa chỉ' : 'Address'}
                      </h3>
                      <p className="text-muted-foreground">{storeInfo.address}</p>
                    </div>
                  </div>
                )}

                {storeInfo?.hotline && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {locale === 'vi' ? 'Số điện thoại' : 'Phone'}
                      </h3>
                      <a 
                        href={`tel:${storeInfo.hotline}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {storeInfo.hotline}
                      </a>
                    </div>
                  </div>
                )}

                {storeInfo?.email && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a 
                        href={`mailto:${storeInfo.email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {storeInfo.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {locale === 'vi' ? 'Giờ làm việc' : 'Working Hours'}
                    </h3>
                    <p className="text-muted-foreground">
                      {locale === 'vi'
                        ? 'Thứ 2 - Thứ 7: 8:00 - 20:00'
                        : 'Monday - Saturday: 8:00 AM - 8:00 PM'
                      }
                    </p>
                    <p className="text-muted-foreground">
                      {locale === 'vi'
                        ? 'Chủ nhật: 9:00 - 18:00'
                        : 'Sunday: 9:00 AM - 6:00 PM'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            {storeInfo?.mapUrl && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  {locale === 'vi' ? 'Bản đồ' : 'Map'}
                </h2>
                <div className="w-full h-64 rounded-lg overflow-hidden border">
                  <iframe
                    src={storeInfo.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {locale === 'vi' ? 'Gửi tin nhắn' : 'Send Message'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {locale === 'vi' ? 'Họ và tên' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={locale === 'vi' ? 'email@example.com' : 'email@example.com'}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  {locale === 'vi' ? 'Số điện thoại' : 'Phone Number'}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={locale === 'vi' ? '0123456789' : '+1234567890'}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {locale === 'vi' ? 'Nội dung' : 'Message'} <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={locale === 'vi' ? 'Nhập nội dung tin nhắn...' : 'Enter your message...'}
                  rows={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (locale === 'vi' ? 'Đang gửi...' : 'Sending...')
                  : (locale === 'vi' ? 'Gửi tin nhắn' : 'Send Message')
                }
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

