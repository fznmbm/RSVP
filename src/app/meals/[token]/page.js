"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MealSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [rsvpData, setRsvpData] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Meal selections state
  const [under5Meals, setUnder5Meals] = useState([]);
  const [over5Meals, setOver5Meals] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");

  // Verify token and load data
  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/meals/verify/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid link");
          setLoading(false);
          return;
        }

        setRsvpData(data.data);

        // Initialize meal selections with existing data or defaults
        const existingSelections = data.data.mealSelections || [];

        // Under 5 selections
        const under5Existing = existingSelections.filter(
          (m) => m.ageCategory === "under5"
        );
        const under5Array = [];
        for (let i = 0; i < data.data.under5; i++) {
          const existing = under5Existing.find((m) => m.personIndex === i + 1);
          under5Array.push(existing?.mealChoice || "nuggets-chips");
        }
        setUnder5Meals(under5Array);

        // Over 5 selections
        const over5Existing = existingSelections.filter(
          (m) => m.ageCategory === "over5"
        );
        const over5Count = data.data.age5to12 + data.data.age12plus;
        const over5Array = [];
        for (let i = 0; i < over5Count; i++) {
          const existing = over5Existing.find((m) => m.personIndex === i + 1);
          over5Array.push(existing?.mealChoice || "rice-curry");
        }
        setOver5Meals(over5Array);

        // Dietary restrictions
        setDietaryRestrictions(data.data.dietaryRestrictions || "");

        setLoading(false);
      } catch (err) {
        console.error("Verify error:", err);
        setError("Failed to load. Please try again.");
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build meal selections array
    const selections = [];

    // Under 5
    under5Meals.forEach((meal, index) => {
      selections.push({
        ageCategory: "under5",
        personIndex: index + 1,
        mealChoice: meal,
      });
    });

    // Over 5
    over5Meals.forEach((meal, index) => {
      selections.push({
        ageCategory: "over5",
        personIndex: index + 1,
        mealChoice: meal,
      });
    });

    setSubmitting(true);

    try {
      const response = await fetch("/api/meals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          mealSelections: selections,
          dietaryRestrictions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#9ca3af" }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
            <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</h2>
            <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
              Please contact AHHC if you need assistance.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#667eea",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted state
  if (rsvpData && rsvpData.mealSelectionComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "24px" }}>✅</div>
            <h2
              style={{
                color: "#10b981",
                fontSize: "1.5rem",
                marginBottom: "16px",
              }}
            >
              Already Submitted
            </h2>
            <p style={{ color: "#f3f4f6", marginBottom: "24px" }}>
              Thank you {rsvpData.name}! Your meal selections have already been
              confirmed.
            </p>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                border: "1px solid #374151",
                textAlign: "left",
              }}
            >
              <h3
                style={{
                  color: "#f9fafb",
                  fontSize: "1rem",
                  marginBottom: "16px",
                }}
              >
                📋 Your Selections
              </h3>

              {rsvpData.under5 > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Under 5 ({rsvpData.under5}):
                  </p>
                  {under5Meals.map((meal, i) => (
                    <div
                      key={i}
                      style={{
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        marginLeft: "16px",
                      }}
                    >
                      •{" "}
                      {meal === "nuggets-chips"
                        ? "🍗 Nuggets & Chips"
                        : "❌ Not Required"}
                    </div>
                  ))}
                </div>
              )}

              {(rsvpData.age5to12 > 0 || rsvpData.age12plus > 0) && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Over 5 ({rsvpData.age5to12 + rsvpData.age12plus}):
                  </p>
                  {over5Meals.map((meal, i) => (
                    <div
                      key={i}
                      style={{
                        color: "#f3f4f6",
                        fontSize: "0.875rem",
                        marginLeft: "16px",
                      }}
                    >
                      •{" "}
                      {meal === "rice-curry"
                        ? "🍛 Rice & Curry"
                        : "🍔 Burger Meal"}
                    </div>
                  ))}
                </div>
              )}

              {dietaryRestrictions && (
                <div>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Dietary Requirements:
                  </p>
                  <p
                    style={{
                      color: "#f3f4f6",
                      fontSize: "0.875rem",
                      marginLeft: "16px",
                    }}
                  >
                    {dietaryRestrictions}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
                border: "1px solid #374151",
              }}
            >
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                💡 Need to make changes? Please contact AHHC directly.
              </p>
            </div>

            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              See you on 17th January 2026! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "24px" }}>✅</div>
            <h2
              style={{
                color: "#10b981",
                fontSize: "1.5rem",
                marginBottom: "16px",
              }}
            >
              Success!
            </h2>
            <p style={{ color: "#f3f4f6", marginBottom: "24px" }}>
              Thank you {rsvpData.name}! Your meal selections have been
              confirmed.
            </p>

            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                border: "1px solid #374151",
              }}
            >
              <h3
                style={{
                  color: "#f9fafb",
                  fontSize: "1rem",
                  marginBottom: "16px",
                }}
              >
                📋 Your Selections
              </h3>

              {rsvpData.under5 > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Under 5 ({rsvpData.under5}):
                  </p>
                  {under5Meals.map((meal, i) => (
                    <div
                      key={i}
                      style={{ color: "#f3f4f6", fontSize: "0.875rem" }}
                    >
                      •{" "}
                      {meal === "nuggets-chips"
                        ? "🍗 Nuggets & Chips"
                        : "❌ Not Required"}
                    </div>
                  ))}
                </div>
              )}

              {(rsvpData.age5to12 > 0 || rsvpData.age12plus > 0) && (
                <div>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Over 5 ({rsvpData.age5to12 + rsvpData.age12plus}):
                  </p>
                  {over5Meals.map((meal, i) => (
                    <div
                      key={i}
                      style={{ color: "#f3f4f6", fontSize: "0.875rem" }}
                    >
                      •{" "}
                      {meal === "rice-curry"
                        ? "🍛 Rice & Curry"
                        : "🍔 Burger Meal"}
                    </div>
                  ))}
                </div>
              )}

              {dietaryRestrictions && (
                <div style={{ marginTop: "16px" }}>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                      marginBottom: "8px",
                    }}
                  >
                    Dietary Requirements:
                  </p>
                  <p style={{ color: "#f3f4f6", fontSize: "0.875rem" }}>
                    {dietaryRestrictions}
                  </p>
                </div>
              )}
            </div>

            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              See you on 17th January 2026! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  const totalOver5 = rsvpData.age5to12 + rsvpData.age12plus;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🍽️ Meal Selection</h1>
          <p style={styles.subtitle}>AHHC Family Get-Together 2026</p>
        </div>

        {/* Booking Info */}
        <div style={styles.section}>
          <div style={styles.infoCard}>
            <h3 style={styles.sectionTitle}>✅ Your Booking</h3>
            <p style={styles.name}>{rsvpData.name}</p>
            <div style={styles.bookingDetails}>
              <div style={styles.detailRow}>
                <span>Under 5:</span>
                <span>{rsvpData.under5}</span>
              </div>
              <div style={styles.detailRow}>
                <span>Age 5-12:</span>
                <span>{rsvpData.age5to12}</span>
              </div>
              <div style={styles.detailRow}>
                <span>Age 12+:</span>
                <span>{rsvpData.age12plus}</span>
              </div>
              <div style={{ ...styles.detailRow, ...styles.totalRow }}>
                <span>Total People:</span>
                <span>
                  {rsvpData.under5 + rsvpData.age5to12 + rsvpData.age12plus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Under 5 Selections */}
          {rsvpData.under5 > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                👶 Under 5 Children ({rsvpData.under5})
              </h3>
              <p style={styles.sectionDesc}>
                Select meal preference for each child under 5 years
              </p>

              {under5Meals.map((meal, index) => (
                <div key={index} style={styles.selectGroup}>
                  <label style={styles.label}>Child {index + 1}:</label>
                  <select
                    value={meal}
                    onChange={(e) => {
                      const newMeals = [...under5Meals];
                      newMeals[index] = e.target.value;
                      setUnder5Meals(newMeals);
                    }}
                    style={styles.select}
                    required
                  >
                    <option value="nuggets-chips">🍗 Nuggets & Chips</option>
                    <option value="not-required">❌ Not Required</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Over 5 Selections */}
          {totalOver5 > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                👨‍👩‍👧‍👦 Over 5 Years ({totalOver5})
              </h3>
              <p style={styles.sectionDesc}>
                Select meal preference for everyone age 5 and above
              </p>

              {over5Meals.map((meal, index) => (
                <div key={index} style={styles.selectGroup}>
                  <label style={styles.label}>Person {index + 1}:</label>
                  <select
                    value={meal}
                    onChange={(e) => {
                      const newMeals = [...over5Meals];
                      newMeals[index] = e.target.value;
                      setOver5Meals(newMeals);
                    }}
                    style={styles.select}
                    required
                  >
                    <option value="rice-curry">🍛 Rice & Curry</option>
                    <option value="burger-meal">🍔 Burger Meal</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Dietary Restrictions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📝 Dietary Requirements</h3>
            <p style={styles.sectionDesc}>
              Optional - e.g., allergies, vegetarian, halal, etc.
            </p>
            <textarea
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="Enter any dietary requirements or allergies..."
              style={styles.textarea}
              rows="4"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitButton,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "⏳ Submitting..." : "✅ Submit Meal Selections"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: "100vh",
    background: "#111827",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    maxWidth: "600px",
    width: "100%",
    background: "#1f2937",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
    border: "1px solid #374151",
    marginTop: "20px",
  },
  header: {
    padding: "32px 24px",
    borderBottom: "2px solid #374151",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "white",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    padding: "24px",
    borderBottom: "1px solid #374151",
  },
  infoCard: {
    background: "#111827",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #374151",
  },
  sectionTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: "8px",
  },
  sectionDesc: {
    fontSize: "0.875rem",
    color: "#9ca3af",
    marginBottom: "16px",
  },
  name: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#667eea",
    marginBottom: "16px",
  },
  bookingDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.875rem",
    color: "#d1d5db",
  },
  totalRow: {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #374151",
    fontWeight: "600",
    color: "#f3f4f6",
  },
  selectGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#f3f4f6",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "12px",
    background: "#111827",
    border: "1px solid #4b5563",
    borderRadius: "8px",
    color: "#f3f4f6",
    fontSize: "0.9rem",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    background: "#111827",
    border: "1px solid #4b5563",
    borderRadius: "8px",
    color: "#f3f4f6",
    fontSize: "0.9rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "0 0 16px 16px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
