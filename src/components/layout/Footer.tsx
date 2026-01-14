import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const footerLinks = {
  shop: [
    { name: 'All Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'New Arrivals', path: '/products?filter=new' },
    { name: 'Best Sellers', path: '/products?filter=best' },
  ],
  company: [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ],
  support: [
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund Policy', path: '/refund' },
  ],
};

const socialLinks = [
  { icon: 'fa-facebook-f', href: '#', label: 'Facebook' },
  { icon: 'fa-instagram', href: '#', label: 'Instagram' },
  { icon: 'fa-twitter', href: '#', label: 'Twitter' },
  { icon: 'fa-pinterest-p', href: '#', label: 'Pinterest' },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-custom py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-cursive text-2xl md:text-3xl">Join Our Newsletter</h3>
              <p className="text-white/60 text-sm mt-1">Get updates on new arrivals and special offers</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full h-10 w-full md:w-64"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full h-10 px-6 text-xs uppercase tracking-wider">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-cursive text-2xl font-bold">
                <span className="text-primary">Studio</span>
                <span className="text-white"> Sara</span>
              </span>
            </Link>
            <p className="text-white/70 text-xs sm:text-sm mb-2">
              Premium textiles, prints and embroideries
            </p>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Premium floral textiles and prints. Handcrafted with love in India.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-colors"
                >
                  <i className={`fa-brands ${social.icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/60 hover:text-primary text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/60 hover:text-primary text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/60 hover:text-primary text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} Studio Sara. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <i className="fa-brands fa-cc-visa text-lg"></i>
              <i className="fa-brands fa-cc-mastercard text-lg"></i>
              <i className="fa-brands fa-cc-paypal text-lg"></i>
              <i className="fa-brands fa-google-pay text-lg"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
