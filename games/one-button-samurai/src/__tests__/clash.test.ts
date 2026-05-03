import { describe, expect, it } from "vitest";
import { holdToAction, resolveClash } from "../clash";
import { TIMING } from "../constants";

describe("holdToAction", () => {
  it("maps timing windows correctly", () => {
    expect(holdToAction(0)).toBe("feint");
    expect(holdToAction(TIMING.feintMaxMs)).toBe("feint");
    expect(holdToAction(TIMING.feintMaxMs + 1)).toBe("strike");
    expect(holdToAction(TIMING.strikeMaxMs)).toBe("strike");
    expect(holdToAction(TIMING.strikeMaxMs + 1)).toBe("guard");
    expect(holdToAction(TIMING.guardMaxMs)).toBe("guard");
    expect(holdToAction(TIMING.guardMaxMs + 1)).toBe("danger");
    expect(holdToAction(1200)).toBe("danger");
    expect(holdToAction(null)).toBe("danger");
  });
});

describe("resolveClash", () => {
  it("strike beats feint", () => {
    const c = resolveClash("strike", "feint", 380);
    expect(c.outcome).toBe("win");
    expect(c.perfectStrike).toBe(true);
  });
  it("guard counters strike", () => {
    expect(resolveClash("guard", "strike", 1000).outcome).toBe("win");
    expect(resolveClash("guard", "strike", 1000).counter).toBe(true);
    expect(resolveClash("strike", "guard", 400).outcome).toBe("loss");
  });
  it("same actions draw", () => {
    expect(resolveClash("strike", "strike", 400).outcome).toBe("draw");
    expect(resolveClash("feint", "feint", 80).outcome).toBe("draw");
  });
  it("danger always loses for the player", () => {
    expect(resolveClash("danger", "strike", null).outcome).toBe("loss");
    expect(resolveClash("danger", "guard", null).outcome).toBe("loss");
    expect(resolveClash("danger", "feint", null).nerveBreak).toBe(true);
  });
  it("opponent danger always wins for the player", () => {
    expect(resolveClash("strike", "danger", 400).outcome).toBe("win");
  });
  it("feint vs guard is a no-contact draw", () => {
    expect(resolveClash("feint", "guard", 80).outcome).toBe("draw");
    expect(resolveClash("feint", "guard", 80).falseDraw).toBe(true);
  });
});
