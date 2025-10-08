import React from 'react';
import { Card, CardContent } from '@aamini/ui/components/card';
import { Badge } from '@aamini/ui/components/badge';
import { Award, Zap, Heart, TrendingUp } from 'lucide-react';

const Values = () => {
  const values = [
    {
      icon: Award,
      title: "Focus on Quality",
      description: "We never compromise on quality parts or methods. Every repair is performed with precision and attention to detail, ensuring your device works like new.",
      badge: "Premium Parts",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Quick Repair",
      description: "Our in-house services mean faster turnaround times. Most repairs are completed same-day, getting you back to your digital life without delay.",
      badge: "Same-Day Service",
      gradient: "from-cyan-500 to-teal-500"
    },
    {
      icon: Heart,
      title: "We are Passionate",
      description: "Technology isn't just our job—it's our passion. We stay current with the latest innovations to provide cutting-edge solutions for all your tech needs.",
      badge: "Tech Experts",
      gradient: "from-teal-500 to-green-500"
    },
    {
      icon: TrendingUp,
      title: "Make it Better",
      description: "We don't just fix problems; we improve performance. Every service includes optimization to ensure your device runs better than before.",
      badge: "Performance Boost",
      gradient: "from-green-500 to-blue-500"
    }
  ];

  return (
    <section id="about" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Our Core Values
          </Badge>
          <h2 className="text-responsive-h2 font-bold mb-6">
            <span className="text-gradient">Why Choose PC Tune-Ups</span>
          </h2>
          <p className="text-responsive-body text-muted-foreground leading-relaxed">
            We're not just another repair shop. We're your technology partners, 
            committed to delivering exceptional service with integrity and expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card 
              key={index}
              className={`
                relative overflow-hidden border-0 glass card-tech group
                scroll-reveal
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 
                group-hover:opacity-10 transition-opacity duration-500
              `}></div>
              
              <CardContent className="relative p-6 text-center">
                {/* Icon with gradient background */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${value.gradient}
                  flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                  shadow-lg group-hover:shadow-xl
                `}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>

                {/* Badge */}
                <Badge 
                  variant="secondary" 
                  className="mb-3 bg-background/50 border-border/20 text-xs"
                >
                  {value.badge}
                </Badge>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>

                {/* Decorative element */}
                <div className={`
                  absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1
                  bg-gradient-to-r ${value.gradient} rounded-full
                  scale-x-0 group-hover:scale-x-100 transition-transform duration-500
                `}></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl glass border border-primary/20">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Ready to Experience the Difference?
              </h3>
              <p className="text-sm text-muted-foreground">
                Join hundreds of satisfied customers who trust us with their devices.
              </p>
            </div>
            <a 
              href="#contact"
              className="btn-tech gradient-cyber text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;