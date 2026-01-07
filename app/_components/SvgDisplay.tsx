"use client";

import { useState } from "react";
import { Copy, Download, Image as ImageIcon, Check } from "lucide-react"; // ✅ Renamed

interface Props {
  svg: string;

}

export default function SvgDisplay({ svg }: Props) {
  const [copied, setCopied] = useState(false);

  const copySVG = async () => {
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = svg;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadSVG = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tattoo-symbol.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image(); // ✅ Use window.Image
    
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "tattoo-symbol.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  return (
    <div
      className={`flex-1 rounded-xl p-3 overflow-hidden flex flex-col transition-colors duration-500
        "bg-gray-700" }
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Generated Tattoo Symbol</h3>
        <div className="flex gap-2">
          {/* Copy SVG Button */}
          <button
            onClick={copySVG}
            className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2
              
                 "bg-gray-600 hover:bg-gray-500 text-gray-100" 
               
              }
            `}
            title="Copy SVG code"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
            <span className="text-sm hidden sm:inline">
              {copied ? "Copied!" : "Copy SVG"}
            </span>
          </button>

          {/* Download SVG Button */}
          <button
            onClick={downloadSVG}
            className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2
              "bg-gray-600 hover:bg-gray-500 text-gray-100" 
                
              }
            `}
            title="Download SVG file"
          >
            <Download size={16} />
            <span className="text-sm hidden sm:inline">SVG</span>
          </button>

          {/* Download PNG Button */}
          
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full max-h-full max-w-full overflow-hidden">
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
      
      {/* Quick action buttons at bottom */}
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={copySVG}
          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium
      
              "bg-purple-600 hover:bg-purple-700 text-white" 
             
            }
          `}
        >
          {copied ? (
            <>
              <Check size={16} />
              SVG Copied!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy Tattoo Design
            </>
          )}
        </button>
      </div>
    </div>
  );
}