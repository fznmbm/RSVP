"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    under5: 0,
    age5to12: 0,
    age12plus: 0,
    paymentReference: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Deadline state
  const [deadlineInfo, setDeadlineInfo] = useState(null);
  const [loadingDeadline, setLoadingDeadline] = useState(true);

  // Fetch deadline and attendee info
  useEffect(() => {
    fetchDeadlineInfo();
  }, []);

  const fetchDeadlineInfo = async () => {
    try {
      const response = await fetch("/api/attendees");
      const data = await response.json();
      setDeadlineInfo(data);
    } catch (error) {
      console.error("Failed to fetch deadline info:", error);
    } finally {
      setLoadingDeadline(false);
    }
  };

  const calculateTotal = () => {
    return formData.age5to12 * 10 + formData.age12plus * 15;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("age") || name.includes("under")
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "RSVP submitted successfully! Please make your payment and send the receipt to Br Irshan (07892804448).",
        });
        setFormData({
          name: "",
          phone: "",
          email: "",
          under5: 0,
          age5to12: 0,
          age12plus: 0,
          paymentReference: "",
          notes: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to submit RSVP",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();
  const deadlinePassed = deadlineInfo?.deadlinePassed || false;
  //const deadlinePassed = "2026-01-01T22:00:00.000Z" < new Date().toISOString();

  if (loadingDeadline) {
    return (
      <div
        style={{
          background: "#111827",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#111827",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#1f2937",
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid #374151",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "20px" }}>
            <img
              src="/logo.png"
              alt="AHHC Logo"
              style={{
                width: "25%",
                height: "25%",
                objectFit: "cover",
              }}
            />
          </div>

          <h1
            style={{
              color: "#667eea",
              fontSize: "1.75rem",
              marginBottom: "8px",
              fontWeight: "700",
            }}
          >
            AHHC Family Get-Together 2026
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "1rem",
              margin: 0,
            }}
          >
            Akurana Helping Hands Crawley
          </p>
        </div>

        {/* Event Details Box */}
        <div
          style={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              color: "#f3f4f6",
              fontSize: "1.125rem",
              marginTop: 0,
              marginBottom: "16px",
              fontWeight: "600",
            }}
          >
            📅 Event Details
          </h3>
          <p style={{ color: "#d1d5db", margin: "8px 0", fontSize: "0.9rem" }}>
            <strong style={{ color: "#f3f4f6" }}>Date:</strong> Saturday, 17th
            January 2026
          </p>
          <p style={{ color: "#d1d5db", margin: "8px 0", fontSize: "0.9rem" }}>
            <strong style={{ color: "#f3f4f6" }}>Time:</strong> 1:00 PM - 8:00
            PM
          </p>
          <p style={{ color: "#d1d5db", margin: "8px 0", fontSize: "0.9rem" }}>
            <strong style={{ color: "#f3f4f6" }}>Venue:</strong> St Wilfred
            School, Crawley
          </p>

          <p
            style={{
              marginTop: "16px",
              fontWeight: "700",
              color: "#f59e0b",
              fontSize: "0.9rem",
            }}
          >
            ⏰ Payment Deadline:{" "}
            {new Date(deadlineInfo.deadline).toLocaleString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Deadline Passed Message + Attendee List */}
        {deadlinePassed ? (
          <>
            {/* Deadline Passed Alert */}
            <div
              style={{
                background: "#7f1d1d",
                border: "2px solid #ef4444",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏰</div>
              <h2
                style={{
                  color: "#fca5a5",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  marginTop: 0,
                }}
              >
                RSVP Deadline Has Passed
              </h2>
              <p
                style={{
                  color: "#fecaca",
                  fontSize: "1rem",
                  margin: 0,
                }}
              >
                Unfortunately, we are no longer accepting RSVPs.
                <br />
                Registration closed on{" "}
                <strong>
                  {new Date(deadlineInfo.deadline).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </p>
            </div>

            {/* Attendee List */}
            <div
              style={{
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <h3
                  style={{
                    color: "#f3f4f6",
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    margin: 0,
                  }}
                >
                  👥 Confirmed Attendees
                </h3>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: "#10b981",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                    }}
                  >
                    {deadlineInfo.stats.totalPeople} People
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    {deadlineInfo.stats.totalFamilies} Families
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {deadlineInfo.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      background: "#1f2937",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      border: "1px solid #374151",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#374151",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#f3f4f6",
                          fontWeight: "700",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {attendee.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            color: "#f3f4f6",
                            fontWeight: "600",
                            fontSize: "1rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {attendee.name}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                          Registered:{" "}
                          {new Date(attendee.registeredDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        background: "#10b981",
                        borderRadius: "6px",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {attendee.totalGuests}{" "}
                      {attendee.totalGuests === 1 ? "person" : "people"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Payment Details Box */}
            <div
              style={{
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#f3f4f6",
                  fontSize: "1.125rem",
                  marginTop: 0,
                  marginBottom: "16px",
                  fontWeight: "600",
                }}
              >
                💳 Payment Details
              </h3>
              <p
                style={{
                  color: "#d1d5db",
                  margin: "8px 0",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ color: "#f3f4f6" }}>Bank:</strong> HSBC
              </p>
              <p
                style={{
                  color: "#d1d5db",
                  margin: "8px 0",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ color: "#f3f4f6" }}>Account Name:</strong>{" "}
                Akurana Helping Hands Crawley UK
              </p>
              <p
                style={{
                  color: "#d1d5db",
                  margin: "8px 0",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ color: "#f3f4f6" }}>Account No:</strong>{" "}
                92155494
              </p>
              <p
                style={{
                  color: "#d1d5db",
                  margin: "8px 0",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ color: "#f3f4f6" }}>Sort Code:</strong>{" "}
                40-18-22
              </p>
              <p
                style={{
                  color: "#d1d5db",
                  margin: "8px 0",
                  fontSize: "0.9rem",
                }}
              >
                <strong style={{ color: "#f3f4f6" }}>Reference:</strong> Your
                name
              </p>

              <p
                style={{
                  marginTop: "8px",
                  fontWeight: "700",
                  color: "#f59e0b",
                  fontSize: "0.9rem",
                }}
              >
                After payment, send receipt to Br Irshan: 07892804448
              </p>
            </div>

            {/* Alert Message */}
            {message.text && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  background:
                    message.type === "success" ? "#064e3b" : "#7f1d1d",
                  color: message.type === "success" ? "#10b981" : "#ef4444",
                  border: `1px solid ${
                    message.type === "success" ? "#10b981" : "#ef4444"
                  }40`,
                  fontSize: "0.9rem",
                }}
              >
                {message.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Phone Number */}
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
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="07XXX XXXXXX"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
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
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tickets */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#f3f4f6",
                    marginBottom: "12px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Number of Tickets *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* Under 5 */}
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "8px",
                      }}
                    >
                      Under 5
                    </label>
                    <div
                      style={{
                        color: "#10b981",
                        fontSize: "1.125rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      FREE
                    </div>
                    <input
                      type="number"
                      name="under5"
                      min="0"
                      value={formData.under5}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        color: "#f3f4f6",
                        fontSize: "1rem",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Age 5-12 */}
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "8px",
                      }}
                    >
                      Age 5 - 12
                    </label>
                    <div
                      style={{
                        color: "#667eea",
                        fontSize: "1.125rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      £10
                    </div>
                    <input
                      type="number"
                      name="age5to12"
                      min="0"
                      value={formData.age5to12}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        color: "#f3f4f6",
                        fontSize: "1rem",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Age 12+ */}
                  <div
                    style={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "8px",
                      }}
                    >
                      Age 12+
                    </label>
                    <div
                      style={{
                        color: "#667eea",
                        fontSize: "1.125rem",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      £15
                    </div>
                    <input
                      type="number"
                      name="age12plus"
                      min="0"
                      value={formData.age12plus}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        color: "#f3f4f6",
                        fontSize: "1rem",
                        textAlign: "center",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              {totalAmount > 0 && (
                <div
                  style={{
                    background: "#111827",
                    border: "2px solid #667eea",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    Total Amount to Pay
                  </div>
                  <div
                    style={{
                      color: "#10b981",
                      fontSize: "2rem",
                      fontWeight: "700",
                    }}
                  >
                    £{totalAmount}
                  </div>
                </div>
              )}

              {/* Payment Reference */}
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
                  Payment Reference (Your Name)
                </label>
                <input
                  type="text"
                  name="paymentReference"
                  value={formData.paymentReference}
                  onChange={handleChange}
                  placeholder="Name used in bank transfer"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    color: "#f3f4f6",
                    marginBottom: "8px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special requirements or dietary restrictions..."
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading ? "#4b5563" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#5568d3";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#667eea";
                }}
              >
                {loading ? "Submitting..." : "🎫 Submit RSVP"}
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "0.875rem",
          }}
        >
          <p style={{ margin: "8px 0" }}>⚠️ This event is for members only</p>
          <p style={{ margin: "8px 0" }}>
            <a
              href="/admin/login"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Admin Login
            </a>
          </p>

          <p
            style={{
              margin: "16px 0 0 0",
              paddingTop: "16px",
              borderTop: "1px solid #374151",
            }}
          >
            Designed & Developed by{" "}
            <a
              href="https://elitestack.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#667eea",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              EliteStack.co.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
