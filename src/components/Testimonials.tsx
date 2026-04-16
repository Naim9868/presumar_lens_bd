// app/components/Testimonials.tsx
'use client';

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Verified Buyer",
    content: "Absolutely love my new glasses! The quality is exceptional and the blue light filtering has reduced my eye strain significantly.",
    rating: 5,
    image: "/avatar1.jpg"
  },
  {
    name: "Michael Chen",
    role: "Verified Buyer",
    content: "Best investment I've made for my eyes. The frames are stylish and comfortable. Customer service was outstanding!",
    rating: 5,
    image: "/avatar2.jpg"
  },
  {
    name: "Emily Rodriguez",
    role: "Verified Buyer",
    content: "The transition lenses are a game-changer. Perfect for both indoor and outdoor use. Highly recommend PresumerLensBD!",
    rating: 5,
    image: "/avatar3.jpg"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600">
            Join thousands of satisfied customers who trust PresumerLensBD
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;