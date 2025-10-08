import React, { useState } from 'react';
import { Card, CardContent } from '@aamini/ui/components/card';
import { Badge } from '@aamini/ui/components/badge';
import { Button } from '@aamini/ui/components/button';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Rory Blandin",
      role: "Small Business Owner",
      content: "PC Tune-Ups saved my business when our main computer crashed right before tax season. They had us up and running in 24 hours and recovered all our critical data. Their expertise and professionalism are unmatched in the New Orleans area.",
      rating: 5,
      avatar: "RB",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Damian D Deakle Sr.",
      role: "Home User",
      content: "I thought my laptop was beyond repair after spilling coffee on it. The team at PC Tune-Ups not only fixed it but made it run better than when it was new. Fair prices and honest service - you can't ask for more.",
      rating: 5,
      avatar: "DD",
      gradient: "from-cyan-500 to-teal-500"
    },
    {
      name: "Dylan Aittama",
      role: "College Student",
      content: "As a student, my laptop is my lifeline. When it started running slow and crashing, I was panicking about finals. PC Tune-Ups optimized it and upgraded my RAM. Now it's faster than ever! Thank you for saving my semester!",
      rating: 5,
      avatar: "DA",
      gradient: "from-teal-500 to-green-500"
    },
    {
      name: "Eddie Obrien",
      role: "Co-Founder, Break-thru Productions",
      content: "We manage multiple creative workstations and PC Tune-Ups has been our go-to IT partner for years. They handle everything from routine maintenance to emergency repairs. Their response time and technical knowledge keep our business running smoothly.",
      rating: 5,
      avatar: "EO",
      gradient: "from-green-500 to-blue-500"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section id="testimonials" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 tech-grid opacity-10"></div>
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            Customer Reviews
          </Badge>
          <h2 className="text-responsive-h2 font-bold mb-6">
            <span className="text-gradient">What Our Customers Say</span>
          </h2>
          <p className="text-responsive-body text-muted-foreground leading-relaxed">
            Don't just take our word for it. Hear from real customers who have 
            experienced our exceptional service and technical expertise.
          </p>
        </div>

        {/* Main testimonial display */}
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-0 glass card-tech">
            {/* Gradient background */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${testimonials[currentIndex].gradient} opacity-5
            `}></div>
            
            <CardContent className="relative p-8 md:p-12">
              {/* Quote icon */}
              <div className="absolute top-4 right-4 opacity-20">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex justify-center mb-6">
                <div className="flex gap-1">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
              </div>

              {/* Testimonial content */}
              <blockquote className="text-center mb-8">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed italic">
                  "{testimonials[currentIndex].content}"
                </p>
              </blockquote>

              {/* Author info */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-16 h-16 rounded-full bg-gradient-to-br ${testimonials[currentIndex].gradient}
                  flex items-center justify-center text-white font-bold text-xl
                  mb-4 shadow-lg
                `}>
                  {testimonials[currentIndex].avatar}
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-foreground">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[currentIndex].role}
                  </p>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevTestimonial}
                  className="hover:bg-primary/10 transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                {/* Dots indicator */}
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToTestimonial(index)}
                      className={`
                        w-2 h-2 rounded-full transition-all duration-300
                        ${index === currentIndex 
                          ? 'bg-primary w-8' 
                          : 'bg-primary/30 hover:bg-primary/50'
                        }
                      `}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextTestimonial}
                  className="hover:bg-primary/10 transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional testimonials grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <Card 
              key={index}
              className="glass border-0 card-tech p-6 scroll-reveal"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient}
                  flex items-center justify-center text-white font-bold text-sm
                  flex-shrink-0
                `}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-8 border border-primary/20 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-gradient">
              Join Our Satisfied Customers
            </h3>
            <p className="text-muted-foreground mb-6">
              Experience the same exceptional service that our customers rave about.
            </p>
            <Button 
              className="btn-tech gradient-cyber text-primary-foreground px-8"
              asChild
            >
              <a href="#contact">
                Get Started Today
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;