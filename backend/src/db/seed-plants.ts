/**
 * Seeds the plant shop catalogue: 5 categories and ~30 products.
 * Products with photos use media rows already uploaded to the library (by filename).
 * Also hides the original demo tech products/categories (status = inactive).
 *
 * Idempotent: categories/products whose slug already exists are skipped.
 * Run: npm run db:seed:plants
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import * as postgresImport from 'postgres';
import * as dotenv from 'dotenv';
import { categories, categoryImages } from './schema/category.schema';
import { products, productVariants, productImages } from './schema/product.schema';
import { media } from './schema/media.schema';

dotenv.config();

const postgres = (postgresImport as any).default || postgresImport;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

const OLD_PRODUCT_SLUGS = ['iphone-15-pro-max', 'macbook-pro-14'];
const OLD_CATEGORY_SLUGS = ['smartphones', 'laptops', 'accessories'];

// Uploaded photos, referenced by original filename prefix (unique per upload)
const PHOTO = {
  billietiaeBronze: 'z7177085798295',
  billietiaeTerrazzo: 'z7177085792715',
  billietiaePedestal: 'z7177085776345',
  billietiaeBlueJar: 'z7177085792539',
  kimNganBraided: 'z7177085823528',
  thanhXuanRattan: 'z7177085829537',
  thanhXuanTall: 'z7177085838222',
  kimNgan3Than: 'z7177085842121',
  calathea: 'z7181428461547',
  dieffenbachia: 'z7181428509482',
  selaginella1: 'z7181428492881',
  selaginella2: 'z7181428477707',
  billietiaeBlueWhite: 'z7236623813137',
  lanY: 'z7236623824663',
  phatTaiNui: 'z7236623818019',
  thietMocLan: 'z7236623830002',
};

interface CategorySeed {
  slug: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  order: number;
  photo?: string;
}

interface ProductSeed {
  slug: string;
  nameVi: string;
  nameEn: string;
  category: string;
  originalPrice: number;
  salePrice?: number;
  stock: number;
  featured?: boolean;
  photos?: string[];
  descriptionVi: string;
  descriptionEn: string;
  variants?: { name: string; value: string; priceAdjustment: number; stock: number }[];
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'cay-de-ban',
    nameVi: 'Cây để bàn',
    nameEn: 'Tabletop Plants',
    descriptionVi: 'Cây nhỏ gọn cho bàn làm việc, kệ sách, bàn trà.',
    descriptionEn: 'Compact plants for desks, shelves and coffee tables.',
    order: 1,
    photo: PHOTO.billietiaePedestal,
  },
  {
    slug: 'cay-noi-that-co-lon',
    nameVi: 'Cây nội thất cỡ lớn',
    nameEn: 'Large Indoor Plants',
    descriptionVi: 'Cây đặt sàn cho phòng khách, sảnh, góc nhà và văn phòng.',
    descriptionEn: 'Floor plants for living rooms, lobbies and offices.',
    order: 2,
    photo: PHOTO.lanY,
  },
  {
    slug: 'cay-phong-thuy',
    nameVi: 'Cây phong thủy',
    nameEn: 'Feng Shui Plants',
    descriptionVi: 'Cây mang ý nghĩa tài lộc, may mắn, thích hợp làm quà tặng.',
    descriptionEn: 'Plants symbolising wealth and luck, great as gifts.',
    order: 3,
    photo: PHOTO.kimNganBraided,
  },
  {
    slug: 'chau-cay',
    nameVi: 'Chậu cây',
    nameEn: 'Planters',
    descriptionVi: 'Chậu sứ, composite, terrazzo cho cây nội thất.',
    descriptionEn: 'Ceramic, composite and terrazzo planters.',
    order: 4,
    photo: PHOTO.billietiaeTerrazzo,
  },
  {
    slug: 'phu-kien-vat-tu',
    nameVi: 'Phụ kiện & vật tư',
    nameEn: 'Accessories & Supplies',
    descriptionVi: 'Đất trồng, phân bón, đế lót và dụng cụ chăm cây.',
    descriptionEn: 'Potting soil, fertiliser, plant caddies and care tools.',
    order: 5,
  },
];

// Small helper so descriptions share one readable structure
function desc(intro: string, info: string[], care: string[], meaning?: string): string {
  const list = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  return [
    `<p>${intro}</p>`,
    `<h3>Thông tin sản phẩm</h3>${list(info)}`,
    `<h3>Cách chăm sóc</h3>${list(care)}`,
    meaning ? `<h3>Ý nghĩa</h3><p>${meaning}</p>` : '',
  ].join('');
}

const PET_WARNING = 'Nhựa cây có thể gây kích ứng, tránh để trẻ nhỏ và thú cưng nhai lá.';

const PRODUCTS: ProductSeed[] = [
  // ---- Large indoor plants (with photos)
  {
    slug: 'philodendron-billietiae-chau-van-may-dong',
    nameVi: 'Philodendron Billietiae chậu vân mây đồng',
    nameEn: 'Philodendron Billietiae in bronze rattan-texture planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 2450000,
    salePrice: 2190000,
    stock: 6,
    featured: true,
    photos: [PHOTO.billietiaeBronze],
    descriptionVi: desc(
      'Philodendron Billietiae nổi bật với lá dài hình mũi giáo và cuống lá màu cam đặc trưng, đặt trong chậu composite vân mây màu đồng sang trọng. Hợp với sảnh, phòng khách phong cách hiện đại hoặc Á Đông.',
      ['Chiều cao tổng (cả chậu): khoảng 1,1 - 1,2 m', 'Chậu composite vân mây màu đồng, kèm đĩa lót', 'Phù hợp: phòng khách, sảnh, văn phòng'],
      ['Ánh sáng tán xạ, tránh nắng gắt chiếu trực tiếp', 'Tưới khi 2-3 cm đất mặt đã khô (khoảng 2 lần/tuần)', 'Thích độ ẩm cao, có thể phun sương lên lá', PET_WARNING],
      'Dáng cây vươn cao, lá xanh bóng tượng trưng cho sự phát triển và thịnh vượng.',
    ),
    descriptionEn: 'Philodendron Billietiae with long arrow-shaped leaves and orange petioles, in a bronze rattan-texture composite planter. Total height about 1.1-1.2 m.',
  },
  {
    slug: 'philodendron-billietiae-chau-terrazzo',
    nameVi: 'Philodendron Billietiae chậu terrazzo',
    nameEn: 'Philodendron Billietiae in terrazzo planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 2350000,
    stock: 5,
    photos: [PHOTO.billietiaeTerrazzo],
    descriptionVi: desc(
      'Philodendron Billietiae dáng xòe đều, lá xanh đậm bóng, kết hợp chậu terrazzo đá mài trắng tạo cảm giác tươi sáng, tối giản.',
      ['Chiều cao tổng: khoảng 1,1 m', 'Chậu terrazzo trụ thon, kèm đế lót', 'Phù hợp: phòng khách, góc làm việc, showroom'],
      ['Ánh sáng tán xạ hoặc gần cửa sổ có rèm', 'Tưới 2 lần/tuần, giảm vào mùa lạnh', 'Lau lá định kỳ để lá luôn bóng', PET_WARNING],
    ),
    descriptionEn: 'Philodendron Billietiae in a white terrazzo planter. Total height about 1.1 m.',
  },
  {
    slug: 'philodendron-billietiae-chau-men-lam-co-lon',
    nameVi: 'Philodendron Billietiae cỡ lớn chậu men lam',
    nameEn: 'Large Philodendron Billietiae in blue glazed jar',
    category: 'cay-noi-that-co-lon',
    originalPrice: 3200000,
    salePrice: 2890000,
    stock: 3,
    featured: true,
    photos: [PHOTO.billietiaeBlueJar],
    descriptionVi: desc(
      'Bụi Billietiae cỡ lớn nhiều lá, đặt trong chum gốm men lam hỏa biến thủ công. Điểm nhấn cho sảnh, hành lang hoặc góc phòng rộng.',
      ['Chiều cao tổng: khoảng 1,3 - 1,4 m', 'Chum gốm men lam hỏa biến, kèm đế có bánh xe', 'Phù hợp: sảnh khách sạn, nhà hàng, phòng khách lớn'],
      ['Ánh sáng tán xạ, chịu được bóng bán phần', 'Tưới khi đất mặt khô, không để đọng nước dưới đáy', 'Bón phân tan chậm 2-3 tháng/lần', PET_WARNING],
    ),
    descriptionEn: 'Large bushy Philodendron Billietiae in a hand-glazed blue ceramic jar. Total height about 1.3-1.4 m.',
  },
  {
    slug: 'trau-ba-thanh-xuan-chau-van-may',
    nameVi: 'Trầu bà Thanh Xuân chậu vân mây',
    nameEn: 'Philodendron Selloum in rattan-texture planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 1550000,
    stock: 8,
    photos: [PHOTO.thanhXuanRattan],
    descriptionVi: desc(
      'Trầu bà Thanh Xuân (Philodendron Selloum) có lá xẻ thùy sâu, tán xòe rộng, mang lại cảm giác nhiệt đới cho không gian.',
      ['Chiều cao tổng: khoảng 1,2 m, tán rộng khoảng 80 cm', 'Chậu composite vân mây, kèm đế bánh xe', 'Phù hợp: phòng khách, hành lang, văn phòng'],
      ['Ưa sáng, chịu được bóng bán phần', 'Tưới 2-3 lần/tuần, giữ đất ẩm nhưng không úng', 'Xoay chậu định kỳ để cây phát triển đều', PET_WARNING],
      'Thanh Xuân tượng trưng cho sức sống, sự trẻ trung và may mắn.',
    ),
    descriptionEn: 'Philodendron Selloum with deeply lobed leaves in a rattan-texture planter. Height about 1.2 m.',
  },
  {
    slug: 'trau-ba-thanh-xuan-chau-tru-cao',
    nameVi: 'Trầu bà Thanh Xuân chậu trụ cao sọc vàng',
    nameEn: 'Philodendron Selloum in tall gold ribbed planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 1750000,
    stock: 4,
    photos: [PHOTO.thanhXuanTall],
    descriptionVi: desc(
      'Trầu bà Thanh Xuân trong chậu trụ cao sọc vàng đồng, giúp tán lá vươn cao, thích hợp đặt cạnh cửa sổ hoặc góc hẹp.',
      ['Chiều cao tổng: khoảng 1,4 m', 'Chậu composite trụ cao sọc vàng đồng, kèm đế bánh xe', 'Phù hợp: góc cửa sổ, sảnh, hành lang'],
      ['Ánh sáng tán xạ mạnh là tốt nhất', 'Tưới 2-3 lần/tuần vào mùa nóng', 'Cắt bỏ lá già vàng ở gốc để cây gọn đẹp', PET_WARNING],
    ),
    descriptionEn: 'Philodendron Selloum in a tall gold ribbed planter. Total height about 1.4 m.',
  },
  {
    slug: 'lan-y-co-lon-chau-den',
    nameVi: 'Lan ý cỡ lớn chậu trụ đen',
    nameEn: 'Large Peace Lily in tall black planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 1350000,
    salePrice: 1190000,
    stock: 10,
    featured: true,
    photos: [PHOTO.lanY],
    descriptionVi: desc(
      'Lan ý (Spathiphyllum) cỡ lớn, lá xanh đậm, ra hoa trắng thanh lịch. Một trong những cây lọc không khí tốt và rất dễ chăm, chịu bóng tốt nên hợp với văn phòng.',
      ['Chiều cao tổng: khoảng 1,1 m', 'Chậu composite trụ đen nhám', 'Phù hợp: quầy lễ tân, văn phòng, phòng khách'],
      ['Chịu bóng tốt, sống được dưới ánh đèn văn phòng', 'Tưới khi đất mặt khô; lá rủ xuống là dấu hiệu cây cần nước', 'Tránh nắng gắt làm cháy lá', PET_WARNING],
      'Hoa lan ý tượng trưng cho sự bình yên và thuần khiết.',
    ),
    descriptionEn: 'Large peace lily (Spathiphyllum), shade tolerant and air purifying, in a tall matte black planter. Height about 1.1 m.',
  },
  // ---- Feng shui plants (with photos)
  {
    slug: 'kim-ngan-than-xoan-chau-gom-den',
    nameVi: 'Kim Ngân thân xoắn chậu gốm đen',
    nameEn: 'Braided Money Tree in black ceramic pot',
    category: 'cay-phong-thuy',
    originalPrice: 1850000,
    stock: 7,
    featured: true,
    photos: [PHOTO.kimNganBraided],
    descriptionVi: desc(
      'Kim Ngân (Pachira aquatica) thân xoắn, tán lá xanh mướt hình bàn tay, đặt trong chậu gốm đen tròn hiện đại.',
      ['Chiều cao tổng: khoảng 1,5 m', 'Chậu gốm đen dáng tròn', 'Phù hợp: phòng khách, phòng giám đốc, quà khai trương'],
      ['Ánh sáng tán xạ, tránh nắng gắt', 'Tưới 1 lần/tuần, để khô đất giữa các lần tưới', 'Không để úng nước vì dễ thối gốc'],
      'Kim Ngân là biểu tượng của tiền tài và thịnh vượng, thường được tặng dịp khai trương, tân gia.',
    ),
    descriptionEn: 'Braided money tree (Pachira aquatica) in a round black ceramic pot. Height about 1.5 m. Symbol of wealth.',
  },
  {
    slug: 'kim-ngan-3-than-chau-dong-soc',
    nameVi: 'Kim Ngân 3 thân chậu đồng sọc',
    nameEn: 'Three-trunk Money Tree in bronze ribbed pot',
    category: 'cay-phong-thuy',
    originalPrice: 1650000,
    salePrice: 1490000,
    stock: 9,
    photos: [PHOTO.kimNgan3Than],
    descriptionVi: desc(
      'Kim Ngân 3 thân vươn cao, tán thoáng, trong chậu composite màu đồng sọc ngang sang trọng.',
      ['Chiều cao tổng: khoảng 1,4 m', 'Chậu composite màu đồng sọc ngang', 'Phù hợp: sảnh, phòng khách, văn phòng'],
      ['Ánh sáng tán xạ hoặc gần cửa sổ', 'Tưới 1 lần/tuần', 'Bón phân tan chậm 2-3 tháng/lần'],
      'Ba thân tượng trưng cho Phúc - Lộc - Thọ, mang lại may mắn cho gia chủ.',
    ),
    descriptionEn: 'Three-trunk money tree in a bronze ribbed composite pot. Height about 1.4 m.',
  },
  {
    slug: 'phat-tai-nui-2-tang',
    nameVi: 'Phát Tài Núi 2 tầng chậu đen',
    nameEn: 'Two-tier Dragon Tree in black planter',
    category: 'cay-phong-thuy',
    originalPrice: 3500000,
    stock: 2,
    featured: true,
    photos: [PHOTO.phatTaiNui],
    descriptionVi: desc(
      'Phát Tài Núi (Dracaena draco) dáng 2 tầng lá độc đáo, lá cứng xanh đậm, rất khỏe và ít phải chăm sóc.',
      ['Chiều cao tổng: khoảng 1,6 m', 'Chậu composite đen nhám', 'Phù hợp: phòng khách, sảnh, văn phòng hướng sáng'],
      ['Ưa sáng, chịu được nắng nhẹ', 'Chịu hạn tốt, tưới 1 lần/tuần hoặc ít hơn vào mùa lạnh', 'Đất thoát nước tốt, tránh úng', PET_WARNING],
      'Các tầng lá tượng trưng cho sự thăng tiến, công việc phát đạt.',
    ),
    descriptionEn: 'Two-tier dragon tree (Dracaena draco), very hardy, in a matte black planter. Height about 1.6 m.',
  },
  {
    slug: 'thiet-moc-lan-goc-lua',
    nameVi: 'Thiết Mộc Lan gốc lũa',
    nameEn: 'Corn Plant with driftwood trunk',
    category: 'cay-phong-thuy',
    originalPrice: 4200000,
    salePrice: 3890000,
    stock: 2,
    featured: true,
    photos: [PHOTO.thietMocLan],
    descriptionVi: desc(
      'Thiết Mộc Lan (Dracaena fragrans) gốc lũa lâu năm, tán lá dày xanh bóng, đặt trong chậu đá mài sọc ngang cỡ lớn.',
      ['Chiều cao tổng: khoảng 1,7 m', 'Chậu đá mài sọc ngang, kèm đế bánh xe', 'Phù hợp: phòng khách lớn, sảnh công ty'],
      ['Ánh sáng tán xạ, chịu bóng bán phần', 'Tưới 1-2 lần/tuần, để đất khô mặt giữa các lần tưới', 'Lau lá để tránh bụi bám', PET_WARNING],
      'Thiết Mộc Lan mang ý nghĩa tài lộc, vững chãi; khi ra hoa được xem là điềm may mắn.',
    ),
    descriptionEn: 'Mature corn plant (Dracaena fragrans) with a driftwood-like trunk in a large ribbed stone planter. Height about 1.7 m.',
  },
  // ---- Tabletop plants (with photos)
  {
    slug: 'philodendron-billietiae-chau-su-hoa-lam',
    nameVi: 'Philodendron Billietiae chậu sứ hoa lam',
    nameEn: 'Philodendron Billietiae in blue-and-white ceramic pot',
    category: 'cay-de-ban',
    originalPrice: 950000,
    stock: 12,
    photos: [PHOTO.billietiaeBlueWhite],
    descriptionVi: desc(
      'Billietiae cỡ nhỏ trong chậu sứ vẽ hoa lam cổ điển, hợp đặt trên bàn console, kệ tủ hoặc bàn góc.',
      ['Chiều cao tổng: khoảng 55 - 65 cm', 'Chậu sứ hoa lam, kèm đĩa lót', 'Phù hợp: bàn console, kệ tủ, góc phòng'],
      ['Ánh sáng tán xạ, đặt gần cửa sổ có rèm', 'Tưới 1-2 lần/tuần', PET_WARNING],
    ),
    descriptionEn: 'Small Philodendron Billietiae in a classic blue-and-white ceramic pot. Height about 55-65 cm.',
  },
  {
    slug: 'philodendron-billietiae-chau-su-chan-cao',
    nameVi: 'Philodendron Billietiae chậu sứ chân cao',
    nameEn: 'Philodendron Billietiae in pedestal ceramic bowl',
    category: 'cay-de-ban',
    originalPrice: 1050000,
    salePrice: 950000,
    stock: 8,
    photos: [PHOTO.billietiaePedestal],
    descriptionVi: desc(
      'Billietiae trong chậu sứ chân cao họa tiết lá lam, dáng cây thanh thoát, là điểm nhấn cho bàn trà hoặc kệ trang trí.',
      ['Chiều cao tổng: khoảng 60 cm', 'Chậu sứ chân cao họa tiết lá lam', 'Phù hợp: bàn trà, kệ trang trí, quầy bar'],
      ['Ánh sáng tán xạ', 'Tưới ít một, 1-2 lần/tuần vì chậu nông', PET_WARNING],
    ),
    descriptionEn: 'Philodendron Billietiae in a blue leaf-pattern pedestal ceramic bowl. Height about 60 cm.',
  },
  {
    slug: 'duoi-cong-ran-chuong-chau-su-trang',
    nameVi: 'Đuôi Công Rắn Chuông chậu sứ trắng',
    nameEn: 'Rattlesnake Plant in white ceramic pot',
    category: 'cay-de-ban',
    originalPrice: 320000,
    salePrice: 280000,
    stock: 20,
    photos: [PHOTO.calathea],
    descriptionVi: desc(
      'Đuôi Công Rắn Chuông (Calathea lancifolia) có lá dài gợn sóng với đốm xanh đậm, mặt dưới lá màu tím đỏ. Lá khép lại vào buổi tối rất thú vị.',
      ['Chiều cao tổng: khoảng 45 - 50 cm', 'Chậu sứ trắng dáng tròn', 'Phù hợp: bàn làm việc, kệ sách, phòng ngủ'],
      ['Ánh sáng gián tiếp, tránh nắng trực tiếp làm cháy lá', 'Giữ đất hơi ẩm, tưới 2-3 lần/tuần', 'Thích độ ẩm cao, nên dùng nước để lắng qua đêm', 'An toàn cho thú cưng'],
    ),
    descriptionEn: 'Rattlesnake plant (Calathea lancifolia) with patterned wavy leaves, in a white ceramic pot. Pet safe. Height about 45-50 cm.',
  },
  {
    slug: 'van-nien-thanh-tropic-marianne',
    nameVi: 'Vạn Niên Thanh Tropic Marianne',
    nameEn: 'Dieffenbachia Tropic Marianne',
    category: 'cay-de-ban',
    originalPrice: 150000,
    stock: 30,
    photos: [PHOTO.dieffenbachia],
    descriptionVi: desc(
      'Vạn Niên Thanh (Dieffenbachia) lá to với mảng vàng chanh nổi bật giữa viền xanh đậm, làm sáng bừng góc bàn.',
      ['Chiều cao: khoảng 35 - 40 cm', 'Chậu nhựa ươm, có thể thay chậu sứ (xem danh mục Chậu cây)', 'Phù hợp: bàn làm việc, kệ, quầy thu ngân'],
      ['Ánh sáng tán xạ, chịu bóng khá tốt', 'Tưới 2 lần/tuần', PET_WARNING],
      'Vạn Niên Thanh tượng trưng cho sự bền bỉ, trường tồn.',
    ),
    descriptionEn: 'Dieffenbachia Tropic Marianne with bright lime-yellow variegation, in a nursery pot. Height about 35-40 cm.',
  },
  {
    slug: 'quyen-ba-do-ruby',
    nameVi: 'Quyển Bá Đỏ Ruby',
    nameEn: 'Ruby Red Spikemoss',
    category: 'cay-de-ban',
    originalPrice: 120000,
    stock: 25,
    photos: [PHOTO.selaginella1, PHOTO.selaginella2],
    descriptionVi: desc(
      'Quyển Bá Đỏ Ruby (Selaginella) dạng bụi xốp như rêu, đầu lá ánh đỏ ruby. Rất hợp làm cây để bàn mini hoặc trồng bình terrarium.',
      ['Đường kính bụi: khoảng 20 cm', 'Chậu nhựa ươm 12 cm', 'Phù hợp: bàn làm việc, terrarium, kệ phòng tắm'],
      ['Ánh sáng tán xạ nhẹ', 'Luôn giữ đất ẩm, không để khô hoàn toàn', 'Cần độ ẩm cao, phun sương mỗi ngày'],
    ),
    descriptionEn: 'Ruby Red Spikemoss (Selaginella), a moss-like mini plant with ruby-red tips. Loves humidity; great for terrariums.',
  },
  // ---- Tabletop plants (no photo yet)
  {
    slug: 'luoi-ho-xanh-chau-su',
    nameVi: 'Lưỡi Hổ xanh chậu sứ',
    nameEn: 'Snake Plant in ceramic pot',
    category: 'cay-de-ban',
    originalPrice: 250000,
    stock: 35,
    descriptionVi: desc(
      'Lưỡi Hổ (Sansevieria) lá thẳng đứng cứng cáp, cực kỳ dễ sống, phù hợp cả người mới trồng cây.',
      ['Chiều cao tổng: khoảng 40 - 50 cm', 'Chậu sứ trắng'],
      ['Chịu bóng tốt, sống được trong phòng máy lạnh', 'Tưới 2-3 tuần/lần, rất chịu hạn', 'Tránh úng nước', PET_WARNING],
      'Lưỡi Hổ tượng trưng cho sự mạnh mẽ, giúp xua đuổi điều xấu.',
    ),
    descriptionEn: 'Snake plant (Sansevieria) in a white ceramic pot. Extremely easy care, drought tolerant.',
  },
  {
    slug: 'trau-ba-vang-chau-treo',
    nameVi: 'Trầu Bà Vàng chậu treo',
    nameEn: 'Golden Pothos hanging pot',
    category: 'cay-de-ban',
    originalPrice: 180000,
    stock: 28,
    descriptionVi: desc(
      'Trầu Bà Vàng (Epipremnum aureum) lá xanh loang vàng, thân rủ mềm mại, có thể đặt kệ cao hoặc treo.',
      ['Chiều dài dây rủ: khoảng 40 - 60 cm', 'Chậu nhựa treo kèm móc'],
      ['Ánh sáng tán xạ, chịu bóng tốt', 'Tưới 2 lần/tuần; có thể cắt cành cắm nước', PET_WARNING],
    ),
    descriptionEn: 'Golden pothos in a hanging pot. Trailing, easy care, tolerates low light.',
  },
  {
    slug: 'cau-tieu-tram-de-ban',
    nameVi: 'Cau Tiểu Trâm để bàn',
    nameEn: 'Parlor Palm tabletop',
    category: 'cay-de-ban',
    originalPrice: 160000,
    stock: 22,
    descriptionVi: desc(
      'Cau Tiểu Trâm (Chamaedorea elegans) dáng cọ nhỏ xinh, lá xanh mảnh, giúp không gian làm việc tươi mát.',
      ['Chiều cao tổng: khoảng 35 - 45 cm', 'Chậu sứ trắng mini'],
      ['Chịu bóng tốt', 'Giữ đất hơi ẩm, tưới 2 lần/tuần', 'An toàn cho thú cưng'],
    ),
    descriptionEn: 'Parlor palm (Chamaedorea elegans) in a small white pot. Shade tolerant, pet safe.',
  },
  {
    slug: 'ngoc-ngan-de-ban',
    nameVi: 'Ngọc Ngân để bàn',
    nameEn: 'Aglaonema Snow White tabletop',
    category: 'cay-de-ban',
    originalPrice: 220000,
    stock: 18,
    descriptionVi: desc(
      'Ngọc Ngân (Aglaonema) lá loang trắng xanh thanh nhã, chịu bóng tốt, thích hợp phòng máy lạnh.',
      ['Chiều cao tổng: khoảng 30 - 40 cm', 'Chậu sứ trắng'],
      ['Ánh sáng tán xạ hoặc đèn văn phòng', 'Tưới 1-2 lần/tuần', PET_WARNING],
      'Ngọc Ngân tượng trưng cho tình yêu trong sáng và may mắn.',
    ),
    descriptionEn: 'Aglaonema with white-green variegated leaves in a white ceramic pot. Low light tolerant.',
  },
  {
    slug: 'sen-da-mix-khay-go',
    nameVi: 'Set sen đá mix khay gỗ',
    nameEn: 'Mixed succulent set in wooden tray',
    category: 'cay-de-ban',
    originalPrice: 199000,
    salePrice: 169000,
    stock: 15,
    descriptionVi: desc(
      'Set 4-5 cây sen đá nhiều màu trồng chung khay gỗ, nhỏ gọn, làm quà tặng rất xinh.',
      ['Kích thước khay: khoảng 25 x 12 cm', 'Gồm 4-5 cây sen đá các loại'],
      ['Cần nhiều nắng, đặt cạnh cửa sổ hướng sáng', 'Tưới 1 lần/tuần, để đất khô hẳn giữa các lần tưới'],
    ),
    descriptionEn: 'Set of 4-5 mixed succulents in a wooden tray. Needs bright light and little water.',
  },
  // ---- Feng shui (no photo yet)
  {
    slug: 'kim-tien-chau-su-trang',
    nameVi: 'Kim Tiền chậu sứ trắng',
    nameEn: 'ZZ Plant in white ceramic pot',
    category: 'cay-phong-thuy',
    originalPrice: 450000,
    stock: 20,
    descriptionVi: desc(
      'Kim Tiền (Zamioculcas) lá xanh bóng mọng nước, rất chịu bóng và chịu hạn, hợp với văn phòng ít nắng.',
      ['Cỡ nhỏ cao khoảng 50 cm, cỡ lớn cao khoảng 80 cm', 'Chậu sứ trắng'],
      ['Chịu bóng tốt', 'Tưới khoảng 2 tuần/lần, rất chịu hạn', 'Tránh úng vì củ dễ thối', PET_WARNING],
      'Kim Tiền mang ý nghĩa tiền vào như nước, là quà khai trương phổ biến.',
    ),
    descriptionEn: 'ZZ plant (Zamioculcas) in a white ceramic pot, small or large. Very shade and drought tolerant.',
    variants: [
      { name: 'Kích thước', value: 'Nhỏ (~50 cm)', priceAdjustment: 0, stock: 12 },
      { name: 'Kích thước', value: 'Lớn (~80 cm)', priceAdjustment: 300000, stock: 8 },
    ],
  },
  {
    slug: 'phu-quy-do',
    nameVi: 'Phú Quý đỏ',
    nameEn: 'Red Aglaonema',
    category: 'cay-phong-thuy',
    originalPrice: 260000,
    stock: 16,
    descriptionVi: desc(
      'Phú Quý (Aglaonema đỏ) lá xanh viền hồng đỏ rực rỡ, hợp làm quà tặng dịp lễ Tết.',
      ['Chiều cao tổng: khoảng 35 - 45 cm', 'Chậu sứ trắng'],
      ['Ánh sáng tán xạ giúp lá lên màu đẹp', 'Tưới 1-2 lần/tuần', PET_WARNING],
      'Phú Quý tượng trưng cho giàu sang, phú quý.',
    ),
    descriptionEn: 'Red Aglaonema with pink-red edged leaves in a white ceramic pot.',
  },
  // ---- Large indoor (no photo yet)
  {
    slug: 'bang-singapore-1m2',
    nameVi: 'Bàng Singapore 1,2 m',
    nameEn: 'Fiddle Leaf Fig 1.2 m',
    category: 'cay-noi-that-co-lon',
    originalPrice: 1200000,
    stock: 0,
    descriptionVi: desc(
      'Bàng Singapore (Ficus lyrata) lá to hình đàn violin, dáng cây sang trọng, rất được ưa chuộng trong nội thất hiện đại.',
      ['Chiều cao tổng: khoảng 1,2 m', 'Chậu composite trắng'],
      ['Cần nhiều ánh sáng, đặt gần cửa sổ lớn', 'Tưới 1-2 lần/tuần khi đất mặt khô', 'Hạn chế di chuyển chỗ đặt vì cây dễ rụng lá', PET_WARNING],
    ),
    descriptionEn: 'Fiddle leaf fig (Ficus lyrata), about 1.2 m tall, in a white composite planter. Needs bright light.',
  },
  {
    slug: 'monstera-deliciosa-chau-xi-mang',
    nameVi: 'Monstera Deliciosa chậu xi măng',
    nameEn: 'Monstera Deliciosa in concrete planter',
    category: 'cay-noi-that-co-lon',
    originalPrice: 1450000,
    salePrice: 1290000,
    stock: 6,
    descriptionVi: desc(
      'Monstera Deliciosa (Trầu bà Nam Mỹ) lá xẻ đặc trưng, mang phong cách nhiệt đới cho phòng khách.',
      ['Chiều cao tổng: khoảng 1 m', 'Chậu xi măng giả đá'],
      ['Ánh sáng tán xạ', 'Tưới 1-2 lần/tuần', 'Có thể cắm cọc dừa để cây leo thẳng', PET_WARNING],
    ),
    descriptionEn: 'Monstera Deliciosa with split leaves, about 1 m tall, in a concrete planter.',
  },
  // ---- Planters
  {
    slug: 'chau-su-trang-tron',
    nameVi: 'Chậu sứ trắng dáng tròn',
    nameEn: 'Round white ceramic pot',
    category: 'chau-cay',
    originalPrice: 120000,
    stock: 60,
    descriptionVi: desc(
      'Chậu sứ trắng men bóng dáng tròn, có lỗ thoát nước, hợp với hầu hết cây để bàn.',
      ['Chất liệu: sứ men bóng', 'Có lỗ thoát nước và đĩa lót'],
      ['Lau bằng khăn ẩm', 'Nên lót sỏi đáy chậu để thoát nước tốt'],
    ),
    descriptionEn: 'Glossy round white ceramic pot with drainage hole and saucer. Sizes S/M/L.',
    variants: [
      { name: 'Kích thước', value: 'S - đường kính 12 cm', priceAdjustment: 0, stock: 25 },
      { name: 'Kích thước', value: 'M - đường kính 18 cm', priceAdjustment: 60000, stock: 20 },
      { name: 'Kích thước', value: 'L - đường kính 25 cm', priceAdjustment: 150000, stock: 15 },
    ],
  },
  {
    slug: 'chau-composite-tru-cao-den',
    nameVi: 'Chậu composite trụ cao đen nhám',
    nameEn: 'Tall matte black composite planter',
    category: 'chau-cay',
    originalPrice: 850000,
    stock: 14,
    descriptionVi: desc(
      'Chậu composite trụ cao màu đen nhám, nhẹ, bền, chống nứt, phù hợp cây nội thất cỡ lớn như Lan ý, Phát tài.',
      ['Chất liệu: composite sợi thủy tinh', 'Đường kính miệng khoảng 35 cm'],
      ['Dùng được trong nhà và ngoài trời', 'Nên dùng kèm đế bánh xe để dễ di chuyển'],
    ),
    descriptionEn: 'Tall matte black fibreglass composite planter for large indoor plants. 60 cm or 80 cm tall.',
    variants: [
      { name: 'Chiều cao', value: '60 cm', priceAdjustment: 0, stock: 8 },
      { name: 'Chiều cao', value: '80 cm', priceAdjustment: 350000, stock: 6 },
    ],
  },
  {
    slug: 'chau-terrazzo-tron',
    nameVi: 'Chậu terrazzo trụ thon',
    nameEn: 'Tapered terrazzo planter',
    category: 'chau-cay',
    originalPrice: 690000,
    stock: 10,
    descriptionVi: desc(
      'Chậu terrazzo đá mài vân trắng, dáng trụ thon hiện đại, tạo điểm nhấn tươi sáng cho cây xanh.',
      ['Chất liệu: terrazzo (đá mài)', 'Cao khoảng 55 cm, đường kính miệng khoảng 32 cm'],
      ['Lau bằng khăn ẩm, tránh hóa chất tẩy mạnh'],
    ),
    descriptionEn: 'Tapered white terrazzo planter, about 55 cm tall.',
  },
  // ---- Accessories & supplies
  {
    slug: 'dat-trong-cay-noi-that-5l',
    nameVi: 'Đất trồng cây nội thất 5 lít',
    nameEn: 'Indoor potting mix 5 L',
    category: 'phu-kien-vat-tu',
    originalPrice: 65000,
    stock: 80,
    descriptionVi: desc(
      'Giá thể trộn sẵn gồm xơ dừa, đá perlite, phân trùn quế, tơi xốp và thoát nước tốt cho cây nội thất.',
      ['Dung tích: 5 lít', 'Thành phần: xơ dừa, perlite, phân trùn quế, trấu hun'],
      ['Dùng trực tiếp khi thay chậu', 'Bảo quản nơi khô ráo'],
    ),
    descriptionEn: 'Ready-to-use indoor potting mix (coco coir, perlite, worm castings), 5 litres.',
  },
  {
    slug: 'phan-bon-tan-cham-osmocote',
    nameVi: 'Phân bón tan chậm Osmocote 100 g',
    nameEn: 'Osmocote slow-release fertiliser 100 g',
    category: 'phu-kien-vat-tu',
    originalPrice: 85000,
    stock: 50,
    descriptionVi: desc(
      'Phân bón tan chậm dạng viên, nhả dinh dưỡng đều trong 2-3 tháng, tiện cho người bận rộn.',
      ['Khối lượng: 100 g', 'Dạng viên tan chậm'],
      ['Rắc 1 thìa cà phê quanh gốc cho chậu 20 cm', 'Bón lại sau 2-3 tháng'],
    ),
    descriptionEn: 'Slow-release fertiliser granules, feeds for 2-3 months. 100 g.',
  },
  {
    slug: 'de-lot-chau-banh-xe',
    nameVi: 'Đế lót chậu có bánh xe',
    nameEn: 'Plant caddy with wheels',
    category: 'phu-kien-vat-tu',
    originalPrice: 150000,
    stock: 40,
    descriptionVi: desc(
      'Đế lót chậu bằng nhựa cứng có 4 bánh xe xoay, giúp di chuyển cây lớn dễ dàng và bảo vệ sàn nhà.',
      ['Đường kính: 30 cm', 'Tải trọng tối đa khoảng 80 kg'],
      ['Phù hợp chậu có đường kính đáy dưới 30 cm'],
    ),
    descriptionEn: 'Rigid plastic plant caddy with 4 swivel wheels, 30 cm diameter, up to about 80 kg.',
  },
  {
    slug: 'binh-xit-tuoi-cay',
    nameVi: 'Bình xịt phun sương tưới cây',
    nameEn: 'Plant mister spray bottle',
    category: 'phu-kien-vat-tu',
    originalPrice: 45000,
    stock: 70,
    descriptionVi: desc(
      'Bình xịt phun sương mịn 500 ml, dùng tăng độ ẩm cho các loại cây ưa ẩm như Calathea, Quyển bá.',
      ['Dung tích: 500 ml', 'Đầu phun sương mịn chỉnh được'],
      ['Phun sương lên lá vào buổi sáng'],
    ),
    descriptionEn: 'Fine mist spray bottle, 500 ml, for humidity-loving plants.',
  },
];

async function findPhotoIds(prefixes: string[]): Promise<Map<string, number>> {
  const rows = await db.select({ id: media.id, filename: media.filename }).from(media);
  const ids = new Map<string, number>();
  for (const prefix of prefixes) {
    const row = rows.find((r) => r.filename.startsWith(prefix));
    if (row) ids.set(prefix, row.id);
    else console.warn(`  ! Photo not found in media library: ${prefix}`);
  }
  return ids;
}

async function seedPlants() {
  console.log('🌿 Seeding plant catalogue...');

  const photoIds = await findPhotoIds([
    ...new Set([
      ...CATEGORIES.flatMap((c) => (c.photo ? [c.photo] : [])),
      ...PRODUCTS.flatMap((p) => p.photos ?? []),
    ]),
  ]);

  await db.transaction(async (tx) => {
    // Hide the original demo tech catalogue
    await tx
      .update(products)
      .set({ status: 'inactive', featured: false, updatedAt: new Date() })
      .where(inArray(products.slug, OLD_PRODUCT_SLUGS));
    await tx
      .update(categories)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(inArray(categories.slug, OLD_CATEGORY_SLUGS));
    console.log('  ✓ Hid old tech products and categories');

    const categoryIds = new Map<string, number>();
    for (const category of CATEGORIES) {
      const [existing] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category.slug));
      if (existing) {
        categoryIds.set(category.slug, existing.id);
        continue;
      }

      const [created] = await tx
        .insert(categories)
        .values({
          slug: category.slug,
          nameVi: category.nameVi,
          nameEn: category.nameEn,
          descriptionVi: category.descriptionVi,
          descriptionEn: category.descriptionEn,
          order: category.order,
          status: 'active',
        })
        .returning({ id: categories.id });
      categoryIds.set(category.slug, created.id);

      const mediaId = category.photo && photoIds.get(category.photo);
      if (mediaId) {
        await tx.insert(categoryImages).values({ categoryId: created.id, mediaId, isPrimary: true });
      }
    }
    console.log(`  ✓ Categories ready (${categoryIds.size})`);

    let createdCount = 0;
    for (const product of PRODUCTS) {
      const [existing] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, product.slug));
      if (existing) continue;

      const discount = product.salePrice
        ? Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)
        : 0;

      const [created] = await tx
        .insert(products)
        .values({
          slug: product.slug,
          nameVi: product.nameVi,
          nameEn: product.nameEn,
          descriptionVi: product.descriptionVi,
          descriptionEn: product.descriptionEn,
          originalPrice: product.originalPrice.toString(),
          salePrice: product.salePrice?.toString() ?? null,
          discountPercentage: discount,
          stockQuantity: product.stock,
          isOutOfStock: product.stock === 0,
          categoryId: categoryIds.get(product.category),
          featured: product.featured ?? false,
          status: product.stock === 0 ? 'out_of_stock' : 'active',
          metaTitle: product.nameVi,
          metaDescription: product.descriptionEn,
        })
        .returning({ id: products.id });

      const imageRows = (product.photos ?? [])
        .map((photo) => photoIds.get(photo))
        .filter((mediaId): mediaId is number => !!mediaId)
        .map((mediaId, index) => ({ productId: created.id, mediaId, order: index, isPrimary: index === 0 }));
      if (imageRows.length > 0) {
        await tx.insert(productImages).values(imageRows);
      }

      if (product.variants?.length) {
        await tx.insert(productVariants).values(
          product.variants.map((variant) => ({
            productId: created.id,
            name: variant.name,
            value: variant.value,
            priceAdjustment: variant.priceAdjustment.toString(),
            stockQuantity: variant.stock,
          })),
        );
      }
      createdCount++;
    }
    console.log(`  ✓ Created ${createdCount} products (${PRODUCTS.length - createdCount} already existed)`);
  });

  console.log('🌿 Done');
}

seedPlants()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
