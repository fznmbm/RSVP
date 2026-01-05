"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

export default function CheckInScanner() {
  const [manualCode, setManualCode] = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Load volunteer name from storage
    const saved = localStorage.getItem("volunteerName");
    if (saved) setVolunteerName(saved);

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scannerActive && typeof window !== "undefined") {
      // Dynamically import html5-qrcode
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        const html5QrCode = new Html5Qrcode("qr-reader");

        html5QrCode
          .start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              if (decodedText && !loading) {
                processCheckIn(decodedText);
              }
            },
            (error) => {
              // Ignore continuous scan errors
            }
          )
          .catch((err) => {
            console.error("Unable to start scanning", err);
          });

        return () => {
          html5QrCode.stop().catch((err) => console.error(err));
        };
      });
    }
  }, [scannerActive]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/rsvps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        const checkedInCount = data.data.filter((r) => r.checkedIn).length;
        const paidCount = data.data.filter(
          (r) => r.paymentStatus === "paid"
        ).length;
        setStats({
          checkedIn: checkedInCount,
          total: paidCount,
          percentage:
            paidCount > 0 ? Math.round((checkedInCount / paidCount) * 100) : 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const processCheckIn = async (code) => {
    if (!code || code === lastScannedCode) return; // Prevent duplicate scans

    setLastScannedCode(code);
    setLoading(true);
    setResult(null);

    try {
      // Save volunteer name
      if (volunteerName) {
        localStorage.setItem("volunteerName", volunteerName);
      }

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          volunteerName: volunteerName || "Volunteer",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: "success",
          message: data.message,
          data: data.data,
        });
        setManualCode("");
        fetchStats();

        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setResult(null);
          setLastScannedCode("");
        }, 3000);
      } else if (data.alreadyCheckedIn) {
        setResult({
          type: "warning",
          message: data.message,
          data: data.data,
        });
        setTimeout(() => {
          setResult(null);
          setLastScannedCode("");
        }, 4000);
      } else if (data.paymentPending) {
        setResult({
          type: "error",
          message: data.message,
          data: data.data,
        });
        setTimeout(() => {
          setResult(null);
          setLastScannedCode("");
        }, 4000);
      } else {
        setResult({
          type: "error",
          message: data.error || "Check-in failed",
        });
        setTimeout(() => {
          setResult(null);
          setLastScannedCode("");
        }, 3000);
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "Network error. Please try again.",
      });
      setTimeout(() => {
        setResult(null);
        setLastScannedCode("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setResult({ type: "error", message: "Please enter a code" });
      setTimeout(() => setResult(null), 2000);
      return;
    }
    processCheckIn(manualCode);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "20px",
            border: "1px solid #374151",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#f9fafb",
              marginBottom: "8px",
            }}
          >
            🎫 Check-In Scanner
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
            AHHC Family Get-Together 2026
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div
            style={{
              background: "#1f2937",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              border: "1px solid #374151",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                  Checked In
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#10b981",
                  }}
                >
                  {stats.checkedIn} / {stats.total}
                </div>
              </div>
              <div
                style={{
                  fontSize: "3rem",
                  fontWeight: "700",
                  color: "#667eea",
                }}
              >
                {stats.percentage}%
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "12px",
                background: "#374151",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${stats.percentage}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #10b981, #667eea)",
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        )}

        {/* Volunteer Name */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid #374151",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#f3f4f6",
              marginBottom: "8px",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Your Name (Volunteer)
          </label>
          <input
            type="text"
            value={volunteerName}
            onChange={(e) => setVolunteerName(e.target.value)}
            placeholder="Enter your name"
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

        {/* QR Scanner Toggle */}
        <div
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid #374151",
          }}
        >
          <button
            onClick={() => setScannerActive(!scannerActive)}
            style={{
              width: "100%",
              padding: "16px",
              background: scannerActive ? "#7f1d1d" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.125rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {scannerActive ? "📷 Close Camera" : "📷 Open Camera Scanner"}
          </button>

          {/* QR Scanner */}
          {scannerActive && (
            <div
              style={{
                marginTop: "16px",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#000",
              }}
            >
              <div
                id="qr-reader"
                style={{
                  width: "100%",
                  border: "none",
                }}
              />
              <p
                style={{
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                  padding: "12px",
                  margin: 0,
                  background: "#1f2937",
                }}
              >
                Point camera at QR code to scan
              </p>
            </div>
          )}
        </div>

        {/* Manual Code Entry */}
        <form
          onSubmit={handleManualSubmit}
          style={{
            background: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "20px",
            border: "1px solid #374151",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#f3f4f6",
              marginBottom: "12px",
              fontSize: "1rem",
              fontWeight: "600",
            }}
          >
            Or Enter Code Manually
          </label>

          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="AHHC..."
            style={{
              width: "100%",
              padding: "16px",
              background: "#111827",
              border: "2px solid #374151",
              borderRadius: "8px",
              color: "#f3f4f6",
              fontSize: "1.25rem",
              fontWeight: "600",
              outline: "none",
              textAlign: "center",
              letterSpacing: "2px",
              marginBottom: "16px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading ? "#4b5563" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.125rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "⏳ Processing..." : "✅ Check In"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div
            style={{
              background:
                result.type === "success"
                  ? "#064e3b"
                  : result.type === "warning"
                  ? "#78350f"
                  : "#7f1d1d",
              border: `2px solid ${
                result.type === "success"
                  ? "#10b981"
                  : result.type === "warning"
                  ? "#f59e0b"
                  : "#ef4444"
              }`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              {result.type === "success"
                ? "✅"
                : result.type === "warning"
                ? "⚠️"
                : "❌"}
            </div>

            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color:
                  result.type === "success"
                    ? "#10b981"
                    : result.type === "warning"
                    ? "#f59e0b"
                    : "#ef4444",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              {result.message}
            </div>

            {result.data && (
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    color: "#f3f4f6",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  {result.data.name}
                </div>
                {result.data.totalGuests && (
                  <div style={{ color: "#d1d5db", fontSize: "0.875rem" }}>
                    Guests: {result.data.totalGuests} people
                  </div>
                )}
                {result.data.checkInTime && (
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginTop: "4px",
                    }}
                  >
                    Time:{" "}
                    {new Date(result.data.checkInTime).toLocaleString("en-GB")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back to Admin */}
        <button
          onClick={() => router.push("/admin")}
          style={{
            width: "100%",
            padding: "12px",
            background: "#374151",
            color: "#f3f4f6",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          ← Back to Admin
        </button>
      </div>
    </div>
  );
}
