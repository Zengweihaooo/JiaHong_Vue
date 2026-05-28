function isNodeFileUrl(url) {
  const protocol = url instanceof URL ? url.protocol : new URL(url, import.meta.url).protocol;
  return protocol === "file:" && typeof process !== "undefined" && Boolean(process.versions?.node);
}

async function readNodeFileJson(url) {
  const { readFile } = await import("node:fs/promises");
  const content = await readFile(url instanceof URL ? url : new URL(url, import.meta.url), "utf8");
  return JSON.parse(content);
}

export async function fetchJson(url, options = {}) {
  if (isNodeFileUrl(url)) {
    return readNodeFileJson(url);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
