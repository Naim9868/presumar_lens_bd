// app/components/CategoryGrid.tsx
'use client';

import Link from "next/link";
import Image from "next/image";

const categories = [
  {
    name: "Blue Light Glasses",
    count: 45,
    image: "/category1.jpg",
    color: "from-blue-500/20 to-blue-600/20"
  },
  {
    name: "Sunglasses",
    count: 32,
    image: "/category2.jpg",
    color: "from-amber-500/20 to-amber-600/20"
  },
  {
    name: "Reading Glasses",
    count: 28,
    image: "/category3.jpg",
    color: "from-green-500/20 to-green-600/20"
  },
  {
    name: "Sports Eyewear",
    count: 19,
    image: "/category4.jpg",
    color: "from-purple-500/20 to-purple-600/20"
  }
];

const CategoryGrid = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600">
            Find exactly what you're looking for in our curated collections
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={index}
              href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color}`}></div>
              </div>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Image</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                <h3 className="text-xl font-bold">{category.name}</h3>
                <p className="text-sm opacity-90">{category.count} Products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;