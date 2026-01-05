// app/api/tatoo-to-text/route.ts
import { NextRequest, NextResponse } from "next/server";
import CryptoJS from 'crypto-js';

// TEXT ENCODING FUNCTIONS
function encodeTextInSVG(text: string, password?: string): { visible: string, hidden: string } {
  // Encrypt if password provided
  let encodedText = text;
  if (password) {
    encodedText = CryptoJS.AES.encrypt(text, password).toString();
  } else {
    // Convert to base64
    encodedText = Buffer.from(text).toString('base64');
  }
  
  let visiblePattern = '';
  let hiddenData = '';
  
  // ENCODING METHOD 1: Hidden in comments (most reliable)
  hiddenData += `<!-- ENCODED-TEXT:${encodedText} -->\n`;
  
  // ENCODING METHOD 2: Hidden data attribute
  hiddenData += `<g style="display:none" data-encoded="${encodedText.replace(/"/g, '&quot;')}"></g>\n`;
  
  // ENCODING METHOD 3: Pattern dots (visible but subtle)
  for (let i = 0; i < Math.min(encodedText.length, 50); i++) {
    const charCode = encodedText.charCodeAt(i);
    const x = 239.5; // Almost at right edge
    const y = 0.5 + (i * 4); // Tiny spacing
    const size = 0.1 + ((charCode % 10) * 0.02);
    
    visiblePattern += `
      <circle cx="${x}" cy="${y}" r="${size}" 
              fill="#010101" opacity="0.05"
              data-c="${charCode}" data-i="${i}"/>
    `;
  }
  
  return { visible: visiblePattern, hidden: hiddenData };
}

function decodeTextFromSVG(svgContent: string, password?: string): string | null {
  console.log('Extracting text from SVG...');
  
  // METHOD 1: Extract from comment <!-- ENCODED-TEXT:... -->
  const commentMatch = svgContent.match(/<!-- ENCODED-TEXT:([A-Za-z0-9+/=]+) -->/);
  if (commentMatch) {
    console.log('Found in comment');
    return decodeText(commentMatch[1], password);
  }
  
  // METHOD 2: Extract from data-encoded attribute
  const dataMatch = svgContent.match(/data-encoded="([^"]+)"/);
  if (dataMatch) {
    console.log('Found in data attribute');
    return decodeText(dataMatch[1], password);
  }
  
  // METHOD 3: Extract from circle pattern
  const circles = [];
  const circleRegex = /data-c="(\d+)"/g;
  let match;
  
  while ((match = circleRegex.exec(svgContent)) !== null) {
    // Get the corresponding index
    const start = match.index;
    const indexMatch = svgContent.substring(start).match(/data-i="(\d+)"/);
    if (indexMatch) {
      circles.push({
        charCode: parseInt(match[1]),
        index: parseInt(indexMatch[1])
      });
    }
  }
  
  if (circles.length > 0) {
    console.log(`Found ${circles.length} pattern circles`);
    circles.sort((a, b) => a.index - b.index);
    const encoded = circles.map(c => String.fromCharCode(c.charCode)).join('');
    return decodeText(encoded, password);
  }
  
  console.log('No encoded text found');
  return null;
}

function decodeText(encoded: string, password?: string): string {
  try {
    if (password) {
      // Try AES decryption
      const bytes = CryptoJS.AES.decrypt(encoded, password);
      return bytes.toString(CryptoJS.enc.Utf8);
    } else {
      // Try base64 decode
      return Buffer.from(encoded, 'base64').toString('utf8');
    }
  } catch (error) {
    console.error('Decode error:', error);
    return encoded; // Return raw if decode fails
  }
}

