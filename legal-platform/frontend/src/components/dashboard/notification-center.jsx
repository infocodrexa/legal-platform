// "use client";

// import Link from "next/link";
// import { useEffect, useRef, useState } from "react";
// import { Bell, CheckCheck, Loader2 } from "lucide-react";
// import { notificationApi } from "@/lib/api";

// function friendlyError(error) {
//   return error?.response?.data?.message || "Notifications could not be loaded. Please try again.";
// }

// export function NotificationCenter() {
//   const [open, setOpen] = useState(false);
//   const [items, setItems] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const rootRef = useRef(null);

//   async function load({ quiet = false } = {}) {
//     if (!quiet) setLoading(true);
//     setError("");
//     try {
//       const { data } = await notificationApi.mine({ page: 1, limit: 12 });
//       setItems(data.data || []);
//       setUnreadCount(data.meta?.unreadCount || 0);
//     } catch (err) {
//       if (!quiet) setError(friendlyError(err));
//     } finally {
//       if (!quiet) setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load({ quiet: true });
//     const timer = setInterval(() => load({ quiet: true }), 60000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//     function closeOutside(event) {
//       if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
//     }
//     document.addEventListener("mousedown", closeOutside);
//     return () => document.removeEventListener("mousedown", closeOutside);
//   }, []);

//   async function toggle() {
//     const next = !open;
//     setOpen(next);
//     if (next) await load();
//   }

//   async function markRead(item) {
//     if (!item.isRead) {
//       await notificationApi.markRead(item.id);
//       setItems((current) => current.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
//       setUnreadCount((count) => Math.max(0, count - 1));
//     }
//     if (item.link) setOpen(false);
//   }

//   async function markAll() {
//     await notificationApi.markAllRead();
//     setItems((current) => current.map((n) => ({ ...n, isRead: true })));
//     setUnreadCount(0);
//   }

//   return (
//     <div className="relative" ref={rootRef}>
//       <button type="button" onClick={toggle} className="relative rounded-sm p-2 text-ink-muted hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open}>
//         <Bell className="h-5 w-5" />
//         {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-seal px-1 text-center font-mono text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
//       </button>

//       {open && (
//         <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-paper-line bg-paper-raised shadow-xl">
//           <div className="flex items-center justify-between border-b border-paper-line px-4 py-3">
//             <div><p className="font-medium text-ink">Notifications</p><p className="text-xs text-ink-muted">{unreadCount} unread</p></div>
//             {unreadCount > 0 && <button type="button" onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-seal hover:underline"><CheckCheck className="h-3.5 w-3.5" /> Mark all read</button>}
//           </div>
//           <div className="max-h-[28rem] overflow-y-auto">
//             {loading && <div className="flex items-center justify-center p-8 text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" /></div>}
//             {!loading && error && <div className="p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => load()} className="mt-2 font-medium underline">Retry</button></div>}
//             {!loading && !error && items.length === 0 && <p className="p-8 text-center text-sm text-ink-muted">You have no notifications yet.</p>}
//             {!loading && !error && items.map((item) => {
//               const content = (
//                 <div className={`border-b border-paper-line px-4 py-3 transition-colors hover:bg-paper ${!item.isRead ? "bg-seal-wash/40" : ""}`}>
//                   <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-seal"}`} /><div className="min-w-0"><p className="text-sm font-medium text-ink">{item.title || item.payload?.title || "NyayaSetu update"}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-ink-muted">{item.message || item.payload?.message || item.type?.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-ink-muted">{new Date(item.createdAt).toLocaleString()}</p></div></div>
//                 </div>
//               );
//               return item.link ? <Link key={item.id} href={item.link} onClick={() => markRead(item)}>{content}</Link> : <button key={item.id} type="button" onClick={() => markRead(item)} className="block w-full text-left">{content}</button>;
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// "use client";

// import Link from "next/link";
// import { useEffect, useRef, useState } from "react";
// import {
//   Bell,
//   Check,
//   CheckCheck,
//   Loader2,
//   Mail,
//   Trash2,
//   X,
// } from "lucide-react";

// import { notificationApi } from "@/lib/api";

// function friendlyError(error) {
//   return (
//     error?.response?.data?.message ||
//     "Notifications could not be loaded. Please try again."
//   );
// }

// function formatDate(value) {
//   if (!value) return "";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return date.toLocaleString();
// }

