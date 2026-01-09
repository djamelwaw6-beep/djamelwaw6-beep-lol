
import { Injectable, signal } from '@angular/core';
import { Product, ProductVariant } from '../models';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'ساعة ذكية فاخرة',
    price: 12000,
    category: 'إلكترونيات',
    image: 'https://picsum.photos/400/400?random=1',
    description: 'ساعة ذكية بميزات تتبع اللياقة البدنية ومراقبة الصحة، مع تصميم أنيق.',
    variants: [
      { color: '#000000', image: 'https://picsum.photos/400/400?random=11', sizes: ['مقاس واحد'] },
      { color: '#A9A9A9', image: 'https://picsum.photos/400/400?random=12', sizes: ['مقاس واحد'] },
    ],
  },
  {
    id: 2,
    name: 'سماعات بلوتوث لاسلكية',
    price: 8500,
    category: 'إلكترونيات',
    image: 'https://picsum.photos/400/400?random=2',
    description: 'جودة صوت استثنائية وعزل للضوضاء، مثالية للاستخدام اليومي والرياضة.',
    variants: [
      { color: '#FF0000', image: 'https://picsum.photos/400/400?random=21', sizes: ['صغير', 'متوسط', 'كبير'] },
      { color: '#0000FF', image: 'https://picsum.photos/400/400?random=22', sizes: ['صغير', 'متوسط', 'كبير'] },
    ],
  },
  {
    id: 3,
    name: 'كاميرا احترافية بدقة 4K',
    price: 45000,
    category: 'إلكترونيات',
    image: 'https://picsum.photos/400/400?random=3',
    description: 'كاميرا عالية الدقة مع عدسات قابلة للتبديل، مثالية للمصورين المحترفين.',
    variants: [],
  },
  {
    id: 4,
    name: 'حذاء رياضي مريح',
    price: 6000,
    category: 'أحذية',
    image: 'https://picsum.photos/400/400?random=4',
    description: 'حذاء خفيف الوزن ومريح، مثالي للجري والتمارين اليومية.',
    variants: [
      { color: '#FFFFFF', image: 'https://picsum.photos/400/400?random=41', sizes: ['40', '41', '42', '43', '44'] },
      { color: '#000000', image: 'https://picsum.photos/400/400?random=42', sizes: ['40', '41', '42', '43', '44'] },
    ],
  },
  {
    id: 5,
    name: 'فستان سهرة أنيق',
    price: 15000,
    category: 'ملابس',
    image: 'https://picsum.photos/400/400?random=5',
    description: 'فستان طويل بتصميم فريد، مصنوع من أجود الأقمشة، مناسب للمناسبات الخاصة.',
    variants: [
      { color: '#8B008B', image: 'https://picsum.photos/400/400?random=51', sizes: ['S', 'M', 'L'] },
      { color: '#800000', image: 'https://picsum.photos/400/400?random=52', sizes: ['S', 'M', 'L'] },
    ],
  },
  {
    id: 6,
    name: 'حقيبة يد جلدية',
    price: 9500,
    category: 'إكسسوارات',
    image: 'https://picsum.photos/400/400?random=6',
    description: 'حقيبة أنيقة وعملية، مصنوعة من الجلد الطبيعي الفاخر.',
    variants: [
      { color: '#8B4513', image: 'https://picsum.photos/400/400?random=61', sizes: ['مقاس واحد'] },
      { color: '#B8860B', image: 'https://picsum.photos/400/400?random=62', sizes: ['مقاس واحد'] },
    ],
  },
  {
    id: 7,
    name: 'نظارة شمسية عصرية',
    price: 3000,
    category: 'إكسسوارات',
    image: 'https://picsum.photos/400/400?random=7',
    description: 'نظارة شمسية بتصميم حديث، توفر حماية 100% من الأشعة فوق البنفسجية.',
    variants: [],
  },
  {
    id: 8,
    name: 'كمبيوتر محمول للألعاب',
    price: 180000,
    category: 'إلكترونيات',
    image: 'https://picsum.photos/400/400?random=8',
    description: 'أداء فائق للعب وتحرير الفيديو، مع شاشة عالية التحديث.',
    variants: [],
  },
  {
    id: 9,
    name: 'قميص رجالي كلاسيكي',
    price: 4000,
    category: 'ملابس',
    image: 'https://picsum.photos/400/400?random=9',
    description: 'قميص قطني مريح، مثالي للعمل أو المناسبات الرسمية.',
    variants: [
      { color: '#FFFFFF', image: 'https://picsum.photos/400/400?random=91', sizes: ['S', 'M', 'L', 'XL'] },
      { color: '#00008B', image: 'https://picsum.photos/400/400?random=92', sizes: ['S', 'M', 'L', 'XL'] },
    ],
  },
  {
    id: 10,
    name: 'مقلاة غير لاصقة',
    price: 2500,
    category: 'أدوات منزلية',
    image: 'https://picsum.photos/400/400?random=10',
    description: 'مقلاة متينة وسهلة التنظيف، ضرورية لكل مطبخ.',
    variants: [],
  },
  {
    id: 11,
    name: 'عطر نسائي فاخر',
    price: 7500,
    category: 'عطور',
    image: 'https://picsum.photos/400/400?random=13',
    description: 'رائحة جذابة تدوم طويلاً، مزيج من الزهور والفواكه.',
    variants: [],
  },
  {
    id: 12,
    name: 'مجموعة مكياج متكاملة',
    price: 5000,
    category: 'مكياج',
    image: 'https://picsum.photos/400/400?random=14',
    description: 'كل ما تحتاجينه لإطلالة مثالية، تتضمن ظلال العيون وأحمر الشفاه.',
    variants: [],
  },
  {
    id: 13,
    name: 'كتاب "فن اللامبالاة"',
    price: 1500,
    category: 'كتب',
    image: 'https://picsum.photos/400/400?random=15',
    description: 'كتاب تطوير ذاتي يساعدك على فهم أولوياتك في الحياة.',
    variants: [],
  },
  {
    id: 14,
    name: 'طاولة قهوة خشبية',
    price: 10000,
    category: 'أثاث',
    image: 'https://picsum.photos/400/400?random=16',
    description: 'طاولة أنيقة وعملية لغرفة المعيشة، مصنوعة من الخشب الصلب.',
    variants: [],
  },
  {
    id: 15,
    name: 'مصباح مكتبي LED',
    price: 3500,
    category: 'إضاءة',
    image: 'https://picsum.photos/400/400?random=17',
    description: 'مصباح موفر للطاقة مع إضاءة قابلة للتعديل، مثالي للدراسة والعمل.',
    variants: [],
  },
  {
    id: 16,
    name: 'مكنسة كهربائية روبوتية',
    price: 25000,
    category: 'أدوات منزلية',
    image: 'https://picsum.photos/400/400?random=18',
    description: 'تنظيف ذكي لمنزلك، تعمل تلقائياً مع خريطة للمنزل.',
    variants: [],
  },
  {
    id: 17,
    name: 'سروال جينز رجالي',
    price: 5000,
    category: 'ملابس',
    image: 'https://picsum.photos/400/400?random=19',
    description: 'جينز مريح وعصري، متوفر بمقاسات مختلفة.',
    variants: [
      { color: '#4682B4', image: 'https://picsum.photos/400/400?random=191', sizes: ['30', '32', '34', '36'] },
      { color: '#1E90FF', image: 'https://picsum.photos/400/400?random=192', sizes: ['30', '32', '34', '36'] },
    ],
  },
  {
    id: 18,
    name: 'لعبة أطفال تعليمية',
    price: 1800,
    category: 'ألعاب',
    image: 'https://picsum.photos/400/400?random=20',
    description: 'لعبة خشبية تنمي مهارات التفكير والإبداع لدى الأطفال.',
    variants: [],
  },
  {
    id: 19,
    name: 'كوب قهوة حراري',
    price: 1200,
    category: 'أدوات مطبخ',
    image: 'https://picsum.photos/400/400?random=23',
    description: 'يحافظ على درجة حرارة مشروبك لساعات طويلة، مثالي للمكتب.',
    variants: [
      { color: '#696969', image: 'https://picsum.photos/400/400?random=231', sizes: ['مقاس واحد'] },
      { color: '#800000', image: 'https://picsum.photos/400/400?random=232', sizes: ['مقاس واحد'] },
    ],
  },
  {
    id: 20,
    name: 'مكمل غذائي بروتين',
    price: 9000,
    category: 'صحة ولياقة',
    image: 'https://picsum.photos/400/400?random=24',
    description: 'يساعد في بناء العضلات وتحسين الأداء الرياضي.',
    variants: [],
  },
];


