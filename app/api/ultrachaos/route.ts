// app/api/generate-tattoo/route.ts
import { NextRequest, NextResponse } from "next/server";
import CryptoJS from 'crypto-js';

// TEXT ENCODING FUNCTION (MUST MATCH THE DECODER)
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

function createRand(seed: number) {
  return function rand() {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text, style, password } = (await req.json()) as {
      text: string;
      style: string;
      password?: string; // Optional encryption password
    };

    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Create seed from text
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) % 999999;
    }
    const rand = createRand(seed);
    const r = (min: number, max: number) => min + rand() * (max - min);

    // TATTOO GENERATOR FUNCTIONS (unchanged from your code)
    function tribal() {
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

    function geometric() {
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

    function minimalist() {
      return `
        <line x1="${r(20,220)}" y1="${r(20,220)}"
              x2="${r(20,220)}" y2="${r(20,220)}"
              stroke="black" stroke-width="2"/>
      `;
    }

    function dotwork() {
      let out = "";
      const count = 150 + Math.floor(r(100, 200));
      for (let i = 0; i < count; i++) {
        out += `<circle cx="${r(20,220)}" cy="${r(20,220)}" r="${r(0.5,2)}" fill="black" />`;
      }
      return out;
    }

    function blackwork() {
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

    function chaos() {
      return ultraChaosGenerator();
    }

    function ultraChaosGenerator() {
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

        const d =
          which === 0
            ? noisePath(r(0,240), r(0,240))
            : jaggedPath();

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

    // STYLE MAPPING
    const generators: Record<string, () => string> = {
      tribal,
      geometric,
      minimalist,
      dotwork,
      blackwork,
      mandala: geometric,
      script: minimalist,
      biomech: geometric,
      chaos,
      "ultra-chaos": ultraChaosGenerator,
      ultrachaos: ultraChaosGenerator
    };

    // Generate tattoo shapes
    const generator = generators[style] || ultraChaosGenerator;
    const svgContent = generator();

    // ENCODE THE TEXT INTO THE SVG
    const encoded = encodeTextInSVG(text, password);

    // Create final SVG with embedded text
    const svg = `
      <svg width="240" height="240" viewBox="0 0 240 240"
           xmlns="http://www.w3.org/2000/svg">
        ${svgContent}
        <!-- EMBEDDED TEXT (HIDDEN) -->
        ${encoded.visible}
        ${encoded.hidden}
      </svg>
    `;

    return NextResponse.json({ 
      svg,
      info: {
        textLength: text.length,
        encrypted: !!password,
        style: style,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: "Failed to generate tattoo" },
      { status: 500 }
    );
  }
}