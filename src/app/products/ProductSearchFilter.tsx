// components/products/ProductSearchFilter.tsx
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

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
  initialBrandSlug?: string;
  className?: string;
}

const MIN_PRICE = 0;
const MAX_PRICE = 10000;

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
  initialBrandSlug = "",
  className = "",
}: ProductSearchFilterProps) {
  const [mounted, setMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");

  const initialBrand = brands.find(
    (b) => b.slug === initialBrandSlug
  );

  const [filters, setFilters] = useState({
    searchQuery: "",
    selectedSort: initialSort,
    selectedBrandId: initialBrand?._id || "",
    inStockOnly: false,
    minPrice: MIN_PRICE,
    maxPrice: MAX_PRICE,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // body lock
  useEffect(() => {
    if (!mounted) return;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, mounted]);

  // cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      abortControllerRef.current?.abort();
    };
  }, []);

  // active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (filters.searchQuery) count++;

    if (filters.selectedSort !== "newest") count++;

    if (filters.selectedBrandId) count++;

    if (filters.inStockOnly) count++;

    if (
      filters.minPrice !== MIN_PRICE ||
      filters.maxPrice !== MAX_PRICE
    ) {
      count++;
    }

    return count;
  }, [filters]);

  // fetch products
  const fetchProducts = useCallback(
    async (customFilters = filters) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();

      abortControllerRef.current = controller;

      try {
        onLoadingChange?.(true);

        const params = new URLSearchParams();

        params.set("page", "1");

        params.set("limit", "12");

        params.set("status", "active");

        if (customFilters.searchQuery) {
          params.set("query", customFilters.searchQuery);
        }

        if (customFilters.selectedSort !== "newest") {
          params.set("sortBy", customFilters.selectedSort);
        }

        if (customFilters.selectedBrandId) {
          params.set("brandId", customFilters.selectedBrandId);
        }

        if (customFilters.inStockOnly) {
          params.set("inStock", "true");
        }

        params.set(
          "minPrice",
          String(customFilters.minPrice)
        );

        params.set(
          "maxPrice",
          String(customFilters.maxPrice)
        );

        const response = await fetch(
          `/api/products?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (!data?.products) return;

        const transformedProducts = data.products.map(
          (product: any) => {
            const totalInventory =
              product.variants?.reduce(
                (sum: number, v: any) =>
                  sum + (v.inventory || 0),
                0
              ) || 0;

            const isAvailable =
              totalInventory > 0;

            return {
              ...product,
              totalInventory,
              isAvailable,
            };
          }
        );

        onProductsUpdate(
          transformedProducts,
          data.total || transformedProducts.length
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        onLoadingChange?.(false);
      }
    },
    [filters, onLoadingChange, onProductsUpdate]
  );

  // debounce search
  const handleSearchChange = (
    value: string
  ) => {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const updatedFilters = {
        ...filters,
        searchQuery: value,
      };

      setFilters(updatedFilters);

      fetchProducts(updatedFilters);
    }, 500);
  };

  // apply filters
  const applyFilters = () => {
    fetchProducts(filters);

    setIsModalOpen(false);
  };

  // clear filters
  const clearAllFilters = () => {
    const resetFilters = {
      searchQuery: "",
      selectedSort: "newest",
      selectedBrandId: "",
      inStockOnly: false,
      minPrice: MIN_PRICE,
      maxPrice: MAX_PRICE,
    };

    setSearchInput("");

    setFilters(resetFilters);

    fetchProducts(resetFilters);
  };

  useEffect(() => {
  if (!initialBrandSlug) {
    setFilters((prev) => ({
      ...prev,
      selectedBrandId: "",
    }));

    return;
  }

  const matchedBrand = brands.find(
    (b) => b.slug === initialBrandSlug
  );

  if (!matchedBrand) return;

  setFilters((prev) => ({
    ...prev,
    selectedBrandId: matchedBrand._id,
  }));
}, [initialBrandSlug, brands]);

  // auto fetch sort
useEffect(() => {
  if (!mounted) return;

  fetchProducts(filters);
}, [
  mounted,
  filters.searchQuery,
  filters.selectedSort,
  filters.selectedBrandId,
  filters.inStockOnly,
  filters.minPrice,
  filters.maxPrice,
]);

  if (!mounted) return null;

  return (
    <>
      {/* TOP BAR */}
      <div
        className={`flex flex-wrap items-center gap-3 ${className}`}
      >
        {/* SEARCH */}
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
              w-full
              pl-12 pr-10 py-3
              rounded-full
              border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900
              text-sm
              focus:outline-none
              focus:ring-2 focus:ring-amber-400/20
              focus:border-amber-400
              transition-all
            "
          />

          {searchInput && (
            <button
              onClick={() =>
                handleSearchChange("")
              }
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* FILTER BUTTON */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="
            relative
            flex items-center gap-2
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
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* SORT */}
        <div className="relative">
          <select
            value={filters.selectedSort}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                selectedSort: e.target.value,
              }));
            }}
            className="
              appearance-none
              px-4 py-3 pr-10
              rounded-full
              border border-gray-200 dark:border-slate-700
              bg-white dark:bg-slate-900
              text-sm
              cursor-pointer
              focus:outline-none
              focus:border-amber-400
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

      {/* MODAL */}
      <div
        className={`
          fixed inset-0 z-50
          transition-all duration-300
          ${isModalOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible"
          }
        `}
      >
        {/* Overlay */}
        <div
          onClick={() => setIsModalOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div
          className={`
            absolute left-1/2 top-1/2
            w-[95%] sm:w-[90%] md:w-[480px]
            max-h-[85vh]
            overflow-y-auto
            rounded-3xl
            bg-white dark:bg-slate-900
            border border-gray-200 dark:border-slate-800
            shadow-2xl
            transition-all duration-300
            -translate-x-1/2 -translate-y-1/2
            ${isModalOpen
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0"
            }
          `}
        >
          {/* HEADER */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-t-3xl">
            <div>
              <h2 className="text-xl font-bold">
                Filter Products
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Customize your shopping
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-5 space-y-7">
            {/* PRICE */}
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">
                  Price Range
                </h3>

                <span className="text-sm text-amber-500 font-medium">
                  ${filters.minPrice} - $
                  {filters.maxPrice}
                </span>
              </div>

              <div className="relative mb-6">
                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={filters.minPrice}
                  onChange={(e) => {
                    const value = Number(
                      e.target.value
                    );

                    setFilters((prev) => ({
                      ...prev,
                      minPrice: Math.min(
                        value,
                        prev.maxPrice - 10
                      ),
                    }));
                  }}
                  className="w-full accent-amber-500"
                />

                <input
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={filters.maxPrice}
                  onChange={(e) => {
                    const value = Number(
                      e.target.value
                    );

                    setFilters((prev) => ({
                      ...prev,
                      maxPrice: Math.max(
                        value,
                        prev.minPrice + 10
                      ),
                    }));
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="flex gap-3">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: Number(
                        e.target.value
                      ),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Min"
                />

                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxPrice: Number(
                        e.target.value
                      ),
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* BRANDS */}
            {brands.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Brands
                </h3>

                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand._id}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          selectedBrandId:
                            prev.selectedBrandId ===
                              brand._id
                              ? ""
                              : brand._id,
                        }))
                      }
                      className={`
                        px-4 py-2 rounded-full text-sm border transition-all
                        ${filters.selectedBrandId ===
                          brand._id
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                        }
                      `}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STOCK */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 cursor-pointer">
              <span className="font-medium">
                In Stock Only
              </span>

              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    inStockOnly:
                      e.target.checked,
                  }))
                }
                className="w-5 h-5 accent-amber-500"
              />
            </label>
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 flex gap-3 p-4 border-t border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-b-3xl">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700"
            >
              Clear All
            </button>

            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#191970] to-[#2563EB] text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}