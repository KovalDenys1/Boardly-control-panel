"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function FeedbackSearch({ total, filteredTotal }: { total: number; filteredTotal: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const isFiltered = !!q;

  const [searchInput, setSearchInput] = useState(q);
  const prevQ = useRef(q);
  useEffect(() => {
    if (q !== prevQ.current) {
      setSearchInput(q);
      prevQ.current = q;
    }
  }, [q]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    params.set("page", "1");
    router.push(`/feedback?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", marginBottom: 12 }}>
      <div className="bk-search-bar" style={{ flex: 1 }}>
        <span className="bk-search-prompt">$</span>
        <input
          type="text"
          className="bk-search-input"
          placeholder="search message or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {isFiltered && (
          <span className="bk-search-count">{filteredTotal} / {total}</span>
        )}
      </div>
    </form>
  );
}
