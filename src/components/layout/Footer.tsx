import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const footerLinks = {
  shop: [
    { name: 'All Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'New Arrivals', path: '/products?filter=new' },
    { name: 'Best Sellers', path: '/products?filter=best' },
    { name: 'Sale', path: '/products?filter=sale' },
  ],
  company: [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Careers', path: '/careers' },
  ],
  support: [
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund Policy', path: '/refund' },
    { name: 'Shipping Info', path: '/shipping' },
  ],
};

const socialLinks = [
  { icon: 'fa-facebook-f', href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
  { icon: 'fa-instagram', href: '#', label: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400' },
  { icon: 'fa-twitter', href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
  { icon: 'fa-pinterest-p', href: '#', label: 'Pinterest', color: 'hover:bg-red-600' },
  { icon: 'fa-youtube', href: '#', label: 'Youtube', color: 'hover:bg-red-500' },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-tertiary" />
      <div className="absolute top-20 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      {/* Newsletter Section */}
      <div className="relative border-b border-white/10">
        <div className="container-custom py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold mb-4">
              <i className="fa-solid fa-envelope mr-2"></i>
              Newsletter
            </span>
            <h3 className="font-cursive text-4xl md:text-5xl mb-4 text-white">
              Join Our Community
            </h3>
            <p className="text-white/70 mb-8 text-lg">
              Subscribe for exclusive offers, new arrivals, and design inspiration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 px-6"
              />
              <Button className="btn-primary whitespace-nowrap h-14">
                Subscribe
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary flex items-center justify-center">
                <span className="text-white font-cursive text-3xl font-bold">S</span>
              </div>
              <div>
                <span className="font-cursive text-3xl font-bold text-white block">Studio Sara</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/50">Premium Textiles</span>
              </div>
            </Link>
            <p className="text-white/70 mb-8 max-w-sm text-base leading-relaxed">
              Curating beautiful floral-inspired textiles and prints that bring warmth and elegance to your everyday life. Made with love in India.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <a href="mailto:hello@studiosara.in" className="flex items-center gap-4 text-white/70 hover:text-primary transition-colors group">
                <span className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-envelope"></i>
                </span>
                hello@studiosara.in
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-4 text-white/70 hover:text-primary transition-colors group">
                <span className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <i className="fa-solid fa-phone"></i>
                </span>
                +91 98765 43210
              </a>
              <div className="flex items-start gap-4 text-white/70">
                <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
                <span>42 Textile Hub, Jaipur, Rajasthan 302001</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-cursive text-2xl font-bold mb-6 text-white">Shop</h4>
            <ul className="space-y-4">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-white/70 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <i className="fa-solid fa-chevron-right text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-cursive text-2xl font-bold mb-6 text-white">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-white/70 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <i className="fa-solid fa-chevron-right text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-cursive text-2xl font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-white/70 hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <i className="fa-solid fa-chevron-right text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 relative">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Studio Sara. All rights reserved. Made with <i className="fa-solid fa-heart text-primary mx-1"></i> in India
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white ${social.color} transition-all duration-300`}
                >
                  <i className={`fa-brands ${social.icon}`}></i>
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3 text-white/40">
              <i className="fa-brands fa-cc-visa text-2xl hover:text-white/70 transition-colors"></i>
              <i className="fa-brands fa-cc-mastercard text-2xl hover:text-white/70 transition-colors"></i>
              <i className="fa-brands fa-cc-paypal text-2xl hover:text-white/70 transition-colors"></i>
              <i className="fa-brands fa-google-pay text-2xl hover:text-white/70 transition-colors"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
