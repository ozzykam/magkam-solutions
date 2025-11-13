import { StoreSettings } from '@/types/business-info';

export interface BusinessPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'agency' | 'professional' | 'creative' | 'consulting';
  settings: Partial<Omit<StoreSettings, 'id' | 'updatedAt'>>;
}

export const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    id: 'web-dev-agency',
    name: 'Web Development Agency',
    description: 'Perfect for web development and software agencies',
    icon: '💻',
    category: 'agency',
    settings: {
      businessName: 'Your Web Agency',
      businessDescription: 'Building exceptional digital experiences for modern businesses',
      themeSettings: {
        primaryColor: '#3B82F6',    // Blue
        secondaryColor: '#8B5CF6',  // Purple
        fontFamily: 'Inter',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Service',
        serviceNamePlural: 'Services',
        urlSlug: 'services',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Blog Post',
        sectionNamePlural: 'Blog',
        itemsLabel: 'Featured Projects',
        itemsLabelSingular: 'Featured Project',
        urlSlug: 'blog',
        showAuthor: true,
        showViewCount: false,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Build Your Digital Future',
          highlightedText: 'With Expert Web Solutions',
          subtitle: 'Custom web applications and digital experiences that drive results for your business',
          primaryCTA: {
            text: 'View Our Services',
            link: '/services',
          },
          secondaryCTA: {
            text: 'See Our Work',
            link: '/blog',
          },
        },
        features: {
          feature1: {
            title: 'Modern Technology',
            description: 'Built with the latest frameworks and best practices',
            icon: 'star',
          },
          feature2: {
            title: 'Fast Delivery',
            description: 'Efficient development process with quick turnaround',
            icon: 'clock',
          },
          feature3: {
            title: 'Ongoing Support',
            description: 'Continuous maintenance and support after launch',
            icon: 'shield',
          },
        },
        cta: {
          heading: 'Ready to Start Your Project?',
          subtitle: 'Let\'s build something amazing together',
          buttonText: 'Get a Free Quote',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: true, showInNavigation: true },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: true },
        bookmarks: { enabled: true, showInNavigation: true },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
  {
    id: 'marketing-agency',
    name: 'Marketing Agency',
    description: 'Ideal for digital marketing and advertising agencies',
    icon: '📈',
    category: 'agency',
    settings: {
      businessName: 'Your Marketing Agency',
      businessDescription: 'Data-driven marketing strategies that grow your business',
      themeSettings: {
        primaryColor: '#F97316',    // Orange
        secondaryColor: '#EAB308',  // Yellow
        fontFamily: 'Poppins',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Solution',
        serviceNamePlural: 'Solutions',
        urlSlug: 'solutions',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Article',
        sectionNamePlural: 'Resources',
        itemsLabel: 'Key Insights',
        itemsLabelSingular: 'Key Insight',
        urlSlug: 'resources',
        showAuthor: true,
        showViewCount: true,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Grow Your Business',
          highlightedText: 'With Smart Marketing',
          subtitle: 'Data-driven strategies that deliver measurable results and sustainable growth',
          primaryCTA: {
            text: 'Explore Solutions',
            link: '/solutions',
          },
          secondaryCTA: {
            text: 'Our Results',
            link: '/resources',
          },
        },
        features: {
          feature1: {
            title: 'ROI Focused',
            description: 'Strategies designed to maximize your return on investment',
            icon: 'star',
          },
          feature2: {
            title: 'Multi-Channel',
            description: 'Integrated campaigns across all digital platforms',
            icon: 'users',
          },
          feature3: {
            title: 'Analytics Driven',
            description: 'Real-time tracking and optimization of your campaigns',
            icon: 'check',
          },
        },
        cta: {
          heading: 'Ready to Accelerate Growth?',
          subtitle: 'Join hundreds of businesses achieving their marketing goals',
          buttonText: 'Schedule a Consultation',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: true, showInNavigation: true },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: true },
        bookmarks: { enabled: true, showInNavigation: true },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
  {
    id: 'design-agency',
    name: 'Design Agency',
    description: 'Built for creative and design studios',
    icon: '🎨',
    category: 'creative',
    settings: {
      businessName: 'Your Design Studio',
      businessDescription: 'Crafting beautiful and functional design solutions',
      themeSettings: {
        primaryColor: '#EC4899',    // Pink
        secondaryColor: '#8B5CF6',  // Purple
        fontFamily: 'Playfair Display',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Service',
        serviceNamePlural: 'Services',
        urlSlug: 'services',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Project',
        sectionNamePlural: 'Portfolio',
        itemsLabel: 'Design Elements',
        itemsLabelSingular: 'Design Element',
        urlSlug: 'portfolio',
        showAuthor: true,
        showViewCount: false,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Design That Inspires',
          highlightedText: 'Brands That Resonate',
          subtitle: 'We create memorable visual experiences that connect with your audience',
          primaryCTA: {
            text: 'View Our Work',
            link: '/portfolio',
          },
          secondaryCTA: {
            text: 'Our Services',
            link: '/services',
          },
        },
        features: {
          feature1: {
            title: 'Creative Excellence',
            description: 'Award-winning designs that stand out from the crowd',
            icon: 'star',
          },
          feature2: {
            title: 'Brand Strategy',
            description: 'Holistic approach to building lasting brand identity',
            icon: 'heart',
          },
          feature3: {
            title: 'Collaborative Process',
            description: 'Working closely with you every step of the way',
            icon: 'users',
          },
        },
        cta: {
          heading: 'Let\'s Create Something Beautiful',
          subtitle: 'Transform your vision into stunning reality',
          buttonText: 'Start Your Project',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: false, showInNavigation: false },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: true },
        bookmarks: { enabled: true, showInNavigation: true },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
  {
    id: 'consulting-firm',
    name: 'Consulting Firm',
    description: 'Professional setup for consulting businesses',
    icon: '💼',
    category: 'consulting',
    settings: {
      businessName: 'Your Consulting Firm',
      businessDescription: 'Strategic guidance for business transformation',
      themeSettings: {
        primaryColor: '#0EA5E9',    // Sky Blue
        secondaryColor: '#06B6D4',  // Cyan
        fontFamily: 'Merriweather',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Solution',
        serviceNamePlural: 'Solutions',
        urlSlug: 'solutions',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Insight',
        sectionNamePlural: 'Insights',
        itemsLabel: 'Key Takeaways',
        itemsLabelSingular: 'Key Takeaway',
        urlSlug: 'insights',
        showAuthor: true,
        showViewCount: false,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Strategic Consulting',
          highlightedText: 'For Business Excellence',
          subtitle: 'Expert guidance to navigate challenges and unlock your organization\'s full potential',
          primaryCTA: {
            text: 'Our Solutions',
            link: '/solutions',
          },
          secondaryCTA: {
            text: 'Learn More',
            link: '/insights',
          },
        },
        features: {
          feature1: {
            title: 'Proven Expertise',
            description: 'Decades of combined experience across industries',
            icon: 'shield',
          },
          feature2: {
            title: 'Tailored Approach',
            description: 'Customized strategies for your unique challenges',
            icon: 'star',
          },
          feature3: {
            title: 'Measurable Results',
            description: 'Clear KPIs and tracking for demonstrated impact',
            icon: 'check',
          },
        },
        cta: {
          heading: 'Ready to Transform Your Business?',
          subtitle: 'Partner with experts who understand your industry',
          buttonText: 'Schedule Consultation',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: true, showInNavigation: true },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: false },
        bookmarks: { enabled: true, showInNavigation: true },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
  {
    id: 'photography-studio',
    name: 'Photography Studio',
    description: 'Showcase your photography services beautifully',
    icon: '📸',
    category: 'creative',
    settings: {
      businessName: 'Your Photography Studio',
      businessDescription: 'Capturing moments that last a lifetime',
      themeSettings: {
        primaryColor: '#6366F1',    // Indigo
        secondaryColor: '#EC4899',  // Pink
        fontFamily: 'Raleway',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Package',
        serviceNamePlural: 'Packages',
        urlSlug: 'packages',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Gallery',
        sectionNamePlural: 'Galleries',
        itemsLabel: 'Featured Photos',
        itemsLabelSingular: 'Featured Photo',
        urlSlug: 'galleries',
        showAuthor: false,
        showViewCount: false,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Every Moment Matters',
          highlightedText: 'Let Us Capture Yours',
          subtitle: 'Professional photography that tells your unique story',
          primaryCTA: {
            text: 'View Packages',
            link: '/packages',
          },
          secondaryCTA: {
            text: 'See Our Work',
            link: '/galleries',
          },
        },
        features: {
          feature1: {
            title: 'Professional Quality',
            description: 'High-end equipment and expert techniques',
            icon: 'star',
          },
          feature2: {
            title: 'Quick Turnaround',
            description: 'Edited photos delivered within 2 weeks',
            icon: 'clock',
          },
          feature3: {
            title: 'Unlimited Revisions',
            description: 'We work until you\'re completely satisfied',
            icon: 'heart',
          },
        },
        cta: {
          heading: 'Ready to Book Your Session?',
          subtitle: 'Limited slots available each month',
          buttonText: 'Book Now',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: false, showInNavigation: false },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: true },
        bookmarks: { enabled: false, showInNavigation: false },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
  {
    id: 'content-agency',
    name: 'Content Creation Agency',
    description: 'For content creators and media production',
    icon: '✍️',
    category: 'creative',
    settings: {
      businessName: 'Your Content Agency',
      businessDescription: 'Compelling content that engages and converts',
      themeSettings: {
        primaryColor: '#10B981',    // Green
        secondaryColor: '#F59E0B',  // Amber
        fontFamily: 'Open Sans',
      },
      serviceSettings: {
        enabled: true,
        serviceName: 'Service',
        serviceNamePlural: 'Services',
        urlSlug: 'services',
      },
      contentSettings: {
        enabled: true,
        sectionName: 'Case Study',
        sectionNamePlural: 'Case Studies',
        itemsLabel: 'Results',
        itemsLabelSingular: 'Result',
        urlSlug: 'case-studies',
        showAuthor: true,
        showViewCount: true,
        allowVendorPosts: false,
      },
      homepageSettings: {
        hero: {
          headline: 'Content That Converts',
          highlightedText: 'Stories That Sell',
          subtitle: 'Strategic content creation that drives engagement and delivers results',
          primaryCTA: {
            text: 'Our Services',
            link: '/services',
          },
          secondaryCTA: {
            text: 'View Results',
            link: '/case-studies',
          },
        },
        features: {
          feature1: {
            title: 'Multi-Format',
            description: 'Blog posts, videos, social media, and more',
            icon: 'star',
          },
          feature2: {
            title: 'SEO Optimized',
            description: 'Content designed to rank and drive organic traffic',
            icon: 'check',
          },
          feature3: {
            title: 'Consistent Delivery',
            description: 'Reliable production schedule you can count on',
            icon: 'clock',
          },
        },
        cta: {
          heading: 'Ready to Elevate Your Content?',
          subtitle: 'Let\'s create content that your audience loves',
          buttonText: 'Get Started',
          buttonLink: '/contact',
        },
      },
      features: {
        calculators: { enabled: false, showInNavigation: false },
        reviews: { enabled: true, allowAnonymous: false, requireModeration: false, allowPhotos: true },
        bookmarks: { enabled: true, showInNavigation: true },
        contact: { enabled: true, requireAuth: false },
        userRegistration: { enabled: true, requireEmailVerification: false, allowSocialLogin: false },
        search: { enabled: true, searchServices: true, searchContent: true },
      },
    },
  },
];

export function getPresetById(id: string): BusinessPreset | undefined {
  return BUSINESS_PRESETS.find(preset => preset.id === id);
}

export function getPresetsByCategory(category: BusinessPreset['category']): BusinessPreset[] {
  return BUSINESS_PRESETS.filter(preset => preset.category === category);
}
