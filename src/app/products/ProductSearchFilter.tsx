// components/products/ProductSearchFilter.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  RotateCcw,
} from "lucide-react";

import { IProduct } from "@/types/product";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface ProductSearchFilterProps {
  onProductsUpdate: (products: IProduct[], total: number) => void;
  onLoadingChange?: (loading: boolean) => void;
  brands: Brand[];
  initialSort?: string;
  className?: string;
}

const sortOptions = [
  {
    value: "newest",
    label: "Newest First",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
    icon: <TrendingUp className="w-4 h-4 rotate-90" />,
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
    icon: <TrendingUp className="w-4 h-4 -rotate-90" />,
  },
  {
    value: "rating_desc",
    label: "Top Rated",
    icon: <Star className="w-4 h-4" />,
  },
];

export default function ProductSearchFilter({
  onProductsUpdate,
  onLoadingChange,
  brands,
  initialSort = "newest",
  className = "",
}: ProductSearchFilterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selectedSort, setSelectedSort] = useState(initialSort);

  const [selectedPriceRange, setSelectedPriceRange] = useState<{
    min?: number;
    max?: number;
  }>({
    min: 0,
    max: 1000,
  });

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  const [inStockOnly, setInStockOnly] = useState(false);

  const [loading, setLoading] = useState(false);

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const currentPageRef = useRef(1);

  const limit = 12;

  // Active Filters Count
  useEffect(() => {
    let count = 0;

    if (searchQuery) count++;

    if (selectedSort !== "newest") count++;

    if (
      selectedPriceRange.min !== 0 ||
      selectedPriceRange.max !== 1000
    )
      count++;

    if (selectedBrandId) count++;

    if (inStockOnly) count++;

    setActiveFiltersCount(count);
  }, [
    searchQuery,
    selectedSort,
    selectedPriceRange,
    selectedBrandId,
    inStockOnly,
  ]);

  // Fetch Products
  const fetchProducts = useCallback(
    async (page: number = 1) => {
      setLoading(true);

      onLoadingChange?.(true);

      const params = new URLSearchParams();

      params.set("page", page.toString());

      params.set("limit", limit.toString());

      params.set("status", "active");

      if (searchQuery) params.set("query", searchQuery);

      if (selectedSort !== "newest") {
        params.set("sortBy", selectedSort);
      }

      if (selectedPriceRange.min !== undefined) {
        params.set("minPrice", selectedPriceRange.min.toString());
      }

      if (selectedPriceRange.max !== undefined) {
        params.set("maxPrice", selectedPriceRange.max.toString());
      }

      if (selectedBrandId) {
        params.set("brandId", selectedBrandId);
      }

      if (inStockOnly) {
        params.set("inStock", "true");
      }

      try {
        const response = await fetch(
          `/api/products?${params.toString()}`
        );

        const data = await response.json();

        if (data.products) {
          const transformedProducts = data.products.map(
            (product: any) => {
              const totalInventory =
                product.variants?.reduce(
                  (sum: number, v: any) =>
                    sum + (v.inventory || 0),
                  0
                ) || 0;

              const isAvailable =
                product.variants?.some(
                  (v: any) => v.inventory > 0
                ) || false;

              return {
                ...product,
                totalInventory,
                isAvailable,
              };
            }
          );

          let filteredProducts = transformedProducts;

          if (inStockOnly) {
            filteredProducts = transformedProducts.filter(
              (p: any) => p.isAvailable === true
            );
          }

          onProductsUpdate(
            filteredProducts,
            filteredProducts.length
          );

          currentPageRef.current = page;
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);

        onLoadingChange?.(false);
      }
    },
    [
      searchQuery,
      selectedSort,
      selectedPriceRange,
      selectedBrandId,
      inStockOnly,
      onProductsUpdate,
      onLoadingChange,
    ]
  );

  // Debounced Search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);

      fetchProducts(1);
    }, 500);
  };

  // Apply Filters
  const applyFilters = () => {
    setIsModalOpen(false);

    fetchProducts(1);
  };

  // Clear Filters
  const clearAllFilters = () => {
    setSearchQuery("");

    setSearchInput("");

    setSelectedSort("newest");

    setSelectedPriceRange({
      min: 0,
      max: 1000,
    });

    setSelectedBrandId("");

    setInStockOnly(false);

    fetchProducts(1);
  };

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === selectedSort)
      ?.label || "Newest First";

  return (
    <>
      {/* Top Filter Bar */}
      <div
        className={`flex flex-wrap items-center gap-3 ${className}`}
      >
        {/* Search */}
        <div className="flex-1 relative min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) =>
              handleSearchChange(e.target.value)
            }
            className="
              w-full pl-12 pr-10 py-3
              rounded-full
              border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900
              text-sm
              focus:outline-none
              focus:border-amber-400
              focus:ring-2 focus:ring-amber-400/20
              transition-all
            "
          />

          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="
            relative flex items-center gap-2
            px-5 py-3
            rounded-full
            border border-gray-200 dark:border-slate-700
            bg-white dark:bg-slate-900
            hover:border-amber-400
            transition-all
          "
        >
          <Filter className="w-5 h-5" />

          <span className="hidden sm:block text-sm font-medium">
            Filters
          </span>

          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={selectedSort}
            onChange={(e) => {
              setSelectedSort(e.target.value);

              fetchProducts(1);
            }}
            className="
              appearance-none
              px-4 py-3 pr-10
              rounded-full
              border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900
              text-sm
              focus:outline-none
              focus:border-amber-400
              cursor-pointer
            "
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div
            className="
              fixed left-1/2 top-1/2
              -translate-x-1/2 -translate-y-1/2
              w-[95%] sm:w-[90%] md:w-[480px] lg:w-[520px]
              max-h-[85vh]
              overflow-y-auto
              rounded-3xl
              border border-gray-200 dark:border-slate-800
              bg-white dark:bg-slate-900
              shadow-2xl
              z-50
              animate-in fade-in zoom-in-95 duration-300
            "
          >
            {/* Header */}
            <div
              className="
                sticky top-0 z-10
                flex items-center justify-between
                p-5
                border-b border-gray-200 dark:border-slate-800
                bg-white/90 dark:bg-slate-900/90
                backdrop-blur-xl
                rounded-t-3xl
              "
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Filter Products
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Customize your shopping experience
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-7">
              {/* Sort */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Sort By
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setSelectedSort(option.value)
                      }
                      className={`
                        flex items-center gap-2
                        px-4 py-3
                        rounded-xl
                        text-sm
                        transition-all
                        border
                        ${
                          selectedSort === option.value
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800"
                            : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-amber-400"
                        }
                      `}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Price Range
                  </h3>

                  <span className="text-sm font-medium text-amber-500">
                    ${selectedPriceRange.min} - $
                    {selectedPriceRange.max}
                  </span>
                </div>

                {/* Range Sliders */}
                <div className="space-y-4 mb-5">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={selectedPriceRange.min}
                    onChange={(e) =>
                      setSelectedPriceRange((prev) => ({
                        ...prev,
                        min: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500"
                  />

                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={selectedPriceRange.max}
                    onChange={(e) =>
                      setSelectedPriceRange((prev) => ({
                        ...prev,
                        max: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Manual Inputs */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Min Price
                    </label>

                    <input
                      type="number"
                      value={selectedPriceRange.min}
                      onChange={(e) =>
                        setSelectedPriceRange((prev) => ({
                          ...prev,
                          min: Number(e.target.value),
                        }))
                      }
                      className="
                        w-full px-4 py-2.5
                        rounded-xl
                        border border-gray-200 dark:border-slate-700
                        bg-white dark:bg-slate-800
                        focus:outline-none
                        focus:border-amber-400
                      "
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Max Price
                    </label>

                    <input
                      type="number"
                      value={selectedPriceRange.max}
                      onChange={(e) =>
                        setSelectedPriceRange((prev) => ({
                          ...prev,
                          max: Number(e.target.value),
                        }))
                      }
                      className="
                        w-full px-4 py-2.5
                        rounded-xl
                        border border-gray-200 dark:border-slate-700
                        bg-white dark:bg-slate-800
                        focus:outline-none
                        focus:border-amber-400
                      "
                    />
                  </div>
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Brands
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setSelectedBrandId("")
                      }
                      className={`
                        px-4 py-2 rounded-full text-sm transition-all border
                        ${
                          !selectedBrandId
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-amber-400"
                        }
                      `}
                    >
                      All
                    </button>

                    {brands.map((brand) => (
                      <button
                        key={brand._id}
                        onClick={() =>
                          setSelectedBrandId(brand._id)
                        }
                        className={`
                          px-4 py-2 rounded-full text-sm transition-all border
                          ${
                            selectedBrandId === brand._id
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-amber-400"
                          }
                        `}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* In Stock */}
              <div>
                <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 cursor-pointer">
                  <span className="font-medium text-gray-900 dark:text-white">
                    In Stock Only
                  </span>

                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) =>
                      setInStockOnly(e.target.checked)
                    }
                    className="w-5 h-5 accent-amber-500"
                  />
                </label>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Active Filters
                    </h3>

                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs">
                        {searchQuery}
                      </span>
                    )}

                    {selectedBrandId && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs">
                        {
                          brands.find(
                            (b) =>
                              b._id === selectedBrandId
                          )?.name
                        }
                      </span>
                    )}

                    {inStockOnly && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="
                sticky bottom-0
                flex gap-3
                p-4
                border-t border-gray-200 dark:border-slate-800
                bg-white/90 dark:bg-slate-900/90
                backdrop-blur-xl
                rounded-b-3xl
              "
            >
              <button
                onClick={clearAllFilters}
                className="
                  flex-1 px-4 py-3
                  rounded-xl
                  border border-gray-300 dark:border-slate-700
                  hover:bg-gray-50 dark:hover:bg-slate-800
                  transition-colors
                  text-sm font-medium
                "
              >
                Clear All
              </button>

              <button
                onClick={applyFilters}
                className="
                  flex-1 px-4 py-3
                  rounded-xl
                  bg-gradient-to-r from-[#191970] to-[#2563EB]
                  text-white
                  text-sm font-medium
                  hover:shadow-lg
                  transition-all
                "
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}