import React, { useState } from 'react';
import { Card, CardContent } from '@aamini/ui/components/card';
import { Button } from '@aamini/ui/components/button';
import { Input } from '@aamini/ui/components/input';
import { Textarea } from '@aamini/ui/components/textarea';
import { Badge } from '@aamini/ui/components/badge';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const businessInfo = {
    address: "5416 Veterans Blvd. Metairie, LA 70003",
    phone: "1-504-885-1635",
    email: "info@afcom-inc.com",
    hours: "10am - 6:00pm Mon-Sat",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    }, 3000);
  };

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Get In Touch
          </Badge>
          <h2 className="text-responsive-h2 font-bold mb-6">
            <span className="text-gradient">Contact Us</span>
          </h2>
          <p className="text-responsive-body text-muted-foreground leading-relaxed">
            Ready to get your device fixed? Reach out today for a free diagnostic 
            and quote. We're here to help with all your technology needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="border-0 glass card-tech">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-foreground">
                Send Us a Message
              </h3>
              
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-muted-foreground">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      className="bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Describe your issue or what service you need..."
                      className="bg-background/50 border-border/50 focus:border-primary resize-none"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-tech gradient-cyber text-primary-foreground w-full py-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent border-r-transparent animate-spin rounded-full"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </div>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card className="border-0 glass card-tech">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-foreground">
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <a 
                        href={`tel:${businessInfo.phone}`}
                        className="text-primary hover:text-accent transition-colors"
                      >
                        {businessInfo.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <a 
                        href={`mailto:${businessInfo.email}`}
                        className="text-primary hover:text-accent transition-colors"
                      >
                        {businessInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground">
                        {businessInfo.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Hours</p>
                      <p className="text-muted-foreground">
                        {businessInfo.hours}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 glass card-tech">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-foreground">
                  Quick Actions
                </h3>
                
                <div className="space-y-4">
                  <Button 
                    className="btn-tech gradient-tech text-primary-foreground w-full justify-start"
                    asChild
                  >
                    <a href={`tel:${businessInfo.phone}`} className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full justify-start border-primary/20 hover:border-primary/40"
                    asChild
                  >
                    <a href={`mailto:${businessInfo.email}`} className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Us
                    </a>
                  </Button>

                  <div className="pt-4 border-t border-border/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Emergency repairs available outside business hours.
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full justify-start border-accent/20 hover:border-accent/40 hover:bg-accent/10"
                      asChild
                    >
                      <a href={`tel:${businessInfo.phone}`} className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Emergency Support
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;