// export function NotificationCenter() {
//   const [open, setOpen] = useState(false);
//   const [items, setItems] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [actionId, setActionId] = useState(null);
//   const [clearingAll, setClearingAll] = useState(false);
//   const [markingAll, setMarkingAll] = useState(false);

//   const rootRef = useRef(null);

//   async function load({ quiet = false } = {}) {
//     if (!quiet) {
//       setLoading(true);
//     }

//     setError("");

//     try {
//       const response = await notificationApi.mine({
//         page: 1,
//         limit: 20,
//       });

//       const responseData = response?.data || {};

//       setItems(responseData.data || []);
//       setUnreadCount(
//         responseData.meta?.unreadCount || 0
//       );
//     } catch (err) {
//       if (!quiet) {
//         setError(friendlyError(err));
//       }
//     } finally {
//       if (!quiet) {
//         setLoading(false);
//       }
//     }
//   }

//   useEffect(() => {
//     load({
//       quiet: true,
//     });

//     const timer = setInterval(() => {
//       load({
//         quiet: true,
//       });
//     }, 60000);

//     return () => {
//       clearInterval(timer);
//     };
//   }, []);

//   useEffect(() => {
//     function closeOutside(event) {
//       if (
//         rootRef.current &&
//         !rootRef.current.contains(event.target)
//       ) {
//         setOpen(false);
//       }
//     }

//     function closeWithEscape(event) {
//       if (event.key === "Escape") {
//         setOpen(false);
//       }
//     }

//     document.addEventListener(
//       "mousedown",
//       closeOutside
//     );

//     document.addEventListener(
//       "keydown",
//       closeWithEscape
//     );

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         closeOutside
//       );

//       document.removeEventListener(
//         "keydown",
//         closeWithEscape
//       );
//     };
//   }, []);

//   async function toggle() {
//     const nextOpen = !open;

//     setOpen(nextOpen);

//     if (nextOpen) {
//       await load();
//     }
//   }

//   async function markRead(item) {
//     if (item.isRead) {
//       return;
//     }

//     setActionId(item.id);

//     try {
//       await notificationApi.markRead(item.id);

//       setItems((current) =>
//         current.map((notification) =>
//           notification.id === item.id
//             ? {
//                 ...notification,
//                 isRead: true,
//                 readAt: new Date().toISOString(),
//               }
//             : notification
//         )
//       );

//       setUnreadCount((count) =>
//         Math.max(0, count - 1)
//       );
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setActionId(null);
//     }
//   }

//   async function markUnread(item) {
//     if (!item.isRead) {
//       return;
//     }

//     setActionId(item.id);

//     try {
//       await notificationApi.markUnread(item.id);

//       setItems((current) =>
//         current.map((notification) =>
//           notification.id === item.id
//             ? {
//                 ...notification,
//                 isRead: false,
//                 readAt: null,
//               }
//             : notification
//         )
//       );

//       setUnreadCount((count) => count + 1);
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setActionId(null);
//     }
//   }

//   async function markAll() {
//     if (unreadCount === 0) {
//       return;
//     }

//     setMarkingAll(true);

//     try {
//       await notificationApi.markAllRead();

//       setItems((current) =>
//         current.map((notification) => ({
//           ...notification,
//           isRead: true,
//           readAt: new Date().toISOString(),
//         }))
//       );

//       setUnreadCount(0);
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setMarkingAll(false);
//     }
//   }

//   async function deleteOne(item) {
//     const confirmed = window.confirm(
//       "Do you want to delete this notification?"
//     );

//     if (!confirmed) {
//       return;
//     }

//     setActionId(item.id);

//     try {
//       await notificationApi.remove(item.id);

//       setItems((current) =>
//         current.filter(
//           (notification) =>
//             notification.id !== item.id
//         )
//       );

//       if (!item.isRead) {
//         setUnreadCount((count) =>
//           Math.max(0, count - 1)
//         );
//       }
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setActionId(null);
//     }
//   }

//   async function clearAll() {
//     if (items.length === 0) {
//       return;
//     }

//     const confirmed = window.confirm(
//       "Do you want to delete all notifications?"
//     );

//     if (!confirmed) {
//       return;
//     }

//     setClearingAll(true);

//     try {
//       await notificationApi.deleteAll();

