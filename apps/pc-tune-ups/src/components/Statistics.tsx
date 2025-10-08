import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@aamini/ui/components/card';
import { Users, Laptop, Monitor, Cpu } from 'lucide-react';

const Statistics = () => {
  const [counters, setCounters] = useState({
    customers: 0,
    laptops: 0,
    computers: 0,
    os: 0,
  });

  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const targetValues = {
    customers: 1250,
    laptops: 890,
    computers: 1560,
    os: 3200,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds for all counters
    const steps = 60; // 60 frames for smooth animation
    const increment = {
      customers: targetValues.customers / steps,
      laptops: targetValues.laptops / steps,
      computers: targetValues.computers / steps,
      os: targetValues.os / steps,
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      
      setCounters(prev => ({
        customers: Math.min(prev.customers + increment.customers, targetValues.customers),
        laptops: Math.min(prev.laptops + increment.laptops, targetValues.laptops),
        computers: Math.min(prev.computers + increment.computers, targetValues.computers),
        os: Math.min(prev.os + increment.os, targetValues.os),
      }));

      if (currentStep >= steps) {
        clearInterval(timer);
        // Set exact final values to avoid rounding issues
        setCounters(targetValues);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible]);

  const stats = [
    {
      icon: Users,
      value: counters.customers,
      target: targetValues.customers,
      label: "Happy Customers",
      description: "Satisfied clients across Louisiana",
      gradient: "from-blue-500 to-cyan-500",
      delay: 0,
    },
    {
      icon: Laptop,
      value: counters.laptops,
      target: targetValues.laptops,
      label: "Laptops Repaired",
      description: "Professional laptop services",
      gradient: "from-cyan-500 to-teal-500",
      delay: 100,
    },
    {
      icon: Monitor,
      value: counters.computers,
      target: targetValues.computers,
      label: "Computers Repaired",
      description: "Desktop systems restored",
      gradient: "from-teal-500 to-green-500",
      delay: 200,
    },
    {
      icon: Cpu,
      value: counters.os,
      target: targetValues.os,
      label: "OS Installed",
      description: "Operating systems configured",
      gradient: "from-green-500 to-blue-500",
      delay: 300,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-responsive-h2 font-bold mb-6">
            <span className="text-gradient">Our Achievements</span>
          </h2>
          <p className="text-responsive-body text-muted-foreground leading-relaxed">
            Numbers don't lie. We're proud of our track record and the trust 
            our customers place in us every day.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className={`
                relative overflow-hidden border-0 glass card-tech text-center
                scroll-reveal
              `}
              style={{ animationDelay: `${stat.delay}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 
                hover:opacity-10 transition-opacity duration-500
              `}></div>
              
              <CardContent className="relative p-6">
                {/* Icon with gradient background */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.gradient}
                  flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                  shadow-lg group-hover:shadow-xl animate-pulse
                `}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                {/* Counter */}
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gradient tabular-nums">
                    {Math.round(stat.value).toLocaleString()}
                  </span>
                  <span className="text-2xl text-muted-foreground">+</span>
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {stat.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>

                {/* Decorative elements */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-border/20 rounded-full overflow-hidden">
                  <div 
                    className={`
                      h-full bg-gradient-to-r ${stat.gradient} rounded-full
                      transition-all duration-2000 ease-out
                    `}
                    style={{ 
                      width: isVisible ? `${(stat.value / stat.target) * 100}%` : '0%',
                      transitionDelay: `${stat.delay}ms`
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom trust indicators */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-8 border border-primary/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-gradient">
              Trusted by the Community
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-primary rounded-full"></div>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground">5-Star Rating</p>
                <p className="text-xs text-muted-foreground">Google Reviews</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">15+</div>
                <p className="text-sm font-medium text-foreground">Years Experience</p>
                <p className="text-xs text-muted-foreground">Serving Louisiana</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-accent">24/7</div>
                <p className="text-sm font-medium text-foreground">Emergency Support</p>
                <p className="text-xs text-muted-foreground">When You Need Us</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;