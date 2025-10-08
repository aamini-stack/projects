import React from 'react';
import { Button } from '@aamini/ui/components/button';
import { Separator } from '@aamini/ui/components/separator';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Shield,
  Zap,
  Award
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = {
    services: [
      { name: 'Data Recovery', href: '#services' },
      { name: 'Laptop Repair', href: '#services' },
      { name: 'Computer Repair', href: '#services' },
      { name: 'Apple Products', href: '#services' },
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Testimonials', href: '#testimonials' },
      { name: 'Contact', href: '#contact' },
      { name: 'Privacy Policy', href: '#' },
    ],
    support: [
      { name: 'Emergency Support', href: 'tel:1-504-885-1635' },
      { name: 'Free Diagnostic', href: '#contact' },
      { name: 'Warranty Info', href: '#' },
      { name: 'FAQ', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  const businessInfo = {
    address: "5416 Veterans Blvd. Metairie, LA 70003",
    phone: "1-504-885-1635",
    email: "info@afcom-inc.com",
    hours: "10am - 6:00pm Mon-Sat",
  };

  return (
    <footer className="relative overflow-hidden border-t border-border/20">
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Main footer content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
                    <svg
                      className="w-8 h-8 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                      <path className="text-primary-foreground/80" d="M12 2v20c5.16-1.26 9-6.45 9-12V7l-9-4.5z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gradient">PC Tune-Ups</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional Computer Repair Services
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Your trusted partner for all computer and device repair needs in Metairie. 
                Fast, reliable service with a satisfaction guarantee.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4 text-primary" />
                  <span>15+ Years Experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Same-Day Service</span>
                </div>
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-110"
                      asChild
                    >
                      <a href={social.href} aria-label={social.label}>
                        <social.icon className="w-5 h-5" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Services links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Services</h4>
              <ul className="space-y-2">
                {navigationLinks.services.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="space-y-2">
                {navigationLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Contact Info</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {businessInfo.address}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <a 
                    href={`tel:${businessInfo.phone}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {businessInfo.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <a 
                    href={`mailto:${businessInfo.email}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {businessInfo.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {businessInfo.hours}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="border-border/20" />

        {/* Bottom footer */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} PC Tune-Ups. All rights reserved.
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Sitemap
              </a>
            </div>

            <Button 
              className="btn-tech gradient-cyber text-primary-foreground px-6 py-2 text-sm"
              asChild
            >
              <a href="#contact">
                Get Free Quote
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;