//       setItems([]);
//       setUnreadCount(0);
//     } catch (err) {
//       setError(friendlyError(err));
//     } finally {
//       setClearingAll(false);
//     }
//   }

//   async function handleNotificationClick(item) {
//     if (!item.isRead) {
//       await markRead(item);
//     }

//     if (item.link) {
//       setOpen(false);
//     }
//   }

//   return (
//     <div
//       className="relative"
//       ref={rootRef}
//     >
//       <button
//         type="button"
//         onClick={toggle}
//         className="relative rounded-sm p-2 text-ink-muted transition-colors hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
//         aria-label={`Notifications${
//           unreadCount
//             ? `, ${unreadCount} unread`
//             : ""
//         }`}
//         aria-expanded={open}
//       >
//         <Bell className="h-5 w-5" />

//         {unreadCount > 0 && (
//           <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-seal px-1 text-center font-mono text-[10px] leading-4 text-white">
//             {unreadCount > 99
//               ? "99+"
//               : unreadCount}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div
//           className="
//             fixed inset-x-3 top-16 z-50
//             flex max-h-[calc(100vh-5rem)] flex-col
//             overflow-hidden rounded-lg
//             border border-paper-line
//             bg-paper-raised shadow-2xl

//             sm:absolute sm:inset-x-auto
//             sm:right-0 sm:top-12
//             sm:w-[26rem]
//             sm:max-h-[34rem]
//           "
//         >
//           <div className="flex shrink-0 items-center justify-between border-b border-paper-line px-4 py-3">
//             <div>
//               <p className="font-medium text-ink">
//                 Notifications
//               </p>

//               <p className="text-xs text-ink-muted">
//                 {unreadCount} unread ·{" "}
//                 {items.length} loaded
//               </p>
//             </div>

//             <div className="flex items-center gap-1">
//               {unreadCount > 0 && (
//                 <button
//                   type="button"
//                   onClick={markAll}
//                   disabled={markingAll}
//                   className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-seal transition-colors hover:bg-seal-wash disabled:cursor-not-allowed disabled:opacity-60"
//                   title="Mark all as read"
//                 >
//                   {markingAll ? (
//                     <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                   ) : (
//                     <CheckCheck className="h-3.5 w-3.5" />
//                   )}

//                   <span className="hidden sm:inline">
//                     Mark all
//                   </span>
//                 </button>
//               )}

//               {items.length > 0 && (
//                 <button
//                   type="button"
//                   onClick={clearAll}
//                   disabled={clearingAll}
//                   className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
//                   title="Delete all notifications"
//                 >
//                   {clearingAll ? (
//                     <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                   ) : (
//                     <Trash2 className="h-3.5 w-3.5" />
//                   )}

//                   <span className="hidden sm:inline">
//                     Clear all
//                   </span>
//                 </button>
//               )}

//               <button
//                 type="button"
//                 onClick={() => setOpen(false)}
//                 className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink sm:hidden"
//                 aria-label="Close notifications"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>
//           </div>

//           {error && (
//             <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//               <div className="flex items-start justify-between gap-3">
//                 <p>{error}</p>

//                 <button
//                   type="button"
//                   onClick={() => setError("")}
//                   className="shrink-0"
//                   aria-label="Dismiss error"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
//             {loading && (
//               <div className="flex items-center justify-center p-10 text-ink-muted">
//                 <Loader2 className="h-5 w-5 animate-spin" />
//               </div>
//             )}

//             {!loading &&
//               !error &&
//               items.length === 0 && (
//                 <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
//                   <Bell className="mb-3 h-8 w-8 text-ink-muted" />

//                   <p className="text-sm font-medium text-ink">
//                     No notifications
//                   </p>

//                   <p className="mt-1 text-xs text-ink-muted">
//                     You have no notifications yet.
//                   </p>
//                 </div>
//               )}

//             {!loading &&
//               items.map((item) => {
//                 const isBusy =
//                   actionId === item.id;

//                 const content = (
//                   <div
//                     className={`group border-b border-paper-line px-4 py-3 transition-colors hover:bg-paper ${
//                       !item.isRead
//                         ? "bg-seal-wash/40"
//                         : ""
//                     }`}
//                   >
//                     <div className="flex items-start gap-3">
//                       <span
//                         className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
//                           item.isRead
//                             ? "bg-transparent"
//                             : "bg-seal"
//                         }`}
//                       />

