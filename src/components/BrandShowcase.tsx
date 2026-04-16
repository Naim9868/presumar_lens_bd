// app/components/BrandShowcase.tsx
'use client';

const brands = [
  { name: "Luxottica", logo: "/brand1.png" },
  { name: "Essilor", logo: "/brand2.png" },
  { name: "Zeiss", logo: "/brand3.png" },
  { name: "Nikon", logo: "/brand4.png" },
  { name: "Ray-Ban", logo: "/brand5.png" },
];

const BrandShowcase = () => {
  return (
    <section className="py-12 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          {brands.map((brand, index) => (
            <div key={index} className="text-center opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="h-12 flex items-center justify-center">
                <span className="text-gray-500 font-semibold">{brand.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandShowcase;