// app/components/Newsletter.tsx
'use client';

import { useState } from "react";
import { Send } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Stay in the Loop
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Subscribe to get special offers, free giveaways, and exclusive deals.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white font-semibold rounded-full hover:bg-amber-700 transition-all duration-200"
          >
            Subscribe
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {subscribed && (
          <p className="mt-4 text-green-400 animate-bounce">
            Thank you for subscribing! 🎉
          </p>
        )}
      </div>
    </section>
  );
};

export default Newsletter;