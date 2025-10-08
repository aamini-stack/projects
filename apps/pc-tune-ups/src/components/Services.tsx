import React from 'react';
import { Card, CardContent } from '@aamini/ui/components/card';
import { Button } from '@aamini/ui/components/button';
import { Badge } from '@aamini/ui/components/badge';
import { 
  Database, 
  Laptop, 
  Monitor, 
  Smartphone, 
  Cpu, 
  Network,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Database,
      title: "Data Backup & Recovery",
      description: "Lost important files? We specialize in recovering data from failed drives, corrupted systems, and accidental deletions. Your precious memories and critical business data are our priority.",
      features: ["Hard Drive Recovery", "SSD Data Retrieval", "Cloud Backup Setup", "RAID Recovery"],
      gradient: "from-blue-500 to-cyan-500",
      popular: true
    },
    {
      icon: Laptop,
      title: "Laptop Repair",
      description: "From cracked screens to motherboard issues, we handle all laptop repairs with precision. We work with all major brands including Dell, HP, Lenovo, MacBook, and more.",
      features: ["Screen Replacement", "Keyboard Repair", "Battery Replacement", "DC Jack Repair"],
      gradient: "from-cyan-500 to-teal-500",
      popular: false
    },
    {
      icon: Monitor,
      title: "Computer Repair",
      description: "Desktop computers acting up? Our expert technicians diagnose and fix hardware and software issues quickly, getting your PC back to optimal performance.",
      features: ["Virus Removal", "Hardware Upgrades", "System Optimization", "Custom Builds"],
      gradient: "from-teal-500 to-green-500",
      popular: false
    },
    {
      icon: Smartphone,
      title: "Apple Products Repair",
      description: "Authorized repair techniques for all Apple devices. From iPhone screen replacements to MacBook logic board repairs, we use genuine parts and specialized tools.",
      features: ["iPhone Repair", "iPad Repair", "MacBook Service", "iMac Repair"],
      gradient: "from-green-500 to-blue-500",
      popular: true
    },
    {
      icon: Cpu,
      title: "Hardware Update",
      description: "Boost your computer's performance with strategic hardware upgrades. We help you choose the right components for your needs and budget.",
      features: ["RAM Upgrades", "SSD Installation", "Graphics Cards", "CPU Upgrades"],
      gradient: "from-blue-500 to-indigo-500",
      popular: false
    },
    {
      icon: Network,
      title: "Networking / Onsite",
      description: "Professional networking solutions for home and business. From WiFi setup to complete network infrastructure, we ensure reliable connectivity.",
      features: ["Network Setup", "WiFi Optimization", "Cable Installation", "Onsite Support"],
      gradient: "from-indigo-500 to-purple-500",
      popular: false
    }
  ];

  return (
    <section id="services" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Our Services
          </Badge>
          <h2 className="text-responsive-h2 font-bold mb-6">
            <span className="text-gradient">Complete Tech Solutions</span>
          </h2>
          <p className="text-responsive-body text-muted-foreground leading-relaxed">
            From simple repairs to complex upgrades, we offer comprehensive services 
            to keep your technology running smoothly. No job is too big or too small.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index}
              className={`
                relative overflow-hidden border-0 glass card-tech group
                scroll-reveal
                ${service.popular ? 'ring-2 ring-primary/20 glow-effect' : ''}
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular badge */}
              {service.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-primary text-primary-foreground text-xs font-medium">
                    Popular
                  </Badge>
                </div>
              )}

              {/* Gradient background on hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 
                group-hover:opacity-10 transition-opacity duration-500
              `}></div>
              
              <CardContent className="relative p-6">
                {/* Icon with gradient background */}
                <div className={`
                  w-16 h-16 mb-4 rounded-xl bg-gradient-to-br ${service.gradient}
                  flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                  shadow-lg group-hover:shadow-xl
                `}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {service.description}
                </p>

                {/* Features list */}
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <Button 
                  variant="outline" 
                  className="w-full group/btn border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                  asChild
                >
                  <a href="#contact" className="flex items-center justify-center gap-2">
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </Button>

                {/* Decorative element */}
                <div className={`
                  absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1
                  bg-gradient-to-r ${service.gradient} rounded-full
                  scale-x-0 group-hover:scale-x-100 transition-transform duration-500
                `}></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA section */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-8 border border-primary/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gradient">
              Don't See What You Need?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We handle a wide range of tech issues beyond what's listed here. 
              Contact us for any computer or device problem - we're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="btn-tech gradient-cyber text-primary-foreground px-8"
                asChild
              >
                <a href="#contact">
                  Get Free Quote
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="glass border-2 border-primary/20 hover:border-primary/40 px-8"
                asChild
              >
                <a href="tel:1-504-885-1635">
                  Call Now: 1-504-885-1635
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;