const assetModules = import.meta.glob("../../assets/**/*", {
  eager: true,
  query: "?url",
  import: "default"
});

export function assetUrl(path) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return assetModules[`../../${normalizedPath}`] || `${import.meta.env.BASE_URL}${normalizedPath}`;
}
