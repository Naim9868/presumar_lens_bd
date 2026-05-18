"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface SubMenuItem {
  title: string;
  path: string;
  id?: number;
  newTab?: boolean;
}

interface MenuItem {
  id?: number;
  title: string;
  path?: string;
  submenu?: SubMenuItem[];
  newTab?: boolean;
}

interface DropdownProps {
  menuItem: MenuItem;
  stickyMenu: boolean;
  isMobile?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ menuItem, stickyMenu }: DropdownProps) => {
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const pathUrl = usePathname();
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownToggler(false);
      }
    }

    if (dropdownToggler) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownToggler]);

  return (
    <li
      ref={dropdownRef}
      className="group relative"
      onClick={() => setDropdownToggler(!dropdownToggler)}
    >
      <div
        className={`relative before:absolute before:left-0 before:top-0 before:h-[3px] before:w-0 before:rounded-b-[3px] before:bg-blue before:transition-all before:duration-200 before:ease-out hover:before:w-full ${
          pathUrl.includes(menuItem.title) ? "before:!w-full" : ""
        }`}
      >
        <a
          href="#"
          className={`flex cursor-pointer items-center gap-1.5 text-sm tracking-wider font-medium capitalize text-dark transition-colors duration-200 hover:text-blue ${
            stickyMenu ? "xl:py-4" : "xl:py-6"
          } ${pathUrl.includes(menuItem.title) ? "!text-blue" : ""}`}
        >
          {menuItem.title}
          <svg
            className="fill-current"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.95363 5.67461C3.13334 5.46495 3.44899 5.44067 3.65866 5.62038L7.99993 9.34147L12.3412 5.62038C12.5509 5.44067 12.8665 5.46495 13.0462 5.67461C13.2259 5.88428 13.2017 6.19993 12.992 6.37964L8.32532 10.3796C8.13808 10.5401 7.86178 10.5401 7.67453 10.3796L3.00787 6.37964C2.7982 6.19993 2.77392 5.88428 2.95363 5.67461Z"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>

      {/* Dropdown Menu */}
      <ul
        className={`absolute left-0 z-50 mt-2 hidden min-w-max flex-col gap-0 rounded-md border border-gray-3 bg-white py-2.5 shadow-2 transition-all duration-200 ease-in-out xl:invisible xl:translate-y-10 xl:opacity-0 xl:group-hover:visible xl:group-hover:translate-y-0 xl:group-hover:opacity-100 ${
          dropdownToggler ? "!flex" : ""
        } ${stickyMenu ? "xl:translate-y-0" : ""}`}
      >
        {menuItem.submenu?.map((item, i) => (
          <li key={i}>
            <Link
              href={item.path}
              className={`block px-4.5 py-[7px] text-sm tracking-wider transition-colors duration-200 hover:bg-gray-1 hover:text-blue ${
                pathUrl === item.path ? "bg-gray-1 text-blue" : ""
              }`}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
};

export default Dropdown;