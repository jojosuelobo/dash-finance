export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  username: string;
}

const USERS_KEY = "dash-finance-users";
const SESSION_KEY = "dash-finance-session";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getAllUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveAllUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByUsername(username: string): User | undefined {
  return getAllUsers().find((u) => u.username === username.toLowerCase().trim());
}

export function createUser(username: string, passwordHash: string): User {
  const user: User = {
    id: crypto.randomUUID(),
    username: username.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  const users = getAllUsers();
  saveAllUsers([...users, user]);
  return user;
}

export function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
