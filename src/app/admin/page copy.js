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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchRsvps();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
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
        setStatusDropdownOpen(null);
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

      // Update all selected RSVPs
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

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRsvps.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRsvps.map((r) => r._id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

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

  const getStatusBadge = (status, rsvpId) => {
    return (
      <select
        value={status}
        onChange={(e) => updatePaymentStatus(rsvpId, e.target.value)}
        style={{
          padding: "8px 16px",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "600",
          backgroundColor: "#374151",
          color: status === "pending" ? "#f59e0b" : "#10b981",
          border: "1px solid #4b5563",
          cursor: "pointer",
          outline: "none",
          minWidth: "130px",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "32px",
        }}
      >
        <option
          value="pending"
          style={{
            backgroundColor: "#ffffff",
            color: "#1f2937",
            padding: "10px",
          }}
        >
          ⏳ Pending
        </option>
        <option
          value="paid"
          style={{
            backgroundColor: "#ffffff",
            color: "#1f2937",
            padding: "10px",
          }}
        >
          ✅ Paid
        </option>
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
    <div style={{ minHeight: "100vh", background: "#111827", padding: "24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "24px 32px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            border: "1px solid #374151",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
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
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: "10px 20px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#5568d3")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#667eea")
              }
            >
              📥 Export CSV
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                background: "#374151",
                color: "#f3f4f6",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#4b5563")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#374151")
              }
            >
              Logout
            </button>
          </div>
        </div>

        {message.text && (
          <div
            style={{
              padding: "16px 24px",
              borderRadius: "12px",
              marginBottom: "24px",
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

        {/* Stats Cards */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #667eea",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Total RSVPs
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {stats.totalRsvps}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#10b981",
                  marginTop: "8px",
                  fontWeight: "600",
                }}
              >
                ↑ Active registrations
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #f59e0b",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Pending Payment
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {rsvps.filter((r) => r.paymentStatus === "pending").length}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                Awaiting confirmation
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #10b981",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Total Attendees
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {stats.totalPeople}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                All age groups
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #8b5cf6",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Total Revenue
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                £{stats.totalAmount}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                Expected collection
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #ec4899",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Under 5
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {stats.totalUnder5}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                Free tickets
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #06b6d4",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Age 5-12
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {stats.totalAge5to12}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                £10 each
              </div>
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                borderLeft: "4px solid #f97316",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                Age 12+
              </div>
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#f9fafb",
                }}
              >
                {stats.totalAge12plus}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "8px",
                  fontWeight: "500",
                }}
              >
                £15 each
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1", minWidth: "240px" }}>
              <input
                type="text"
                placeholder="🔍 Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
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
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                outline: "none",
                color: "#f3f4f6",
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
                padding: "10px 16px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                outline: "none",
                color: "#f3f4f6",
              }}
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="amount">Sort by Amount</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                padding: "10px 16px",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "0.875rem",
                background: "#111827",
                cursor: "pointer",
                fontWeight: "600",
                color: "#f3f4f6",
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
                  padding: "10px 16px",
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

          {selectedRows.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                background: "#1e3a8a",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #3b82f6",
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
                  Mark as Paid
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

        {/* Table */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                        selectedRows.length === filteredRsvps.length &&
                        filteredRsvps.length > 0
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
                      letterSpacing: "0.05em",
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
                      letterSpacing: "0.05em",
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
                      letterSpacing: "0.05em",
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
                      letterSpacing: "0.05em",
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
                      letterSpacing: "0.05em",
                      width: "80px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRsvps.length === 0 ? (
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
                  filteredRsvps.map((rsvp) => (
                    <tr
                      key={rsvp._id}
                      style={{
                        borderBottom: "1px solid #374151",
                        transition: "background 0.15s",
                        background: selectedRows.includes(rsvp._id)
                          ? "#1e3a8a"
                          : "#1f2937",
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedRows.includes(rsvp._id)) {
                          e.currentTarget.style.background = "#374151";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedRows.includes(rsvp._id)) {
                          e.currentTarget.style.background = "#1f2937";
                        }
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
                            gap: "12px",
                            justifyContent: "center",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "6px 12px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            Under 5: {rsvp.under5}
                          </span>
                          <span
                            style={{
                              padding: "6px 12px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            Age 5-12: {rsvp.age5to12}
                          </span>
                          <span
                            style={{
                              padding: "6px 12px",
                              background: "#374151",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              color: "#f3f4f6",
                              fontWeight: "600",
                            }}
                          >
                            Age 12+: {rsvp.age12plus}
                          </span>
                          <span
                            style={{
                              padding: "6px 12px",
                              background: "#10b981",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#374151";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
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

          {filteredRsvps.length > 0 && (
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #374151",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#111827",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                Showing{" "}
                <strong style={{ color: "#f3f4f6" }}>
                  {filteredRsvps.length}
                </strong>{" "}
                of <strong style={{ color: "#f3f4f6" }}>{rsvps.length}</strong>{" "}
                RSVPs
              </div>
              <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                Total Revenue:{" "}
                <strong style={{ color: "#10b981" }}>
                  £{stats?.totalAmount || 0}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
