// src/components/layout/Footer.tsx
import Link from 'next/link';
import { 
 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';

const footerSections = {
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press', href: '/press' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { name: 'Help Center', href: '/help' },
      { name: 'Returns', href: '/returns' },
      { name: 'Shipping Info', href: '/shipping' },
      { name: 'FAQs', href: '/faqs' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  },
};

const paymentIcons = [
  { name: 'Visa', icon: '💳' },
  { name: 'Mastercard', icon: '💳' },
  { name: 'PayPal', icon: '💰' },
  { name: 'Apple Pay', icon: '📱' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-gray-400">Get the latest updates on new products and exclusive offers</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold">LensStore</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your one-stop shop for premium camera lenses and photography equipment. 
              Quality products, competitive prices, and exceptional customer service.
            </p>
            <div className="flex items-center gap-4">
              {/* {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))} */}
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{footerSections.company.title}</h4>
            <ul className="space-y-2">
              {footerSections.company.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-amber-500 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{footerSections.support.title}</h4>
            <ul className="space-y-2">
              {footerSections.support.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-amber-500 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{footerSections.legal.title}</h4>
            <ul className="space-y-2">
              {footerSections.legal.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-amber-500 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8 border-t border-gray-800 mt-8">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-amber-500" />
            <div>
              <h5 className="font-semibold">Free Shipping</h5>
              <p className="text-sm text-gray-400">On orders over $50</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-amber-500" />
            <div>
              <h5 className="font-semibold">30 Day Returns</h5>
              <p className="text-sm text-gray-400">Money back guarantee</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            <div>
              <h5 className="font-semibold">Secure Checkout</h5>
              <p className="text-sm text-gray-400">100% secure payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            <div>
              <h5 className="font-semibold">Payment Options</h5>
              <p className="text-sm text-gray-400">Multiple payment methods</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} LensStore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}