// YOUR ORIGINAL TATTOO GENERATOR
function createRand(seed: number) {
  return function rand() {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

// TATTOO GENERATION FUNCTIONS
function tribal(r: (min: number, max: number) => number) {
  let out = "";
  const count = 10 + Math.floor(r(5, 15));
  for (let i = 0; i < count; i++) {
    out += `
      <path d="M${r(20,220)} ${r(20,220)}
               C${r(20,220)} ${r(20,220)},
                ${r(20,220)} ${r(20,220)},
                ${r(20,220)} ${r(20,220)}"
        stroke="black" stroke-width="${r(4,10)}" fill="none"/>
    `;
  }
  return out;
}

function geometric(r: (min: number, max: number) => number) {
  let out = "";
  const count = 8 + Math.floor(r(3, 10));
  for (let i = 0; i < count; i++) {
    out += `
      <polygon
        points="${r(30,210)},${r(30,210)}
                ${r(30,210)},${r(30,210)}
                ${r(30,210)},${r(30,210)}"
        stroke="black" fill="none" stroke-width="${r(2,6)}"
      />
    `;
  }
  return out;
}

function minimalist(r: (min: number, max: number) => number) {
  return `
    <line x1="${r(20,220)}" y1="${r(20,220)}"
          x2="${r(20,220)}" y2="${r(20,220)}"
          stroke="black" stroke-width="2"/>
  `;
}

function dotwork(r: (min: number, max: number) => number) {
  let out = "";
  const count = 150 + Math.floor(r(100, 200));
  for (let i = 0; i < count; i++) {
    out += `<circle cx="${r(20,220)}" cy="${r(20,220)}" r="${r(0.5,2)}" fill="black" />`;
  }
  return out;
}

function blackwork(r: (min: number, max: number) => number) {
  let out = "";
  const count = 12 + Math.floor(r(5,10));
  for (let i = 0; i < count; i++) {
    out += `
      <rect x="${r(10,200)}" y="${r(10,200)}"
            width="${r(20,80)}" height="${r(20,80)}"
            fill="black" transform="rotate(${r(0,360)} 120 120)" />
    `;
  }
  return out;
}

function chaos(r: (min: number, max: number) => number) {
  return ultraChaosGenerator(r);
}

function ultraChaosGenerator(r: (min: number, max: number) => number) {
  let output = "";
  const pathCount = 20 + Math.floor(r(10, 40));

  function noisePath(cx: number, cy: number) {
    let p = `M${cx} ${cy}`;
    const steps = 5 + Math.floor(r(10, 25));
    for (let i = 0; i < steps; i++) {
      const dx = r(-50, 50);
      const dy = r(-50, 50);
      p += ` Q${cx + dx * 0.3} ${cy + dy * 0.3}, ${cx + dx} ${cy + dy}`;
      cx += dx;
      cy += dy;
    }
    return p;
  }

  function jaggedPath() {
    let d = `M${r(0,240)} ${r(0,240)}`;
    const segments = 3 + Math.floor(r(3,10));
    for (let i = 0; i < segments; i++) {
      d += ` L${r(0,240)} ${r(0,240)}`;
    }
    return d;
  }

  for (let i = 0; i < pathCount; i++) {
    const which = Math.floor(r(0, 3));
    const d = which === 0 ? noisePath(r(0,240), r(0,240)) : jaggedPath();

    output += `
      <path d="${d}"
            stroke="black"
            stroke-width="${r(1,6)}"
            fill="none"
            opacity="${r(0.3,1)}"
            transform="rotate(${r(0,360)} 120 120)"
      />
    `;
  }

  return output;
}

// DECODE ENDPOINT ONLY (since you have separate generator)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No file uploaded",
          confidence: 0,
          exactMatch: false 
        },
        { status: 400 }
      );
    }
    
    const svgContent = await file.text();
    console.log(`SVG length: ${svgContent.length} chars`);
    
    // Check if this SVG contains encoded text
    const hasEncodedData = svgContent.includes('ENCODED-TEXT:') || 
                          svgContent.includes('data-encoded=') ||
                          svgContent.includes('data-c="');
    
    if (!hasEncodedData) {
      return NextResponse.json({
        success: false,
        error: "This SVG doesn't contain encoded text",
        note: "You must generate tattoos with the text-embedding version",
        confidence: 0,
        exactMatch: false
      });
    }
    
    // Extract text
    const extractedText = decodeTextFromSVG(svgContent, password);
    
    if (extractedText && extractedText.length > 0) {
      return NextResponse.json({
        success: true,
        text: extractedText,
        confidence: 100,
        exactMatch: true,
        extractedAt: new Date().toISOString(),
        note: password ? "Text decrypted successfully" : "Text extracted successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Could not decode text",
        possibleReasons: [
          "Wrong password (if encrypted)",
          "File corrupted or modified",
          "SVG was not generated with text embedding"
        ],
        confidence: 0,
        exactMatch: false
      });
    }

  } catch (error) {
    console.error('Decoding error:', error);
    return NextResponse.json({
      success: false,
      error: "Decoding failed",
      confidence: 0,
      exactMatch: false
    }, { status: 500 });
  }
}

// GET endpoint for info
export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: "Tattoo to Text Converter",
    endpoint: "/api/tatoo-to-text",
    description: "Extracts encoded text from tattoo SVGs",
    usage: "POST with file upload (SVG) and optional password",
    requirements: [
      "SVG must be generated with text embedding",
      "File must be SVG format (not PNG/JPG)",
      "Password required if tattoo was encrypted"
    ],
    note: "This only works with tattoos generated by the updated text-embedding generator"
  });
}