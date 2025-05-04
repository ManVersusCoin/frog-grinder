"use client";
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xc379e535caff250a01caa6c3724ed1359fe5c29b";
const ABI = ["function tokenURI(uint256 tokenId) view returns (string)"];

// Exclude Type from regular trait list
const TRAIT_ORDER = [
  "Background", "Skin", "Tattoo", "Mouth", "Eyes", "Apparel", "Headwear",
  "Weapon", "Hands", "Shield"
];

const CUSTOM_OVERLAYS: Record<string, { name: string; filename: string; tooltip: string }[]> = {
  Apparel: [
    { name: "Chef", filename: "grind-chef.png", tooltip: "Chef" },
    { name: "Hoodie Up", filename: "grind-hoodie-up.png", tooltip: "Hoodie Up" },
    { name: "Grind suit", filename: "suit-1.png", tooltip: "Grind Suit" }
  ],
  Headwear: [
    { name: "Cap", filename: "cap.png", tooltip: "Cap" },
    { name: "Cap", filename: "cap-grind.png", tooltip: "Cap 2" },
  ],
  
  Background: [
    { name: "Grind", filename: "background-grind.png", tooltip: "Grind" },
    
  ],
  Eyes: [
    { name: "Grind", filename: "grind-mask.png", tooltip: "Hamster mask" },
    
  ],
};

function ipfsToHttp(ipfsUrl: string): string {
  return ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
}

function getTraitImageUrl(
  traitType: string,
  value: string,
  attributes: { trait_type: string; value: string }[]
): string {
  const typeAttr = attributes.find(a => a.trait_type.toLowerCase() === "type");
  const type = typeAttr ? typeAttr.value.toLowerCase() : "army";
  const traitFolder = traitType.toLowerCase();
  const file = value.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
  return `https://upgrade.plaguebrands.io/traits/${type}/${traitFolder}/${file}.png`;
}

function getCustomOverlayUrl(type: string, traitType: string, filename: string): string {
  return `/${type}/${traitType.toLowerCase()}/${filename}`;
}

const InputField: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
}> = ({ value, onChange, placeholder, disabled }) => (
  <input
    type="number"
    min="0"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    disabled={disabled}
  />
);

