"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const [settings, setSettings] = useState(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mobile menu
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchRsvps();
    fetchSettings(); // ADD THIS LINE
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSettings(data.data);
        setNewDeadline(
          new Date(data.data.rsvpDeadline).toISOString().slice(0, 16)
        );
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const updateDeadline = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rsvpDeadline: newDeadline }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Deadline updated successfully" });
        fetchSettings();
        setShowDeadlineModal(false);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update deadline" });
    }
  };

  const toggleRsvpEnabled = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rsvpEnabled: !settings.rsvpEnabled }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `RSVPs ${
            settings.rsvpEnabled ? "disabled" : "enabled"
          } successfully`,
        });
        fetchSettings();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to toggle RSVP status" });
    }
  };

  const fetchRsvps = async (searchQuery = "") => {
    try {
      const token = localStorage.getItem("adminToken");
      const url = searchQuery
        ? `/api/admin/rsvps?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/rsvps";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setRsvps(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    fetchRsvps(search);
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/rsvps", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, paymentStatus: status }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Status updated successfully" });
        fetchRsvps(search);
        setActionMenuOpen(null);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedRows.length === 0) return;

    try {
      const token = localStorage.getItem("adminToken");

      const updatePromises = selectedRows.map((id) =>
        fetch("/api/admin/rsvps", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, paymentStatus: status }),
        })
      );

      await Promise.all(updatePromises);

      setMessage({
        type: "success",
        text: `${selectedRows.length} RSVP${
          selectedRows.length > 1 ? "s" : ""
        } marked as ${status}`,
      });

      fetchRsvps(search);
      setSelectedRows([]);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update RSVPs" });
    }
  };

  const deleteRsvp = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this RSVP? This action cannot be undone."
      )
    )
      return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/rsvps?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: "success", text: "RSVP deleted successfully" });
        fetchRsvps(search);
        setActionMenuOpen(null);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete RSVP" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Under 5",
      "Age 5-12",
      "Age 12+",
      "Total Amount",
      "Payment Status",
      "Payment Ref",
      "Date",
    ];
    const rows = rsvps.map((rsvp) => [
      rsvp.name,
      rsvp.phone,
      rsvp.email || "",
      rsvp.under5,
      rsvp.age5to12,
      rsvp.age12plus,
      rsvp.totalAmount,
      rsvp.paymentStatus,
      rsvp.paymentReference || "",
      new Date(rsvp.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ahhc-rsvps-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // const copyForWhatsApp = () => {
  //   // Filter only paid RSVPs
  //   const paidRsvps = rsvps.filter((r) => r.paymentStatus === "paid");

  //   // Format the list
  //   let message = `🎉 AHHC Family Get-Together 2026\n✅ Confirmed Attendees (Paid)\n\n`;

  //   paidRsvps.forEach((rsvp, index) => {
  //     const total = rsvp.under5 + rsvp.age5to12 + rsvp.age12plus;
  //     message += `${index + 1}. ${rsvp.name} - ${total} ${
  //       total === 1 ? "person" : "people"
  //     }\n`;
  //     message += `   • Under 5: ${rsvp.under5} | Age 5-12: ${rsvp.age5to12} | Age 12+: ${rsvp.age12plus}\n\n`;
  //   });

  //   // Add summary
  //   const totalPeople = paidRsvps.reduce(
  //     (sum, r) => sum + r.under5 + r.age5to12 + r.age12plus,
  //     0
  //   );
  //   const totalRevenue = paidRsvps.reduce((sum, r) => sum + r.totalAmount, 0);

  //   message += `━━━━━━━━━━━━━━━━\n`;
  //   message += `📊 Total: ${paidRsvps.length} families, ${totalPeople} people\n`;
  //   //message += `💷 Total Revenue: £${totalRevenue}`;

  //   // Copy to clipboard
  //   navigator.clipboard
  //     .writeText(message)
  //     .then(() => {
  //       setMessage({
  //         type: "success",
  //         text: "Copied! Opening WhatsApp... 📋",
  //       });
  //       setTimeout(() => setMessage({ type: "", text: "" }), 3000);

  //       // Open WhatsApp
  //       // Try to open WhatsApp app on mobile, Web WhatsApp on desktop
  //       const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  //       if (isMobile) {
  //         // Try to open WhatsApp app with pre-filled text
  //         window.open(
  //           `whatsapp://send?text=${encodeURIComponent(message)}`,
  //           "_blank"
  //         );
  //       } else {
  //         // Open WhatsApp Web
  //         window.open("https://web.whatsapp.com/", "_blank");
  //       }
  //     })
  //     .catch(() => {
  //       setMessage({
  //         type: "error",
  //         text: "Failed to copy. Please try again.",
  //       });
  //     });
  // };

  const copyForWhatsApp = () => {
    // Filter only paid RSVPs
    const paidRsvps = rsvps
      .filter((r) => r.paymentStatus === "paid")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by date

    // Header
    //let message = `🎉 *AHHC Get-Together 2026*\n`;
    // message += `📅 17th January 2026 | 1:00 PM - 8:00 PM\n`;
    //message += `📍 St Wilfred School, Crawley\n\n`;
    //message += `━━━━━━━━━━━━━━━━━━━━\n`;
    let message = `✅ *CONFIRMED ATTENDEES (PAID)*\n`;
    //message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    // List each attendee
    paidRsvps.forEach((rsvp, index) => {
      const total = rsvp.under5 + rsvp.age5to12 + rsvp.age12plus;
      const date = new Date(rsvp.createdAt).toLocaleDateString("en-GB");

      message += `*${index + 1}. ${rsvp.name}*\n`;
      //message += `📞 ${rsvp.phone}\n`;
      //if (rsvp.email) message += `📧 ${rsvp.email}\n`;
      message += `👥 U5: ${rsvp.under5} | 5-12: ${rsvp.age5to12} | 12+: ${rsvp.age12plus} *(${total} people)*\n\n`;
      //message += `💷 £${rsvp.totalAmount}`;
      //if (rsvp.paymentReference) message += ` | Ref: ${rsvp.paymentReference}`;
      //message += `\n📅 ${date}\n\n`;
    });

    // Summary
    const totalPeople = paidRsvps.reduce(
      (sum, r) => sum + r.under5 + r.age5to12 + r.age12plus,
      0
    );
    const totalRevenue = paidRsvps.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalUnder5 = paidRsvps.reduce((sum, r) => sum + r.under5, 0);
    const totalAge5to12 = paidRsvps.reduce((sum, r) => sum + r.age5to12, 0);
    const totalAge12plus = paidRsvps.reduce((sum, r) => sum + r.age12plus, 0);

    //message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📊 *SUMMARY*\n`;
    //message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `👨‍👩‍👧‍👦 Total Families: ${paidRsvps.length}\n`;
    message += `👥 Total People: ${totalPeople}\n`;
    message += `   • Under 5: ${totalUnder5}\n`;
    message += `   • Age 5-12: ${totalAge5to12}\n`;
    message += `   • Age 12+: ${totalAge12plus}\n`;
    // message += `💷 Total Revenue: £${totalRevenue}\n`;
    //message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    // message += `_Generated: ${new Date().toLocaleString("en-GB")}_`;

    // Copy to clipboard and open WhatsApp
    navigator.clipboard
      .writeText(message)
      .then(() => {
        setMessage({ type: "success", text: "Copied! Opening WhatsApp... 📋" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          window.open(
            `whatsapp://send?text=${encodeURIComponent(message)}`,
            "_blank"
          );
        } else {
          window.open("https://web.whatsapp.com/", "_blank");
        }
      })
      .catch(() => {
        setMessage({
          type: "error",
          text: "Failed to copy. Please try again.",
        });
      });
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentPageData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentPageData.map((r) => r._id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Filter and sort
  const filteredRsvps = rsvps
    .filter(
      (rsvp) => statusFilter === "all" || rsvp.paymentStatus === statusFilter
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "amount":
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case "date":
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      return sortOrder === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    });

  // Pagination
  const totalPages = Math.ceil(filteredRsvps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredRsvps.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status, rsvpId) => {
    return (
      <select
        value={status}
        onChange={(e) => updatePaymentStatus(rsvpId, e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "600",
          backgroundColor: "#374151",
          color: status === "pending" ? "#f59e0b" : "#10b981",
          border: "1px solid #4b5563",
          cursor: "pointer",
          outline: "none",
          minWidth: "120px",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "28px",
        }}
      >
        <option value="pending">⏳ Pending</option>
        <option value="paid">✅ Paid</option>
      </select>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#9ca3af" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111827", padding: "16px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header - Mobile Responsive */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "clamp(1.25rem, 4vw, 1.875rem)",
                  fontWeight: "700",
                  color: "#f9fafb",
                  marginBottom: "4px",
                }}
              >
                📊 RSVP Management
              </h1>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                AHHC Family Get-Together 2026
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              {/* <button
                onClick={exportToCSV}
                style={{
                  flex: "1",
                  padding: "10px 12px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                📥 Export CSV
              </button> */}

              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <button
                  onClick={copyForWhatsApp}
                  style={{
                    flex: "1",
                    padding: "10px 12px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={exportToCSV}
                  style={{
                    flex: "1",
                    padding: "10px 12px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  📥 Export
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: "1",
                    padding: "10px 12px",
                    background: "#374151",
                    color: "#f3f4f6",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Logout
                </button>
              </div>
              {/* 
              <button
                onClick={handleLogout}
                style={{
                  flex: "1",
                  padding: "10px 12px",
                  background: "#374151",
                  color: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Logout
              </button> */}
            </div>
          </div>
        </div>
        {/* Message */}
        {message.text && (
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
              background: message.type === "success" ? "#064e3b" : "#7f1d1d",
              color: message.type === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${
                message.type === "success" ? "#10b981" : "#ef4444"
              }40`,
            }}
          >
            {message.text}
          </div>
        )}
        {/* Stats Cards - Responsive Grid */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {[
              {
                label: "Total RSVPs",
                value: stats.totalRsvps,
                color: "#667eea",
                note: "↑ Active Registrations",
              },
              {
                label: "Pending Payments",
                value: rsvps.filter((r) => r.paymentStatus === "pending")
                  .length,
                color: "#f59e0b",
                note: "Awaiting Confirmation",
              },
              {
                label: "Total Attendees",
                value: stats.totalPeople,
                color: "#10b981",
                note: "All age groups",
              },
              {
                label: "Total Revenue",
                value: `£${stats.totalAmount}`,
                color: "#8b5cf6",
                note: "Expected Collection",
              },
              {
                label: "Under 5",
                value: stats.totalUnder5,
                color: "#ec4899",
                note: "FREE",
              },
              {
                label: "Age 5-12",
                value: stats.totalAge5to12,
                color: "#06b6d4",
                note: "£10 each",
              },
              {
                label: "Age 12+",
                value: stats.totalAge12plus,
                color: "#f97316",
                note: "£15 each",
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "#1f2937",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  borderLeft: `4px solid ${stat.color}`,
                  border: "1px solid #374151",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 2rem)",
                    fontWeight: "700",
                    color: "#f9fafb",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {stat.note}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deadline Control Section */}
        {settings && (
          <div
            style={{
              background: "#1f2937",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              border: "1px solid #374151",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#f9fafb",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ⏰ RSVP Deadline Settings
                </h3>
                <p
                  style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}
                >
                  Current deadline:{" "}
                  <strong style={{ color: "#f3f4f6" }}>
                    {new Date(settings.rsvpDeadline).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  {" • "}
                  <span
                    style={{
                      color: settings.rsvpEnabled ? "#10b981" : "#ef4444",
                      fontWeight: "600",
                    }}
                  >
                    {settings.rsvpEnabled ? "✅ Active" : "🚫 Disabled"}
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowDeadlineModal(true)}
                  style={{
                    padding: "10px 16px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  📅 Edit Deadline
                </button>
                <button
                  onClick={toggleRsvpEnabled}
                  style={{
                    padding: "10px 16px",
                    background: settings.rsvpEnabled ? "#7f1d1d" : "#064e3b",
                    color: settings.rsvpEnabled ? "#ef4444" : "#10b981",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {settings.rsvpEnabled
                    ? "🚫 Disable RSVPs"
                    : "✅ Enable RSVPs"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Edit Modal */}
        {showDeadlineModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setShowDeadlineModal(false)}
          >
            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "500px",
                width: "100%",
                border: "1px solid #374151",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                  marginBottom: "24px",
                }}
              >
                📅 Set RSVP Deadline
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#f3f4f6",
                    marginBottom: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Deadline Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={updateDeadline}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  💾 Save Deadline
                </button>
                <button
                  onClick={() => setShowDeadlineModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#374151",
                    color: "#f3f4f6",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Mobile Responsive */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
          }}
        >
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            style={{
              display: "none",
              width: "100%",
              padding: "12px",
              background: "#374151",
              color: "#f3f4f6",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: mobileFiltersOpen ? "16px" : "0",
              fontSize: "0.875rem",
            }}
            className="mobile-only"
          >
            {mobileFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
          </button>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
            className={mobileFiltersOpen ? "mobile-filters-open" : ""}
          >
            <div style={{ flex: "1", minWidth: "200px" }}>
              <input
                type="text"
                placeholder="🔍 Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  outline: "none",
                  background: "#111827",
                  color: "#f3f4f6",
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "10px 14px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                outline: "none",
                color: "#f3f4f6",
                minWidth: "120px",
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="paid">✅ Paid</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px 14px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                outline: "none",
                color: "#f3f4f6",
                minWidth: "120px",
              }}
            >
              <option value="date">By Date</option>
              <option value="name">By Name</option>
              <option value="amount">By Amount</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                padding: "10px 14px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                fontWeight: "600",
                color: "#f3f4f6",
                minWidth: "44px",
              }}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  fetchRsvps("");
                }}
                style={{
                  padding: "10px 14px",
                  background: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  color: "#f3f4f6",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#1e3a8a",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #3b82f6",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#93c5fd",
                }}
              >
                {selectedRows.length} selected
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => bulkUpdateStatus("paid")}
                  style={{
                    padding: "6px 12px",
                    background: "#3b82f6",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => setSelectedRows([])}
                  style={{
                    padding: "6px 12px",
                    background: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    color: "#f3f4f6",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Table - Desktop View */}
        <div
          className="desktop-table"
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead
                style={{
                  background: "#111827",
                  borderBottom: "1px solid #374151",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      width: "40px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === currentPageData.length &&
                        currentPageData.length > 0
                      }
                      onChange={toggleSelectAll}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    Name & Contact
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    Tickets
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      width: "80px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ padding: "64px", textAlign: "center" }}
                    >
                      <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
                        📭
                      </div>
                      <p
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: "600",
                          color: "#f3f4f6",
                          marginBottom: "8px",
                        }}
                      >
                        No RSVPs found
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        {search
                          ? "Try adjusting your search or filters"
                          : "RSVPs will appear here once submitted"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((rsvp) => (
                    <tr
                      key={rsvp._id}
                      style={{
                        borderBottom: "1px solid #374151",
                        transition: "background 0.15s",
                        background: selectedRows.includes(rsvp._id)
                          ? "#1e3a8a"
                          : "#1f2937",
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(rsvp._id)}
                          onChange={() => toggleSelectRow(rsvp._id)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                          }}
                        />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#374151",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "600",
                              fontSize: "1rem",
                              flexShrink: 0,
                            }}
                          >
                            {rsvp.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#f9fafb",
                                marginBottom: "2px",
                              }}
                            >
                              {rsvp.name}
                            </div>
                            <div
                              style={{ fontSize: "0.875rem", color: "#9ca3af" }}
                            >
                              {rsvp.phone}
                            </div>
                            {rsvp.email && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  marginTop: "2px",
                                }}
                              >
                                {rsvp.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 8px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            U5: {rsvp.under5}
                          </span>
                          <span
                            style={{
                              padding: "4px 8px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            5-12: {rsvp.age5to12}
                          </span>
                          <span
                            style={{
                              padding: "4px 8px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            12+: {rsvp.age12plus}
                          </span>
                          <span
                            style={{
                              padding: "4px 8px",
                              background: "#10b981",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              color: "#ffffff",
                              fontWeight: "700",
                            }}
                          >
                            Total:{" "}
                            {rsvp.under5 + rsvp.age5to12 + rsvp.age12plus}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "700",
                            color: "#10b981",
                          }}
                        >
                          £{rsvp.totalAmount}
                        </div>
                        {rsvp.paymentReference && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              marginTop: "2px",
                            }}
                          >
                            Ref: {rsvp.paymentReference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "16px" }}>
                        {getStatusBadge(rsvp.paymentStatus, rsvp._id)}
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === rsvp._id ? null : rsvp._id
                            )
                          }
                          style={{
                            padding: "8px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1.25rem",
                            color: "#9ca3af",
                            transition: "all 0.15s",
                          }}
                        >
                          ⋮
                        </button>

                        {actionMenuOpen === rsvp._id && (
                          <>
                            <div
                              style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 10,
                              }}
                              onClick={() => setActionMenuOpen(null)}
                            />
                            <div
                              style={{
                                position: "absolute",
                                right: "16px",
                                top: "45px",
                                background: "#1f2937",
                                borderRadius: "8px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                                padding: "8px",
                                minWidth: "160px",
                                zIndex: 20,
                                border: "1px solid #374151",
                              }}
                            >
                              {/* DELETE BUTTON - Professional minimal design */}
                              <button
                                onClick={() => deleteRsvp(rsvp._id)}
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  borderRadius: "6px",
                                  fontSize: "0.875rem",
                                  fontWeight: "500",
                                  color: "#ef4444",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#7f1d1d")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                🗑️ Delete RSVP
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Mobile Cards View */}
        <div className="mobile-cards" style={{ display: "none" }}>
          {currentPageData.length === 0 ? (
            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "48px 20px",
                textAlign: "center",
                border: "1px solid #374151",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#f3f4f6",
                  marginBottom: "8px",
                }}
              >
                No RSVPs found
              </p>
              <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                {search ? "Try adjusting filters" : "RSVPs will appear here"}
              </p>
            </div>
          ) : (
            currentPageData.map((rsvp) => (
              <div
                key={rsvp._id}
                style={{
                  background: selectedRows.includes(rsvp._id)
                    ? "#1e3a8a"
                    : "#1f2937",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                  border: "1px solid #374151",
                }}
              >
                {/* Header with checkbox, avatar, name, and DELETE button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                    gap: "8px", // Reduced from 12px
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0, // Important: allows flex item to shrink
                      overflow: "hidden", // Prevents overflow
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rsvp._id)}
                      onChange={() => toggleSelectRow(rsvp._id)}
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#374151",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {rsvp.name.charAt(0).toUpperCase()}
                    </div>
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                        overflow: "hidden", // Added
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#f9fafb",
                          fontSize: "1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box", // Changed
                          WebkitLineClamp: 2, // Max 2 lines
                          WebkitBoxOrient: "vertical", // Required for line clamp
                          wordBreak: "break-word", // Break long words
                          lineHeight: "1.3", // Added for better spacing
                        }}
                      >
                        {rsvp.name}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                        {rsvp.phone}
                      </div>
                    </div>
                  </div>

                  {/* Three dots menu button - Professional */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {" "}
                    {/* Added flexShrink: 0 */}
                    <button
                      onClick={() =>
                        setActionMenuOpen(
                          actionMenuOpen === rsvp._id ? null : rsvp._id
                        )
                      }
                      style={{
                        padding: "8px",
                        background: "transparent",
                        color: "#9ca3af",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1.25rem",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      ⋮
                    </button>
                    {/* Dropdown menu */}
                    {actionMenuOpen === rsvp._id && (
                      <>
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 10,
                          }}
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: "0",
                            top: "48px",
                            background: "#1f2937",
                            borderRadius: "8px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                            padding: "4px",
                            minWidth: "140px",
                            zIndex: 20,
                            border: "1px solid #374151",
                          }}
                        >
                          <button
                            onClick={() => deleteRsvp(rsvp._id)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              color: "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#7f1d1d")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Tickets Section */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      marginBottom: "8px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Tickets
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <span
                      style={{
                        padding: "6px 10px",
                        background: "#374151",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        color: "#f3f4f6",
                        fontWeight: "600",
                      }}
                    >
                      U5: {rsvp.under5}
                    </span>
                    <span
                      style={{
                        padding: "6px 10px",
                        background: "#374151",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        color: "#f3f4f6",
                        fontWeight: "600",
                      }}
                    >
                      5-12: {rsvp.age5to12}
                    </span>
                    <span
                      style={{
                        padding: "6px 10px",
                        background: "#374151",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        color: "#f3f4f6",
                        fontWeight: "600",
                      }}
                    >
                      12+: {rsvp.age12plus}
                    </span>
                    <span
                      style={{
                        padding: "6px 10px",
                        background: "#10b981",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        color: "#ffffff",
                        fontWeight: "700",
                      }}
                    >
                      Total: {rsvp.under5 + rsvp.age5to12 + rsvp.age12plus}
                    </span>
                  </div>
                </div>

                {/* Amount and Status Section */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                        marginBottom: "4px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      Amount
                    </div>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#10b981",
                      }}
                    >
                      £{rsvp.totalAmount}
                    </div>
                    {rsvp.paymentReference && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "2px",
                        }}
                      >
                        Ref: {rsvp.paymentReference}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                        marginBottom: "6px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      Status
                    </div>
                    {getStatusBadge(rsvp.paymentStatus, rsvp._id)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredRsvps.length > 0 && (
          <div
            className="desktop-pagination"
            style={{
              background: "#1f2937",
              borderRadius: "12px",
              padding: "16px 20px",
              marginTop: "20px",
              border: "1px solid #374151",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              {/* Left side - Row count */}
              <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                Showing{" "}
                <strong style={{ color: "#f3f4f6" }}>{startIndex + 1}</strong>{" "}
                to{" "}
                <strong style={{ color: "#f3f4f6" }}>
                  {Math.min(endIndex, filteredRsvps.length)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "#f3f4f6" }}>
                  {filteredRsvps.length}
                </strong>{" "}
                RSVPs
              </div>

              {/* Right side - Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {/* Items per page dropdown */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "#111827",
                    color: "#f3f4f6",
                    border: "1px solid #4b5563",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    outline: "none",
                    fontWeight: "500",
                  }}
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>

                {/* Navigation buttons container */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    background: "#111827",
                    padding: "4px",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                  }}
                >
                  {/* First button */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 12px",
                      background:
                        currentPage === 1 ? "transparent" : "transparent",
                      color: currentPage === 1 ? "#4b5563" : "#d1d5db",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.background = "#374151";
                        e.currentTarget.style.color = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color =
                        currentPage === 1 ? "#4b5563" : "#d1d5db";
                    }}
                  >
                    First
                  </button>

                  {/* Previous button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 10px",
                      background:
                        currentPage === 1 ? "transparent" : "transparent",
                      color: currentPage === 1 ? "#4b5563" : "#d1d5db",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      minWidth: "36px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.background = "#374151";
                        e.currentTarget.style.color = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color =
                        currentPage === 1 ? "#4b5563" : "#d1d5db";
                    }}
                  >
                    ←
                  </button>

                  {/* Current page indicator - HIGHLIGHTED */}
                  <div
                    style={{
                      padding: "8px 16px",
                      background: "#667eea",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "700",
                      minWidth: "70px",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {currentPage} / {totalPages}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 10px",
                      background:
                        currentPage === totalPages
                          ? "transparent"
                          : "transparent",
                      color: currentPage === totalPages ? "#4b5563" : "#d1d5db",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      minWidth: "36px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.background = "#374151";
                        e.currentTarget.style.color = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color =
                        currentPage === totalPages ? "#4b5563" : "#d1d5db";
                    }}
                  >
                    →
                  </button>

                  {/* Last button */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 12px",
                      background:
                        currentPage === totalPages
                          ? "transparent"
                          : "transparent",
                      color: currentPage === totalPages ? "#4b5563" : "#d1d5db",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.background = "#374151";
                        e.currentTarget.style.color = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color =
                        currentPage === totalPages ? "#4b5563" : "#d1d5db";
                    }}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pagination - Only shows on mobile */}
      {filteredRsvps.length > 0 && (
        <div
          className="mobile-only"
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "20px",
            border: "1px solid #374151",
            display: "none",
          }}
        >
          {/* Page info */}
          <div
            style={{
              fontSize: "0.875rem",
              color: "#9ca3af",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            Showing{" "}
            <strong style={{ color: "#f3f4f6" }}>{startIndex + 1}</strong>-
            <strong style={{ color: "#f3f4f6" }}>
              {Math.min(endIndex, filteredRsvps.length)}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "#f3f4f6" }}>{filteredRsvps.length}</strong>
          </div>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "#111827",
              color: "#f3f4f6",
              border: "1px solid #4b5563",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: "12px",
              fontWeight: "500",
            }}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>

          {/* Navigation buttons - Mobile friendly */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                flex: 1,
                padding: "12px",
                background: currentPage === 1 ? "#374151" : "#667eea",
                color: currentPage === 1 ? "#6b7280" : "white",
                border: "none",
                borderRadius: "8px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              ← Previous
            </button>

            <div
              style={{
                padding: "12px 20px",
                background: "#667eea",
                color: "white",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "80px",
                border: "2px solid #5568d3",
              }}
            >
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                flex: 1,
                padding: "12px",
                background: currentPage === totalPages ? "#374151" : "#667eea",
                color: currentPage === totalPages ? "#6b7280" : "white",
                border: "none",
                borderRadius: "8px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          padding: "32px 16px",
          marginTop: "40px",
          borderTop: "1px solid #374151",
        }}
      >
        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
          Developed by{" "}
          <a
            href="https://elitestack.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
          >
            EliteStack.co.uk
          </a>
        </p>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .desktop-pagination {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .mobile-only {
            display: block !important;
          }
          .mobile-filters-open {
            display: flex !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