@Injectable({ providedIn: 'root' })
export class ProductService {
  products = signal<Product[]>(this.loadProducts());

  private loadProducts(): Product[] {
    if (typeof localStorage === 'undefined') return DEFAULT_PRODUCTS;
    try {
      const saved = localStorage.getItem('platinumStoreProducts');
      const loadedProducts = saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
      
      // Ensure IDs are unique numbers and types are correct for variants
      const finalProducts = loadedProducts.map((p: any) => {
        const product: Product = {
          ...p,
          id: Number(p.id) || Date.now() + Math.random(), // Ensure numeric ID, fallback if missing
          price: Number(p.price) || 0,
          variants: p.variants ? p.variants.map((v: any) => ({
            color: v.color || '#000000',
            image: v.image || undefined,
            sizes: Array.isArray(v.sizes) ? v.sizes : (typeof v.sizes === 'string' ? v.sizes.split(',').map((s: string) => s.trim()) : []),
          })) : [],
        };
        return product;
      });

      // If loaded products are empty, return defaults.
      return finalProducts.length > 0 ? finalProducts : DEFAULT_PRODUCTS;

    } catch (e) {
      console.error('Failed to load products from localStorage, falling back to defaults', e);
      return DEFAULT_PRODUCTS;
    }
  }

  private saveProducts() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('platinumStoreProducts', JSON.stringify(this.products()));
  }

  addProduct(product: Omit<Product, 'id'>) {
    const newProduct: Product = {
      ...product,
      id: Date.now() + Math.random(), // Simple unique ID
    };
    this.products.update(currentProducts => [...currentProducts, newProduct]);
    this.saveProducts();
  }

  updateProduct(updatedProduct: Product) {
    this.products.update(currentProducts =>
      currentProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    this.saveProducts();
  }

  deleteProduct(id: number) {
    this.products.update(currentProducts => currentProducts.filter(p => p.id !== id));
    this.saveProducts();
  }

  updateCategory(oldCategoryName: string, newCategoryName: string) {
    this.products.update(currentProducts =>
      currentProducts.map(p =>
        p.category === oldCategoryName ? { ...p, category: newCategoryName } : p
      )
    );
    this.saveProducts();
  }

  deleteCategory(categoryToDelete: string) {
    // Reassign products from deleted category to a 'General' category
    this.products.update(currentProducts =>
      currentProducts.map(p =>
        p.category === categoryToDelete ? { ...p, category: 'عام' } : p
      )
    );
    this.saveProducts();
  }

  resetToDefaults() {
    this.products.set(DEFAULT_PRODUCTS);
    this.saveProducts();
  }
}