//                       <div className="min-w-0 flex-1">
//                         <p className="break-words text-sm font-medium text-ink">
//                           {item.title ||
//                             item.payload?.title ||
//                             "NyayaSetu update"}
//                         </p>

//                         <p className="mt-1 break-words text-xs leading-5 text-ink-muted">
//                           {item.message ||
//                             item.payload?.message ||
//                             item.type?.replaceAll(
//                               "_",
//                               " "
//                             )}
//                         </p>

//                         <p className="mt-1 text-[11px] text-ink-muted">
//                           {formatDate(
//                             item.createdAt
//                           )}
//                         </p>

//                         <div className="mt-2 flex flex-wrap items-center gap-2">
//                           {!item.isRead ? (
//                             <button
//                               type="button"
//                               disabled={isBusy}
//                               onClick={(event) => {
//                                 event.preventDefault();
//                                 event.stopPropagation();
//                                 markRead(item);
//                               }}
//                               className="inline-flex items-center gap-1 text-[11px] font-medium text-seal hover:underline disabled:opacity-50"
//                             >
//                               <Check className="h-3 w-3" />
//                               Mark read
//                             </button>
//                           ) : (
//                             <button
//                               type="button"
//                               disabled={isBusy}
//                               onClick={(event) => {
//                                 event.preventDefault();
//                                 event.stopPropagation();
//                                 markUnread(item);
//                               }}
//                               className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-seal disabled:opacity-50"
//                             >
//                               <Mail className="h-3 w-3" />
//                               Mark unread
//                             </button>
//                           )}

//                           <button
//                             type="button"
//                             disabled={isBusy}
//                             onClick={(event) => {
//                               event.preventDefault();
//                               event.stopPropagation();
//                               deleteOne(item);
//                             }}
//                             className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline disabled:opacity-50"
//                           >
//                             {isBusy ? (
//                               <Loader2 className="h-3 w-3 animate-spin" />
//                             ) : (
//                               <Trash2 className="h-3 w-3" />
//                             )}

//                             Delete
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );

//                 if (item.link) {
//                   return (
//                     <Link
//                       key={item.id}
//                       href={item.link}
//                       onClick={() =>
//                         handleNotificationClick(
//                           item
//                         )
//                       }
//                       className="block"
//                     >
//                       {content}
//                     </Link>
//                   );
//                 }

//                 return (
//                   <div key={item.id}>
//                     {content}
//                   </div>
//                 );
//               })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  Mail,
  Trash2,
  X,
} from "lucide-react";

import { notificationApi } from "@/lib/api";