const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}> = ({ onClick, children, className, disabled }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md transition-colors duration-200 ${className}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const TraitSelector: React.FC<{
  traitType: string;
  selectedTraits: Record<string, string>;
  originalTraits: { trait_type: string; value: string }[];
  handleTraitChange: (traitType: string, value: string) => void;
  customOverlays: Record<string, string | null>;
  handleOverlaySelect: (traitType: string, filename: string | null) => void;
  getTokenType: () => string;
  resetTrait: (traitType: string) => void;
}> = ({
  traitType,
  selectedTraits,
  originalTraits,
  handleTraitChange,
  customOverlays,
  handleOverlaySelect,
  getTokenType,
  resetTrait,
}) => {
  const hasCustomOverlays = (CUSTOM_OVERLAYS[traitType] ?? []).length > 0;
  const originalTrait = originalTraits.find(t => t.trait_type === traitType)?.value || "None";
  const currentValue = selectedTraits[traitType] ?? originalTrait;
  const isModified = selectedTraits[traitType] !== undefined && selectedTraits[traitType] !== originalTrait;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="w-32 text-sm font-medium text-gray-700">{traitType}</div>
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-md ${
              isModified ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            {currentValue}
          </div>
          {currentValue !== "None" && (
            <button
              onClick={() => handleTraitChange(traitType, "None")}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove trait"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {isModified && originalTrait !== "None" && (
            <button
              onClick={() => resetTrait(traitType)}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="Reset to original trait"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        {hasCustomOverlays && (
          <div className="flex items-center gap-1">
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            {CUSTOM_OVERLAYS[traitType].map(overlay => (
              <button
                key={overlay.filename}
                onClick={() => {
                  if (customOverlays[traitType] === overlay.filename) {
                    handleOverlaySelect(traitType, null);
                  } else {
                    handleOverlaySelect(traitType, overlay.filename);
                  }
                }}
                className={`w-8 h-8 p-1 border-2 rounded-md transition-all ${
                  customOverlays[traitType] === overlay.filename ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                title={overlay.tooltip}
              >
                <img
                  src={getCustomOverlayUrl(getTokenType(), traitType, overlay.filename)}
                  alt={overlay.name}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TypeDisplay: React.FC<{ type: string }> = ({ type }) => (
  <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
    <span className="mr-1">Type:</span> {type}
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span>{message}</span>
  </div>
);

const Canvas: React.FC<{ canvasRef: React.RefObject<HTMLCanvasElement | null> }> = ({ canvasRef }) => (
  <canvas ref={canvasRef} width={500} height={500} className="border rounded-lg shadow-lg bg-white" />
);

export default function PlaguePage() {
  const [tokenId, setTokenId] = useState("");
  const [traits, setTraits] = useState<{ trait_type: string; value: string }[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});
  const [customOverlays, setCustomOverlays] = useState<Record<string, string | null>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [tokenType, setTokenType] = useState<string | null>(null);

  async function composeImage(
    attributes: { trait_type: string; value: string }[],
    overlays: Record<string, string | null>
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const typeAttr = attributes.find(a => a.trait_type.toLowerCase() === "type");
    const type = typeAttr ? typeAttr.value.toLowerCase() : "army";

    const skinAttr = attributes.find(a => a.trait_type.toLowerCase() === "skin");

    const ordered = TRAIT_ORDER.map(traitType =>
      attributes.find(a => a.trait_type === traitType) ?? { trait_type: traitType, value: "None" }
    );

    for (const trait of ordered) {
      // Skip rendering images for the Type trait
      if (trait.trait_type !== "Type") {
        const value = selectedTraits[trait.trait_type] ?? trait.value;
        if (value !== "None") {
          const src = getTraitImageUrl(trait.trait_type, value, attributes);
          await loadAndDrawImage(ctx, src, canvas.width, canvas.height);
        }

        // Check for custom overlays
        if (overlays[trait.trait_type] && overlays[trait.trait_type] !== "none") {
          const src = getCustomOverlayUrl(type, trait.trait_type, overlays[trait.trait_type]!);
          await loadAndDrawImage(ctx, src, canvas.width, canvas.height);
        }

        // Specific case: if the Mouth trait contains "cigar"
        if (trait.trait_type === "Mouth" && value.toLowerCase().includes("cigar")) {
          const file = value.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
          const additionalSrc = `https://upgrade.plaguebrands.io/traits/${type}/additional/${file}.png`;
          await loadAndDrawImage(ctx, additionalSrc, canvas.width, canvas.height);
        }

        if (trait.trait_type === "Hands") {
          const hand = value.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
          const file = skinAttr ? skinAttr.value.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "") : "none";
          const additionalSrc = `https://upgrade.plaguebrands.io/traits/${type}/hands/${hand}/${file}.png`;
          await loadAndDrawImage(ctx, additionalSrc, canvas.width, canvas.height);
        }

      }
    }
  }

  async function loadAndDrawImage(ctx: CanvasRenderingContext2D, url: string, w: number, h: number) {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        resolve();
      };
      img.onerror = (e) => {
        console.debug(`Failed to load image: ${url}`);
        resolve(); // Continue without crashing
      };
      img.src = url;
    });
  }

  async function handleFetch(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSelectedTraits({});
    setCustomOverlays({});
    setTokenName(null);
    setTokenType(null);
    setTraits([]);
  
    try {
      const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
      let metadata: any;
  
      // Try fetching from Alchemy first
      try {
        const alchemyRes = await fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}/getNFTMetadata?contractAddress=${CONTRACT_ADDRESS}&tokenId=${tokenId}&refreshCache=false`);
        const alchemyJson = await alchemyRes.json();
  
        if (alchemyJson?.raw?.metadata) {
          metadata = alchemyJson.raw.metadata;
        } else {
          throw new Error("Failed to fetch metadata from Alchemy.");
        }
  
        if (alchemyJson?.name) setTokenName(alchemyJson.name);
      } catch (alchemyErr) {
        console.warn("Fallback to IPFS due to Alchemy error:", alchemyErr);
  
        try {
          const uri: string = await contract.tokenURI(tokenId);
          const json = await fetch(ipfsToHttp(uri)).then(res => res.json());
          metadata = json;
        } catch (contractErr) {
          console.error("Failed to fetch metadata from IPFS:", contractErr);
          throw new Error("Failed to fetch metadata from both Alchemy and IPFS.");
        }
      }
  
      setTraits(metadata.attributes || []);
      if (metadata.name) setTokenName(metadata.name);
  
      // Set token type
      const typeAttr = metadata.attributes?.find((a: { trait_type: string; value: string }) => a.trait_type === "Type");
      if (typeAttr) {
        setTokenType(typeAttr.value);
      }
  
      await composeImage(metadata.attributes || [], {});
    } catch (err: any) {
      setError(err.message || "Failed to fetch or render data.");
    }
  
    setLoading(false);
  }

  useEffect(() => {
    if (traits.length > 0) {
      composeImage(traits, customOverlays);
    }
  }, [traits, selectedTraits, customOverlays]);

  const getTokenType = () =>
    traits.find(t => t.trait_type.toLowerCase() === "type")?.value.toLowerCase() || "army";

  const handleOverlaySelect = (traitType: string, filename: string | null) => {
    setCustomOverlays(prev => ({ ...prev, [traitType]: filename }));
  };

  const handleTraitChange = (traitType: string, value: string) => {
    setSelectedTraits(prev => ({ ...prev, [traitType]: value }));
    // Clear overlay when trait is changed
    setCustomOverlays(prev => ({ ...prev, [traitType]: null }));
  };

  const resetTrait = (traitType: string) => {
    setSelectedTraits(prev => {
      const newTraits = { ...prev };
      delete newTraits[traitType];
      return newTraits;
    });
    setCustomOverlays(prev => ({ ...prev, [traitType]: null }));
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `${tokenName || "plague-nft"}.png`;
    a.click();
  };

  const handleCopy = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      // @ts-ignore
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Plague NFT Customizer</h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleFetch} className="flex gap-3 items-center">
                <InputField
                  value={tokenId}
                  onChange={e => setTokenId(e.target.value)}
                  placeholder="Enter Token ID"
                  disabled={loading}
                />
                <Button
                  onClick={() => {
                    handleFetch({ preventDefault: () => {} } as FormEvent);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : "View NFT"}
                </Button>
              </form>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          {tokenName && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">{tokenName}</h2>
                {tokenType && <TypeDisplay type={tokenType} />}
              </div>
              <div className="divide-y divide-gray-100">
                {TRAIT_ORDER.map((traitType) => (
                  <div key={traitType} className="px-5">
                    <TraitSelector
                      traitType={traitType}
                      selectedTraits={selectedTraits}
                      originalTraits={traits}
                      handleTraitChange={handleTraitChange}
                      customOverlays={customOverlays}
                      handleOverlaySelect={handleOverlaySelect}
                      getTokenType={getTokenType}
                      resetTrait={resetTrait}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-[520px] flex flex-col items-center gap-6">
          <div className="bg-white p-5 rounded-lg shadow-md w-full">
            <Canvas canvasRef={canvasRef} />
          </div>
          
          {tokenName && (
            <div className="flex gap-4 w-full">
              <Button
                onClick={handleCopy}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy to clipboard
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PNG
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}