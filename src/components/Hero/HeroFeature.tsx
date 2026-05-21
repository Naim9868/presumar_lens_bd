// HeroFeature.tsx - Clean minimal features
"use client";

import React from "react";
import { Truck, CreditCard, ShieldCheck, Headphones } from "lucide-react";

const HeroFeature = () => {
  const features = [
    {
      icon: <Truck className="w-5 h-5" />,
      title: "Fast Delivery",
      description: "Free shipping on $50+",
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: "Secure Payment",
      description: "100% encrypted",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Official Warranty",
      description: "1 year guarantee",
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: "24/7 Support",
      description: "Expert assistance",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {features.map((feature, index) => (
        <div
          key={index}
          className="group bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#191970] to-[#2563EB] text-white p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <div>
              <h4 className="text-gray-800 dark:text-white font-semibold text-sm">
                {feature.title}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroFeature;