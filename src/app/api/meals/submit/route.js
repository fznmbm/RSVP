import dbConnect from "../../../../lib/mongodb"; // 4 levels
import Rsvp from "../../../../models/Rsvp";

export async function POST(request) {
  try {
    await dbConnect();

    const { token, mealSelections, dietaryRestrictions } = await request.json();

    // Validate token
    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }

    // Find RSVP
    const rsvp = await Rsvp.findOne({ mealSelectionToken: token });

    if (!rsvp) {
      return Response.json({ error: "Invalid link" }, { status: 404 });
    }

    // Check deadline
    const now = new Date();
    if (now > rsvp.mealSelectionDeadline) {
      return Response.json({ error: "Deadline has passed" }, { status: 410 });
    }

    // Validate meal selections
    if (!mealSelections || !Array.isArray(mealSelections)) {
      return Response.json(
        { error: "Invalid meal selections" },
        { status: 400 }
      );
    }

    // Expected counts
    const expectedUnder5 = rsvp.under5;
    const expectedOver5 = rsvp.age5to12 + rsvp.age12plus;

    const under5Selections = mealSelections.filter(
      (m) => m.ageCategory === "under5"
    );
    const over5Selections = mealSelections.filter(
      (m) => m.ageCategory === "over5"
    );

    if (
      under5Selections.length !== expectedUnder5 ||
      over5Selections.length !== expectedOver5
    ) {
      return Response.json(
        { error: "Incomplete meal selections" },
        { status: 400 }
      );
    }

    // Update RSVP
    rsvp.mealSelections = mealSelections;
    rsvp.dietaryRestrictions = dietaryRestrictions || "";
    rsvp.mealSelectionComplete = true;
    rsvp.mealSelectionSubmittedAt = new Date();

    await rsvp.save();

    return Response.json({
      success: true,
      message: "Meal selections saved successfully",
    });
  } catch (error) {
    console.error("Submit meals error:", error);
    return Response.json(
      { error: "Failed to save selections" },
      { status: 500 }
    );
  }
}