function friendlyError(error) {
  return (
    error?.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationTitle(item) {
  return (
    item?.title ||
    item?.payload?.title ||
    "NyayaSetu update"
  );
}

function getNotificationMessage(item) {
  return (
    item?.message ||
    item?.payload?.message ||
    item?.type?.replaceAll("_", " ") ||
    "You have received a new notification."
  );
}

function getNotificationType(item) {
  if (!item?.type) return "Notification";

  return item.type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

export function NotificationCenter() {
  const router = useRouter();
  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [actionId, setActionId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const [selectedId, setSelectedId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    itemId: null,
  });

  const selectedItem =
    items.find((item) => item.id === selectedId) ||
    null;

  const modalOpen =
    Boolean(selectedItem) || confirmModal.open;

  async function load({ quiet = false } = {}) {
    if (!quiet) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await notificationApi.mine({
        page: 1,
        limit: 20,
      });

      const responseData = response?.data || {};

      setItems(
        Array.isArray(responseData.data)
          ? responseData.data
          : []
      );

      setUnreadCount(
        Number(responseData.meta?.unreadCount) || 0
      );
    } catch (err) {
      if (!quiet) {
        setError(friendlyError(err));
      }
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    load({ quiet: true });

    const timer = setInterval(() => {
      load({ quiet: true });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function closeOutside(event) {
      if (modalOpen) return;

      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOutside
      );
    };
  }, [modalOpen]);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key !== "Escape") return;

      if (confirmModal.open) {
        closeConfirmModal();
        return;
      }

      if (selectedItem) {
        setSelectedId(null);
        return;
      }

      setOpen(false);
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [
    confirmModal.open,
    selectedItem,
    actionId,
    clearingAll,
  ]);

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [modalOpen]);

  async function toggle() {
    const nextOpen = !open;

    setOpen(nextOpen);

    if (nextOpen) {
      await load();
    }
  }

  async function markRead(item) {
    if (!item || item.isRead) return true;

    setActionId(item.id);
    setError("");

    try {
      await notificationApi.markRead(item.id);

      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );

      return true;
    } catch (err) {
      setError(friendlyError(err));
      return false;
    } finally {
      setActionId(null);
    }
  }

  async function markUnread(item) {
    if (!item || !item.isRead) return;

    setActionId(item.id);
    setError("");

    try {
      await notificationApi.markUnread(item.id);

      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                isRead: false,
                readAt: null,
              }
            : notification
        )
      );

      setUnreadCount((count) => count + 1);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setActionId(null);
    }
  }

  async function markAll() {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    setError("");

    try {
      await notificationApi.markAllRead();

      setItems((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(item) {
    setSelectedId(item.id);

    if (!item.isRead) {
      await markRead(item);
    }
  }

  function openRelatedPage(item) {
    if (!item?.link) return;

    setSelectedId(null);
    setOpen(false);
    router.push(item.link);
  }

  function askDeleteOne(item) {
    setConfirmModal({
      open: true,
      type: "single",
      itemId: item.id,
    });
  }

  function askClearAll() {
    if (items.length === 0) return;

    setConfirmModal({
      open: true,
      type: "all",
      itemId: null,
    });
  }

  function closeConfirmModal() {
    if (actionId || clearingAll) return;

    setConfirmModal({
      open: false,
      type: null,
      itemId: null,
    });
  }

  async function confirmDelete() {
    if (confirmModal.type === "single") {
      const item = items.find(
        (notification) =>
          notification.id === confirmModal.itemId
      );

      if (!item) {
        closeConfirmModal();
        return;
      }

      setActionId(item.id);
      setError("");

      try {
        await notificationApi.remove(item.id);

        setItems((current) =>
          current.filter(
            (notification) =>
              notification.id !== item.id
          )
        );

        if (!item.isRead) {
          setUnreadCount((count) =>
            Math.max(0, count - 1)
          );
        }

        if (selectedId === item.id) {
          setSelectedId(null);
        }

        setConfirmModal({
          open: false,
          type: null,
          itemId: null,
        });
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setActionId(null);
      }

      return;
    }

    if (confirmModal.type === "all") {
      setClearingAll(true);
      setError("");

      try {
        await notificationApi.deleteAll();

        setItems([]);
        setUnreadCount(0);
        setSelectedId(null);

        setConfirmModal({
          open: false,
          type: null,
          itemId: null,
        });
      } catch (err) {
        setError(friendlyError(err));
      } finally {
        setClearingAll(false);
      }
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-sm p-2 text-ink-muted transition-colors hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
        aria-label={`Notifications${
          unreadCount
            ? `, ${unreadCount} unread`
            : ""
        }`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-seal px-1 text-center font-mono text-[10px] leading-4 text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="
            fixed inset-x-3 top-16 z-50
            flex max-h-[calc(100vh-5rem)] flex-col
            overflow-hidden rounded-xl
            border border-paper-line
            bg-paper-raised shadow-2xl

            sm:absolute sm:inset-x-auto
            sm:right-0 sm:top-12
            sm:w-[27rem]
            sm:max-h-[36rem]
          "
        >
          <div className="flex shrink-0 items-center justify-between border-b border-paper-line px-4 py-3">
            <div>
              <p className="font-semibold text-ink">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-ink-muted">
                {unreadCount} unread · {items.length}{" "}
                loaded
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-seal transition-colors hover:bg-seal-wash disabled:cursor-not-allowed disabled:opacity-50"
                  title="Mark all as read"
                >
                  {markingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}

                  <span className="hidden sm:inline">
                    Mark all
                  </span>
                </button>
              )}

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={askClearAll}
                  disabled={clearingAll}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete all notifications"
                >
                  {clearingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}

                  <span className="hidden sm:inline">
                    Clear all
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink sm:hidden"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start justify-between gap-3">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0 rounded p-0.5 hover:bg-red-100"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading && (
              <div className="flex items-center justify-center p-10 text-ink-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {!loading &&
              !error &&
              items.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper">
                    <Bell className="h-6 w-6 text-ink-muted" />
                  </div>

                  <p className="text-sm font-medium text-ink">
                    No notifications
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-ink-muted">
                    Your new updates will appear here.
                  </p>
                </div>
              )}

            {!loading &&
              items.map((item) => {
                const isBusy =
                  actionId === item.id;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      openNotification(item)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        openNotification(item);
                      }
                    }}
                    className={`group cursor-pointer border-b border-paper-line px-4 py-3.5 transition-colors hover:bg-paper ${
                      !item.isRead
                        ? "bg-seal-wash/40"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          item.isRead
                            ? "bg-paper-line"
                            : "bg-seal"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="break-words text-sm font-semibold text-ink">
                            {getNotificationTitle(item)}
                          </p>

                          {!item.isRead && (
                            <span className="shrink-0 rounded-full bg-seal px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-ink-muted">
                          {getNotificationMessage(item)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <p className="text-[11px] text-ink-muted">
                            {formatDate(item.createdAt)}
                          </p>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openNotification(item);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-seal hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>

                          {!item.isRead ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(event) => {
                                event.stopPropagation();
                                markRead(item);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-seal hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}

                              Mark read
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={(event) => {
                                event.stopPropagation();
                                markUnread(item);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-seal disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}

                              Mark unread
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(event) => {
                              event.stopPropagation();
                              askDeleteOne(item);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Notification detail modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedId(null)}
            aria-label="Close notification details"
          />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-paper-line bg-paper-raised shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-paper-line px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-seal-wash text-seal">
                  <Bell className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-seal">
                    {getNotificationType(selectedItem)}
                  </p>

                  <h2
                    id="notification-detail-title"
                    className="mt-1 break-words text-lg font-semibold text-ink"
                  >
                    {getNotificationTitle(selectedItem)}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="shrink-0 rounded-md p-2 text-ink-muted transition-colors hover:bg-paper hover:text-ink"
                aria-label="Close notification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl border border-paper-line bg-paper p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-ink">
                  {getNotificationMessage(selectedItem)}
                </p>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border border-paper-line p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />

                  <div>
                    <p className="text-xs font-medium text-ink-muted">
                      Received
                    </p>

                    <p className="mt-0.5 text-sm text-ink">
                      {formatDate(
                        selectedItem.createdAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />

                  <div>
                    <p className="text-xs font-medium text-ink-muted">
                      Status
                    </p>

                    <p className="mt-0.5 text-sm text-ink">
                      {selectedItem.isRead
                        ? "Read"
                        : "Unread"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-paper px-5 py-4">
              <button
                type="button"
                disabled={actionId === selectedItem.id}
                onClick={() =>
                  askDeleteOne(selectedItem)
                }
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {selectedItem.isRead ? (
                  <button
                    type="button"
                    disabled={
                      actionId === selectedItem.id
                    }
                    onClick={() =>
                      markUnread(selectedItem)
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-paper-line bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionId === selectedItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}

                    Mark unread
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      actionId === selectedItem.id
                    }
                    onClick={() =>
                      markRead(selectedItem)
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-paper-line bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionId === selectedItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}

                    Mark read
                  </button>
                )}

                {selectedItem.link && (
                  <button
                    type="button"
                    onClick={() =>
                      openRelatedPage(selectedItem)
                    }
                    className="inline-flex items-center gap-2 rounded-md bg-seal px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open related page
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional confirmation modal */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeConfirmModal}
            aria-label="Close confirmation dialog"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-paper-line bg-paper-raised shadow-2xl">
            <div className="flex items-start gap-4 px-5 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2
                  id="notification-confirm-title"
                  className="text-base font-semibold text-ink"
                >
                  {confirmModal.type === "all"
                    ? "Delete all notifications?"
                    : "Delete this notification?"}
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-ink-muted">
                  {confirmModal.type === "all"
                    ? "All notifications will be permanently removed from your account. This action cannot be undone."
                    : "This notification will be permanently removed from your account. This action cannot be undone."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-paper-line bg-paper px-5 py-4">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={
                  Boolean(actionId) || clearingAll
                }
                className="rounded-md border border-paper-line bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={
                  Boolean(actionId) || clearingAll
                }
                className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(Boolean(actionId) ||
                  clearingAll) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {confirmModal.type === "all"
                  ? "Delete all"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}