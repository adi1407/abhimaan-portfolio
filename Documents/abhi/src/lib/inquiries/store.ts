import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Inquiry, InquiryInput } from "@/lib/inquiries/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "inquiries.json");

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readAll(): Promise<Inquiry[]> {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Inquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Inquiry[]) {
  await ensureStore();
  await writeFile(DATA_FILE, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function clean(value: unknown, max = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export async function listInquiries() {
  const items = await readAll();
  return items.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export async function createInquiry(input: InquiryInput): Promise<Inquiry> {
  const items = await readAll();
  const inquiry: Inquiry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: clean(input.name, 120),
    email: clean(input.email, 180),
    phone: clean(input.phone, 40),
    service: input.service,
    deliverable: clean(input.deliverable, 160),
    deadline: clean(input.deadline, 80),
    budget: clean(input.budget, 80),
    message: clean(input.message, 4000),
    read: false,
  };
  items.push(inquiry);
  await writeAll(items);
  return inquiry;
}

export async function markInquiryRead(id: string, read = true) {
  const items = await readAll();
  const next = items.map((item) =>
    item.id === id ? { ...item, read } : item,
  );
  await writeAll(next);
  return next.find((item) => item.id === id) ?? null;
}

export async function deleteInquiry(id: string) {
  const items = await readAll();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  await writeAll(next);
  return true;
}
