import React, { useState, useEffect } from 'react';
import { Button } from '@aamini/ui/components/button';
import { Menu, X, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  const contactInfo = {
    phone: '1-504-885-1635',
    email: 'info@afcom-inc.com',
    address: '5416 Veterans Blvd. Metairie, LA 70003',
    hours: '10am - 6:00pm Mon-Sat',
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'glass shadow-lg py-2' 
          : 'bg-transparent py-4'
        }
      `}
    >
      {/* Top bar with contact info */}
      <div className={`${isScrolled ? 'hidden' : 'block'} border-b border-border/20`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <a 
                href={`tel:${contactInfo.phone}`}
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <Phone className="w-4 h-4 group-hover:animate-pulse" />
                <span className="hidden sm:inline">{contactInfo.phone}</span>
                <span className="sm:hidden">{contactInfo.phone}</span>
              </a>
              <a 
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <Mail className="w-4 h-4 group-hover:animate-pulse" />
                <span className="hidden sm:inline">{contactInfo.email}</span>
                <span className="sm:hidden">Email</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline">{contactInfo.hours}</span>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="p-1.5 rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-110"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
              <h1 className="text-xl font-bold text-gradient">PC Tune-Ups</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Professional Computer Repair
              </p>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="relative text-foreground hover:text-primary transition-colors duration-200 group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* CTA button */}
          <div className="hidden lg:block">
            <Button 
              className="btn-tech gradient-tech text-primary-foreground shadow-lg hover:shadow-xl"
              asChild
            >
              <a href="#contact">Get Free Estimate</a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 p-4 glass rounded-xl animate-fade-in">
            <div className="flex flex-col gap-4">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              
              <div className="border-t border-border/20 pt-4 space-y-3">
                <a 
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {contactInfo.phone}
                </a>
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contactInfo.email}
                </a>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{contactInfo.address}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {contactInfo.hours}
                </div>
              </div>

              <Button 
                className="btn-tech gradient-tech text-primary-foreground w-full"
                asChild
              >
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                  Get Free Estimate
                </a>
              </Button>

              <div className="flex justify-center gap-3 pt-4 border-t border-border/20">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="p-2 rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-110"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;