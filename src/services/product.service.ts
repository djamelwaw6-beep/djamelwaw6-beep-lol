import { Injectable, signal } from '@angular/core';
import { Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private initialProducts: Product[] = [
    {
      id: 1, name: 'نظارات رياضية واقية', price: 3500, category: 'معدات رياضية',
      image: 'https://images.unsplash.com/photo-1619494121703-acc71b8e4343?q=80&w=400&h=400&fit=crop',
      description: 'نظارات عالية الأداء لحماية العينين أثناء ممارسة الرياضة، مع حزام قابل للتعديل.',
      variants: []
    },
    {
      id: 2, name: 'حقيبة ظهر Arctic Hunter', price: 7800, category: 'اكسسوارات',
      image: 'https://images.unsplash.com/photo-1577733966930-d922316e0395?q=80&w=400&h=400&fit=crop',
      description: 'حقيبة ظهر عصرية ومتينة، مثالية للاستخدام اليومي والسفر.',
      variants: []
    },
    {
      id: 3, name: 'مجموعة حقيبة يد للأطفال', price: 2800, category: 'ألعاب',
      image: 'https://images.unsplash.com/photo-1599623560574-32d5f04203e3?q=80&w=400&h=400&fit=crop',
      description: 'مجموعة لعب ممتعة للبنات الصغيرات تحتوي على حقيبة يد واكسسوارات.',
      variants: []
    },
    {
      id: 4, name: 'مجموعة أدوات مدرسية متكاملة', price: 4500, category: 'أدوات مدرسية',
      image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=400&h=400&fit=crop',
      description: 'كل ما يحتاجه الطالب في مجموعة واحدة، من الأقلام إلى الأدوات الهندسية.',
      variants: []
    },
    {
      id: 5, name: 'طقم كراسي بار عصرية', price: 18000, category: 'ديكور منزلي',
      image: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=400&h=400&fit=crop',
      description: 'طقم من كرسيين بتصميم بسيط وأنيق يضيف لمسة عصرية لمطبخك.',
      variants: []
    },
    {
      id: 6, name: 'غطاء حماية شفاف للآيفون', price: 1500, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1614728263952-84ea256ec346?q=80&w=400&h=400&fit=crop',
      description: 'غطاء حماية أنيق وشفاف يبرز جمال هاتفك ويحميه من الصدمات.',
      variants: []
    },
    {
      id: 7, name: 'مجموعة العناية بالبشرة الفاخرة', price: 8500, category: 'مستحضرات تجميل',
      image: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=400&h=400&fit=crop',
      description: 'مجموعة متكاملة للعناية بالبشرة تمنحك إشراقة ونضارة.',
      variants: []
    },
    {
      id: 8, name: 'سلة فواكه طازجة', price: 4000, category: 'مواد غذائية',
      image: 'https://images.unsplash.com/photo-1594314122048-9f34565b12a8?q=80&w=400&h=400&fit=crop',
      description: 'تشكيلة من الفواكه الموسمية الطازجة والغنية بالفيتامينات.',
      variants: []
    },
    {
      id: 9, name: 'حزام رفع أثقال جلدي', price: 4200, category: 'معدات رياضية',
      image: 'https://images.unsplash.com/photo-1578899897811-197b165b4c4d?q=80&w=400&h=400&fit=crop',
      description: 'حزام من الجلد القوي لدعم الظهر أثناء تمارين رفع الأثقال.',
      variants: []
    },
    {
      id: 10, name: 'إضاءة سقف معلقة مودرن', price: 9500, category: 'ديكور منزلي',
      image: 'https://images.unsplash.com/photo-1530912403983-5a4a5a541434?q=80&w=400&h=400&fit=crop',
      description: 'إضاءة بتصميم صناعي حديث تضفي طابعًا فريدًا على أي غرفة.',
      variants: []
    },
    {
      id: 11, name: 'سجادة وردية بتصميم عصري', price: 15000, category: 'ديكور منزلي',
      image: 'https://images.unsplash.com/photo-1617300329520-37748834a5d8?q=80&w=400&h=400&fit=crop',
      description: 'سجادة ناعمة بتصميم ورود بارزة تضيف لمسة من الأناقة والدفء.',
      variants: []
    },
    {
      id: 12, name: 'سماعات أذن لاسلكية مع شاشة', price: 6800, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1606220584373-f2473373703c?q=80&w=400&h=400&fit=crop',
      description: 'جودة صوت عالية وحرية كاملة بدون أسلاك مع علبة شحن ذكية.',
      variants: []
    },
    {
      id: 13, name: 'مجموعة إعداد ألعاب وردية', price: 22000, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1598550476439-6847785f5533?q=80&w=400&h=400&fit=crop',
      description: 'لوحة مفاتيح وماوس بتصميم جذاب وإضاءة RGB للاعبين.',
      variants: []
    },
    {
      id: 14, name: 'هاتف ذكي قابل للطي (فليب)', price: 110000, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1662996372343-d288926935a8?q=80&w=400&h=400&fit=crop',
      description: 'تصميم أنيق ومدمج يجمع بين الماضي والمستقبل في جهاز واحد.',
      variants: []
    },
    {
      id: 15, name: 'هاتف ذكي قابل للطي (فولد)', price: 180000, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1660658709085-02456451c142?q=80&w=400&h=400&fit=crop',
      description: 'شاشة كبيرة بحجم الجهاز اللوحي في جيبك لأداء وإنتاجية لا مثيل لهما.',
      variants: []
    },
    {
      id: 16, name: 'ساعة ذكية مستقبلية', price: 35000, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1544148413-0a79a836473c?q=80&w=400&h=400&fit=crop',
      description: 'ساعة ذكية بتصميم فريد وميزات متقدمة لتتبع صحتك وأنشطتك.',
      variants: []
    },
    {
      id: 17, name: 'ساعة Garmin Fenix الذكية', price: 45000, category: 'إلكترونيات',
      image: 'https://images.unsplash.com/photo-1617502159424-95123b3a7a25?q=80&w=400&h=400&fit=crop',
      description: 'مصممة للمغامرين والرياضيين، مع GPS ومستشعرات دقيقة.',
      variants: []
    },
    {
      id: 18, name: 'ساعة ذكية وردية أنيقة', price: 28000, category: 'اكسسوارات',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=400&h=400&fit=crop',
      description: 'تجمع بين الأناقة والتكنولوجيا، مثالية لمراقبة لياقتك اليومية.',
      variants: []
    },
    {
      id: 19, name: 'صندوق خضروات طازجة', price: 3200, category: 'مواد غذائية',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop',
      description: 'تشكيلة متنوعة من الخضروات الطازجة والصحية مباشرة من المزرعة.',
      variants: []
    },
    {
      id: 20, name: 'باليت ظلال عيون احترافية', price: 5500, category: 'مستحضرات تجميل',
      image: 'https://images.unsplash.com/photo-1583241801233-3b1b55972740?q=80&w=400&h=400&fit=crop',
      description: 'مجموعة واسعة من الألوان الغنية والثابتة لإطلالات مكياج لا حصر لها.',
      variants: []
    },
    {
      id: 21, name: 'حقيبة كتف عصرية', price: 6500, category: 'اكسسوارات',
      image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=400&h=400&fit=crop',
      description: 'حقيبة كتف بتصميم بسيط وعملي تناسب جميع إطلالاتك اليومية.',
      variants: []
    },
    {
      id: 22, name: 'حزام أدوات البستنة', price: 2500, category: 'مستلزمات منزلية',
      image: 'https://images.unsplash.com/photo-1617576624968-a40e4959404d?q=80&w=400&h=400&fit=crop',
      description: 'حزام عملي لتنظيم وحمل أدوات الحديقة بسهولة أثناء العمل.',
      variants: []
    },
    {
      id: 23, name: 'حقيبة يد نسائية أنيقة', price: 9200, category: 'اكسسوارات',
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1f2997d0d?q=80&w=400&h=400&fit=crop',
      description: 'حقيبة يد بتصميم كلاسيكي راقٍ يضيف لمسة من الفخامة لإطلالتك.',
      variants: []
    },
    {
      id: 24, name: 'مجموعة مواد غذائية أساسية', price: 5500, category: 'مواد غذائية',
      image: 'https://images.unsplash.com/photo-1606913725592-b43a29983944?q=80&w=400&h=400&fit=crop',
      description: 'حزمة تحتوي على المواد الغذائية الجافة الأساسية مثل المعكرونة والزيت.',
      variants: []
    },
    {
      id: 25, name: 'آيس كريم متنوع', price: 800, category: 'مواد غذائية',
      image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?q=80&w=400&h=400&fit=crop',
      description: 'استمتع بطعم الآيس كريم اللذيذ بنكهات متعددة ومنعشة.',
      variants: []
    }
  ];

  products = signal<Product[]>(this.loadProducts());

  private loadProducts(): Product[] {
    if (typeof localStorage === 'undefined') return this.initialProducts;
    try {
      const savedProducts = localStorage.getItem('platinumStoreProducts');
      if (savedProducts) {
        return JSON.parse(savedProducts);
      } else {
        // If nothing is saved, save the initial products for the first run.
        localStorage.setItem('platinumStoreProducts', JSON.stringify(this.initialProducts));
        return this.initialProducts;
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
      return this.initialProducts;
    }
  }

  private saveProducts() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('platinumStoreProducts', JSON.stringify(this.products()));
  }

  addProduct(product: Omit<Product, 'id'>) {
    this.products.update(products => [...products, { ...product, id: Date.now() }]);
    this.saveProducts();
  }

  updateProduct(updatedProduct: Product) {
    this.products.update(products => products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    this.saveProducts();
  }

  deleteProduct(id: number) {
    this.products.update(products => products.filter(p => p.id !== id));
    this.saveProducts();
  }
  
  updateCategory(oldCategory: string, newCategory: string) {
    this.products.update(products => 
      products.map(p => (p.category === oldCategory ? { ...p, category: newCategory } : p))
    );
    this.saveProducts();
  }

  deleteCategory(category: string) {
    this.products.update(products => products.filter(p => p.category !== category));
    this.saveProducts();
  }
}