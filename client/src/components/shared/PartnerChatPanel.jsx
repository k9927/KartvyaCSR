import React, { useMemo, useState } from "react";
import { MessageCircle, Search, Eye } from "lucide-react";

const getInitials = (value, fallback = "NG") => {
  if (!value) return fallback;
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "");
  const initials = parts.join("");
  return initials || fallback;
};

const defaultEmptyState = {
  title: "No chat-ready partnerships",
  description: "Accept a CSR partnership to start collaborating in real time.",
};

const PartnerChatPanel = ({
  title = "Partner Chat",
  subtitle = "Stay in sync with your partners and keep every project on track.",
  items = [],
  onOpenChat,
  onViewDetails,
  emptyState = defaultEmptyState,
  searchPlaceholder = "Search NGO or project",
  primaryActionLabel = "Open Chat",
  secondaryActionLabel = "View details",
}) => {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.partnerName || ""} ${item.projectName || ""} ${item.location || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
          <h2 className="text-2xl font-semibold text-slate-800">{subtitle}</h2>
          <p className="text-sm text-slate-500">
            {items.length} active partnership{items.length === 1 ? "" : "s"} ready for chat
          </p>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full max-w-md">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-slate-500 bg-slate-50/60">
          <p className="font-semibold">{emptyState.title}</p>
          <p className="text-sm text-slate-400 mt-2">{emptyState.description}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-slate-100 rounded-2xl bg-white/90 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 font-semibold grid place-items-center">
                  {getInitials(item.partnerName || item.projectName)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {item.partnerName || "Partner"}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-800">{item.projectName}</h3>
                  <p className="text-sm text-slate-500">{item.location || "Location TBA"}</p>
                  <div className="text-xs text-slate-400 mt-2 space-x-3">
                    {item.fundsDisplay && <span>Budget {item.fundsDisplay}</span>}
                    <span>Progress {Math.round(item.progress ?? 0)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {onOpenChat && (
                  <button
                    onClick={() => onOpenChat(item)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-500"
                  >
                    <MessageCircle size={16} />
                    {primaryActionLabel}
                  </button>
                )}
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(item)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-medium hover:bg-slate-200 flex items-center gap-2"
                  >
                    <Eye size={16} />
                    {secondaryActionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerChatPanel;



