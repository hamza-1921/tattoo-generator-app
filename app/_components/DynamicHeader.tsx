"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";


export default function DynamicHeader() {
  const pathname = usePathname();


  const getTitle = () => {
    if (pathname === "/dashboard/Text-To-Tattoo" || pathname === "/") {
      return "Text to Tattoo Generator";
    } else if (pathname === "/dashboard/Tattoo-To-Text") {
      return "Tattoo to Text Converter";
    }
    return "Tattoo Symbol Generator";
  };

  return (
    <div className="relative mb-8 w-full text-center">
      <h1 className="text-3xl font-bold tracking-wide mb-2">
        {getTitle()}
      </h1>
      
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Link
          href="/dashboard/Text-To-Tattoo"
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === "/dashboard/Text-To-Tattoo" || pathname === "/"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Text → Tattoo
        </Link>
        
        <Link
          href="/dashboard/Tattoo-To-Text"
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === "/dashboard/Tattoo-To-Text"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Tattoo → Text
        </Link>
      </div>

      {/* Dark Mode Toggle */}
   

      <div className={`text-sm `}>
        {pathname === "/dashboard/Text-To-Tattoo" || pathname === "/" 
          ? "Convert text or audio to tattoo designs" 
          : "Convert tattoo designs to text and voice"}
      </div>
    </div>
  );
}