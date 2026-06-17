import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import {
  AppNotification,
  fetchNotifications,
  markNotificationRead,
  subscribeCashoutCreated,
  subscribeNotifications,
} from "../../services/wsNotifications";

type CashoutCreatedNotification = {
  id: string;
  createdAt: string;
  cashoutId: number;
  driverId?: number;
  amount?: string;
  paymentType?: string;
  status?: string;
};

type UiNotification =
  | { kind: "cashout"; unread: boolean; createdAt: string; id: string; to: string; title: string; subtitle: string }
  | { kind: "notification"; unread: boolean; createdAt: string; id: string; to: string; title: string; subtitle: string; rawId: number };

function toUi(n: AppNotification): UiNotification | null {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const supportRoomId = Number((data.support_room_id as any) ?? (data.supportRoomId as any));
  const relatedType = String(n.relatedObjectType ?? "");
  const relatedId = Number(n.relatedObjectId as any);

  const roomId =
    Number.isFinite(supportRoomId) && supportRoomId > 0
      ? supportRoomId
      : relatedType === "support_room" && Number.isFinite(relatedId)
      ? relatedId
      : NaN;

  const to = Number.isFinite(roomId) ? `/chat/support/rooms/${roomId}` : "/";
  const title = n.title || "New support message";
  const subtitle = n.message || "Open support room";
  const createdAt = n.createdAt || new Date().toISOString();
  const unread = String(n.status || "").toLowerCase() === "unread";
  if (!Number.isFinite(n.id)) return null;
  return {
    kind: "notification",
    unread,
    createdAt,
    id: `n-${n.id}`,
    rawId: n.id,
    to,
    title,
    subtitle,
  };
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [cashouts, setCashouts] = useState<CashoutCreatedNotification[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [seen, setSeen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setSeen(true);
  };

  useEffect(() => {
    return subscribeCashoutCreated((n) => {
      const item: CashoutCreatedNotification = {
        id: `${n.cashoutId}-${n.createdAt}`,
        createdAt: n.createdAt,
        cashoutId: n.cashoutId,
        driverId: n.driverId,
        amount: n.amount,
        paymentType: n.paymentType,
        status: n.status,
      };
      setCashouts((prev) => [item, ...prev].slice(0, 20));
    });
  }, []);

  useEffect(() => {
    // offline unread on start
    void (async () => {
      try {
        const arr = await fetchNotifications({ status: "unread", page_size: 50 });
        setNotifs(arr ?? []);
      } catch {
        // ignore
      }
    })();

    return subscribeNotifications((n) => {
      setNotifs((prev) => {
        const next = [n, ...prev].filter(Boolean);
        const dedup = new Map<number, AppNotification>();
        for (const x of next) dedup.set(x.id, x);
        return Array.from(dedup.values()).slice(0, 50);
      });
      setSeen(false);
    });
  }, []);

  const uiItems = useMemo<UiNotification[]>(() => {
    const a: UiNotification[] = [];
    for (const c of cashouts) {
      a.push({
        kind: "cashout",
        unread: !seen,
        createdAt: c.createdAt,
        id: `c-${c.id}`,
        to: `/withdrawal/cash-outs/${c.cashoutId}`,
        title: "Cash out created",
        subtitle: c.amount ? `${c.amount}` : `#${c.cashoutId}`,
      });
    }
    for (const n of notifs) {
      const ui = toUi(n);
      if (ui) a.push(ui);
    }
    a.sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt));
    return a.slice(0, 30);
  }, [cashouts, notifs, seen]);

  const unreadCount = useMemo(() => {
    const unreadNotifs = notifs.filter((n) => String(n.status || "").toLowerCase() === "unread").length;
    const unreadCashouts = cashouts.length && !seen ? cashouts.length : 0;
    return unreadNotifs + unreadCashouts;
  }, [notifs, cashouts.length, seen]);

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {!uiItems.length && (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No notifications.
            </li>
          )}
          {uiItems.map((it) => (
            <li key={it.id}>
              <DropdownItem
                tag="a"
                to={it.to}
                onItemClick={() => {
                  closeDropdown();
                  if (it.kind === "notification") {
                    void markNotificationRead(it.rawId).catch(() => void 0);
                    setNotifs((prev) =>
                      prev.map((x) => (x.id === it.rawId ? { ...x, status: "read" } : x))
                    );
                  } else {
                    setSeen(true);
                  }
                }}
                className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-white/5 dark:text-brand-400">
                  {it.kind === "cashout" ? "$" : "C"}
                </span>

                <span className="block">
                  <span className="mb-1.5 block text-theme-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white/90">
                      {it.title}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">{it.subtitle}</span>
                  </span>

                  <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                    {it.unread ? <span className="font-medium text-orange-600 dark:text-orange-400">unread</span> : <span> </span>}
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{new Date(it.createdAt).toLocaleString()}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
        <Link
          to="/chat/support/rooms"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Open support rooms
        </Link>
      </Dropdown>
    </div>
  );
}
