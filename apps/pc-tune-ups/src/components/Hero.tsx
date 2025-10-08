import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@aamini/ui/components/button';
import { ArrowRight, Zap, Shield, Clock, Star } from 'lucide-react';
import { cn } from '@aamini/ui/lib/utils';

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: Zap, text: "Lightning Fast Repairs", delay: 100 },
    { icon: Shield, text: "100% Satisfaction Guarantee", delay: 200 },
    { icon: Clock, text: "Same-Day Service Available", delay: 300 },
    { icon: Star, text: "Expert Technicians", delay: 400 },
  ];

  return (
    <section 
      id="home" 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Animated background layers */}
      <div className="absolute inset-0 tech-grid opacity-30"></div>
      
      {/* Dynamic gradient orb that follows mouse */}
      <div 
        className="absolute w-96 h-96 rounded-full bg-gradient-radial from-primary/20 via-accent/10 to-transparent blur-3xl pointer-events-none transition-all duration-1000 ease-out"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Floating geometric elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rounded-lg animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-accent/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 border border-cyan/20 rounded-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 border border-blue/20 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 glow-effect animate-fade-in">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-primary">Your Trusted PC Repair Experts in Metairie</span>
          </div>

          {/* Main headline */}
          <div className="space-y-4">
            <h1 className="text-responsive-h1 font-bold">
              <span className="block text-gradient animate-gradient">iPhone Repair Metairie</span>
              <span className="block text-foreground">& Computer Repair Services</span>
            </h1>
            <p className="text-responsive-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional diagnostics, fast repairs, and exceptional service for all your devices. 
              From iPhone screen replacements to complex computer repairs, we bring your technology back to life.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl glass border border-border/20",
                  "card-tech scroll-reveal"
                )}
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <feature.icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="btn-tech gradient-cyber text-primary-foreground px-8 py-6 text-lg shadow-xl hover:shadow-2xl group"
              asChild
            >
              <a href="#contact" className="flex items-center gap-2">
                Get Free Diagnostic
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="glass border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 px-8 py-6 text-lg group"
              asChild
            >
              <a href="#services" className="flex items-center gap-2">
                View Our Services
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <span>500+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>24/7 Emergency Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;