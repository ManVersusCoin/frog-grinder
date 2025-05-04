// You can expand this config as you add overlays
export const CUSTOM_OVERLAYS: {
    [traitType: string]: { // e.g. "Apparel"
      [value: string]: Array<{ filename: string; tooltip: string }>
    }
  } = {
    Headwear: {
      grind: [
        //{ filename: "grind-1.png", tooltip: "Grind Level 1" },
        //{ filename: "grind-2.png", tooltip: "Grind Level 2" },
        // ...up to grind-9.png
      ],
      // You can add more custom options here
    },
    Apparel: {
        grind: [
          { filename: "grind-hoodie-up.png", tooltip: "Hoodie Up" },
          { filename: "grind-chef.png", tooltip: "Chef" },
          // ...up to grind-9.png
        ],
        // You can add more custom options here
      },
    // Add other traitTypes...
  };