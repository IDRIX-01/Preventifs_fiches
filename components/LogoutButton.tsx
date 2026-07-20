"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
    >
      Déconnexion
    </button>
  );
}
