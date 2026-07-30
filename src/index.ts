#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_BASE_URL = "https://apistatuscheck.com";

function getBaseUrl(): string {
  const raw = process.env.ASC_BASE_URL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_BASE_URL;
}

function buildUrl(pathname: string, params?: Record<string, string>): string {
  const url = new URL(pathname, getBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function fetchJson(pathname: string, params?: Record<string, string>): Promise<unknown> {
  const url = buildUrl(pathname, params);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }
  return response.json();
}

function asText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

interface ApiItem {
  category?: string | { name?: string; slug?: string; id?: string };
  categoryName?: string;
  category_name?: string;
  categoryTitle?: string;
  categorySlug?: string;
  category_slug?: string;
}

function normalizeApis(payload: unknown): ApiItem[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidate = record.data ?? record.apis ?? record.statuses ?? record.items;
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractCategories(items: ApiItem[]): { name: string; slug: string }[] {
  const seen = new Map<string, { name: string; slug: string }>();
  for (const item of items) {
    const { category } = item;
    if (typeof category === "string" && category.trim().length > 0) {
      const slug = slugify(category);
      if (slug && !seen.has(slug)) {
        seen.set(slug, { name: category, slug });
      }
      continue;
    }
    if (category && typeof category === "object") {
      const record = category as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : undefined;
      const slug =
        (typeof record.slug === "string" && record.slug) ||
        (typeof record.id === "string" && record.id) ||
        (name ? slugify(name) : "");
      if (name && slug && !seen.has(slug)) {
        seen.set(slug, { name, slug });
      }
      continue;
    }
    const nameCandidate =
      (typeof item.categoryName === "string" && item.categoryName) ||
      (typeof item.category_name === "string" && item.category_name) ||
      (typeof item.categoryTitle === "string" && item.categoryTitle);
    const slugCandidate =
      (typeof item.categorySlug === "string" && item.categorySlug) ||
      (typeof item.category_slug === "string" && item.category_slug) ||
      (nameCandidate ? slugify(nameCandidate as string) : "");
    if (nameCandidate && slugCandidate && !seen.has(slugCandidate)) {
      seen.set(slugCandidate, { name: nameCandidate as string, slug: slugCandidate });
    }
  }
  return Array.from(seen.values());
}

async function handleTool(fn: () => Promise<unknown>) {
  try {
    const data = await fn();
    return {
      content: [{ type: "text" as const, text: asText(data) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
}

// --- Server setup ---

const server = new McpServer({
  name: "apistatuscheck-mcp",
  version: "1.0.0",
});

server.tool(
  "check_status",
  {
    slug: z.string().min(1).describe("API slug, e.g. 'cloudflare', 'github', 'openai'."),
  },
  async ({ slug }) => handleTool(() => fetchJson("/api/status", { api: slug }))
);

server.tool("list_apis", {}, async () => handleTool(() => fetchJson("/api/status")));

server.tool("list_categories", {}, async () =>
  handleTool(async () => {
    const data = await fetchJson("/api/status");
    const apis = normalizeApis(data);
    const categories = extractCategories(apis);
    return { categories, total: categories.length };
  })
);

server.tool(
  "check_category",
  {
    slug: z.string().min(1).describe("Category slug, e.g. 'cloud', 'payments'."),
  },
  async ({ slug }) => handleTool(() => fetchJson("/api/status", { category: slug }))
);

server.tool(
  "check_url",
  {
    url: z.string().url().describe("Public URL to check."),
  },
  async ({ url }) => handleTool(() => fetchJson("/api/check", { url }))
);

const transport = new StdioServerTransport();
await server.connect(transport);
