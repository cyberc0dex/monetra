/* Switch to "production" for localStorage, PWA installation and offline caching. */
window.MONETRA_CONFIG = Object.freeze({
  environment: "production",
  storageKey: "monetra-state-v1",
  schemaVersion: 1,
  availableIcons: [
    "laptop", "car", "gamepad-2", "dumbbell", "plane",
    "house", "utensils", "shopping-bag", "wrench", "package"
  ],
  accountTagColours: [
    "#2878D0", "#0E8A8A", "#2E8B57", "#6F7F26", "#B67820",
    "#C45A65", "#A257A8", "#715FC1", "#506D91", "#65717D"
  ],
  vehicleTypes: ["SUV", "Sedan", "Hatchback", "Coupe", "Van"],
  vehicleColours: ["White", "Black", "Silver", "Red", "Blue", "Grey"],
  defaultProfile: {
    displayName: "User",
    caption: "Small steps make a big difference.",
    accountTitle: "Main Account",
    vehicleName: "My Vehicle",
    vehicleType: "SUV",
    vehicleColour: "White"
  }
});
