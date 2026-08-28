import { useState, useRef, useEffect } from "react";

const INK = "#0B1220";
const PANEL = "#121B2E";
const AMBER = "#F5A623";
const CYAN = "#5FE3C9";
const TEXT = "#E9EEF7";
const MUTED = "#8FA0BC";

const SITE_URL = "https://forge-your-imagination.vercel.app";
const FREE_LEVELS = 2;
const BUILD_PRICE = "$4.99";
const SAVE_KEY = "forge_progress_v1";
const TOOLS_KEY = "forge_my_tools_v1";

const EXAMPLE_TOOLS = [
  {
    title: "Scam & Priority Message Detector",
    goal: "A tool that mass-reads all my unread texts and emails at once and sorts every message into genuinely important, safe to ignore, or dangerous scam/phishing",
  },
  {
    title: "Household & General Diagnostic",
    goal: "A general diagnostic tool where I describe symptoms of any household or car problem in plain language and it returns the most likely causes ranked by probability",
  },
  {
    title: "Bill, Contract & Agreement Checker",
    goal: "A tool that reads hospital bills, contracts, insurance policies, and terms of service and tells me in plain language what actually matters and what to watch out for",
  },
  {
    title: "Coupon & Deal Finder",
    goal: "A coupon and deal finder that takes any product or shopping list and finds working coupons, cash-back offers, and stackable discounts across major retailers",
  },
  {
    title: "Job Autofill",
    goal: "A job application tool that takes my existing resume, tailors it to each specific job listing, and then fills out the actual application form for me",
  },
];

async function askClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system }),
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.text || "";
}

function parseJSON(text) {
  const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

function Shell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${INK} 0%, #0E1830 100%)`,
        fontFamily: "'Inter', sans-serif",
        color: TEXT,
        padding: "28px 18px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        textarea { font-family: 'JetBrains Mono', monospace; }
      `}</style>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function Panel({ children }) {
  return (
    <div
      style={{
        background: PANEL,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "24px 20px",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ onClick, children, disabled, variant = "primary" }) {
  const styles = {
    primary: { background: AMBER, color: "#1A1200" },
    secondary: { background: "rgba(95,227,201,0.12)", color: CYAN, border: `1px solid ${CYAN}` },
    ghost: { background: "transparent", color: MUTED, border: "1px solid rgba(255,255,255,0.15)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "13px 20px",
        borderRadius: 12,
        border: "none",
        fontWeight: 700,
        fontSize: 15,
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

function saveFinishedTool(tool) {
  try {
    const raw = localStorage.getItem(TOOLS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      name: tool.name,
      description: tool.description,
      date: new Date().toISOString().slice(0, 10),
    });
    localStorage.setItem(TOOLS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}

export default function BuildWithCode() {
  const [phase, setPhase] = useState("onboarding");
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState(null);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState({});
  const [explanation, setExplanation] = useState("");
  const [levelCode, setLevelCode] = useState({});
  const [askText, setAskText] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [capstoneCode, setCapstoneCode] = useState("");
  const [capstoneWalkthrough, setCapstoneWalkthrough] = useState("");
  const [buildingCapstone, setBuildingCapstone] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [shareText, setShareText] = useState("");
  const [myTools, setMyTools] = useState([]);
  const consoleBuffer = useRef([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roadmap) setRoadmap(parsed.roadmap);
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.levelCode) setLevelCode(parsed.levelCode);
        if (parsed.unlocked) setUnlocked(true);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.roadmap) setPhase("roadmap");
      }
      const toolsRaw = localStorage.getItem(TOOLS_KEY);
      if (toolsRaw) setMyTools(JSON.parse(toolsRaw));
    } catch (e) {}

    const params = new URLSearchParams(window.location.search);
    const goalParam = params.get("goal");
    if (goalParam && !localStorage.getItem(SAVE_KEY)) {
      setGoal(goalParam);
    }

    const sessionId = params.get("session_id");
    if (sessionId) {
      setVerifyingPayment(true);
      fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.paid) setUnlocked(true);
        })
        .catch(() => {})
        .finally(() => {
          setVerifyingPayment(false);
          window.history.replaceState({}, "", window.location.pathname);
        });
    }
  }, []);

  useEffect(() => {
    if (!roadmap) return;
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ roadmap, completed, levelCode, unlocked, goal, experience })
      );
    } catch (e) {}
  }, [roadmap, completed, levelCode, unlocked, goal, experience]);

  async function generateRoadmap() {
    setError("");
    setPhase("generating");
    try {
      const system = `You design thorough, no-shortcuts coding curricula for total beginners who want to build ONE specific AI-powered tool and genuinely understand every line of it — not copy-paste it. Always respond with ONLY raw JSON, no markdown fences, no preamble. The JSON shape:
{
  "toolName": "short name for the specific tool this person will end up with",
  "toolDescription": "one sentence describing the real working tool they'll have built",
  "levels": [
    {
      "title": "short level title",
      "concept": "the one JS/coding concept this level teaches",
      "explanation": "4-6 sentences explaining the concept in plain language, zero jargon skipped-over, as if to someone who has never coded. Build real intuition, don't just define the term.",
      "whyItMatters": "1-3 sentences on why THIS concept specifically is a necessary piece of their final tool — not generic, tied to their actual idea",
      "commonMistake": "the single most common way a beginner gets this wrong, and why it goes wrong",
      "task": "a specific, concrete coding task for this level that builds a real piece of their final tool",
      "starterCode": "a short JavaScript starter snippet with a clear gap for them to fill in, plus comments",
      "hint": "one helpful hint if they get stuck",
      "explainPrompt": "a question asking them to explain, in their own words, what the code they just wrote actually does and why — this checks real understanding, not just working code"
    }
  ]
}
Generate 9-11 levels, ordered from easiest to hardest, each a real building block toward the final tool. Go deeper than a normal beginner course: cover variables/values, how functions actually execute, string/array/object basics as needed for their idea, control flow (if/loops) if relevant, how async code and fetch() actually work (not just "copy this"), error handling, and finally assembling the real AI-powered tool end to end. All code is JavaScript, since it runs directly and can call real AI APIs with fetch(). Keep starter code under 15 lines. Make every task genuinely about THEIR specific tool idea, never generic filler.`;
      const prompt = `Person's experience level: ${experience}. What they want to build: "${goal}". Design their personalized, thorough, no-shortcuts path toward one real, working, AI-powered tool that does this. They need to genuinely understand how it works, not just have it work.`;
      const text = await askClaude(prompt, system);
      const parsed = parseJSON(text);
      setRoadmap(parsed);
      setCode(parsed.levels[0].starterCode || "");
      setLevelIndex(0);
      setPhase("roadmap");
    } catch (e) {
      setError("Something went wrong generating your path. Try again.");
      setPhase("onboarding");
    }
  }

  function openLevel(i) {
    if (i >= FREE_LEVELS && !unlocked) {
      setPhase("paywall");
      return;
    }
    setLevelIndex(i);
    setCode(levelCode[i] || roadmap.levels[i].starterCode || "");
    setOutput("");
    setFeedback(null);
    setExplanation("");
    setAskText("");
    setAskAnswer("");
    setPhase("lesson");
  }

  function runCode() {
    consoleBuffer.current = [];
    const fakeConsole = { log: (...args) => consoleBuffer.current.push(args.map(String).join(" ")) };
    try {
      const fn = new Function("console", code);
      fn(fakeConsole);
      setOutput(consoleBuffer.current.join("\\n") || "(no output — try using console.log to see results)");
    } catch (e) {
      setOutput("Error: " + e.message);
    }
  }

  async function checkCode() {
    setChecking(true);
    setFeedback(null);
    try {
      const level = roadmap.levels[levelIndex];
      const system = `You are a thorough, no-shortcuts coding mentor reviewing a beginner's work for one lesson. You check TWO things: (1) does the code reasonably attempt and accomplish the task, and (2) does their written explanation show they actually understand what the code does and why, not just that it runs. Respond with ONLY raw JSON: {"passed": true|false, "feedback": "3-5 sentences, warm but honest and specific, in plain language. If the explanation is vague or just restates the code without showing understanding, say so and ask them to explain the 'why', not just the 'what'."}. Only pass if BOTH the code reasonably works AND the explanation shows genuine understanding. Do not let a correct-looking code pass with a hollow explanation.`;
      const prompt = `Task: ${level.task}\\nConcept being taught: ${level.concept}\\nWhy it matters: ${level.whyItMatters}\\nStudent's code:\\n${code}\\n\\nQuestion asked: ${level.explainPrompt}\\nStudent's explanation in their own words:\\n${explanation || "(nothing written)"}`;
      const text = await askClaude(prompt, system);
      const parsed = parseJSON(text);
      setFeedback(parsed);
      if (parsed.passed) {
        setCompleted((c) => ({ ...c, [levelIndex]: true }));
        setLevelCode((c) => ({ ...c, [levelIndex]: code }));
      }
    } catch (e) {
      setFeedback({ passed: false, feedback: "Couldn't reach the reviewer — try again in a moment." });
    }
    setChecking(false);
  }

  async function askMentor() {
    if (!askText.trim()) return;
    setAsking(true);
    setAskAnswer("");
    try {
      const level = roadmap.levels[levelIndex];
      const system = `You are a patient, precise coding mentor. The student is stuck on a specific lesson and asked a direct question. Answer their exact question clearly and concretely — reference their actual code where relevant. Keep it to 3-6 sentences. Never just hand them the finished solution outright; guide them to understand it, unless they explicitly ask for the answer, in which case give it plainly. Plain text only, no JSON.`;
      const prompt = `Lesson concept: ${level.concept}\\nTask: ${level.task}\\nStudent's current code:\\n${code}\\n\\nStudent's question: ${askText}`;
      const text = await askClaude(prompt, system);
      setAskAnswer(text.trim());
    } catch (e) {
      setAskAnswer("Couldn't reach the mentor — try again in a moment.");
    }
    setAsking(false);
  }

  async function buildCapstone() {
    setBuildingCapstone(true);
    setPhase("capstone");
    try {
      const solutionsList = roadmap.levels
        .map((lvl, i) => `Step ${i + 1} (${lvl.title}):\\n${levelCode[i] || ""}`)
        .join("\\n\\n");
      const system = `You are assembling a beginner's finished project from the individual code pieces they wrote across a course. Respond with ONLY raw JSON, no markdown fences: {"finalCode": "one complete, clean, working JavaScript file combining all their pieces into the final tool, with clear comments", "walkthrough": "a thorough section-by-section explanation (6-10 short paragraphs) of exactly how the finished tool works end to end, written so the student can explain it to someone else with full confidence — no hand-waving, no skipped steps", "conceptMap": "a bullet-style plain text list of every major coding concept they practiced, each followed by one sentence on where it appears in the finished tool"}`;
      const prompt = `Final tool: ${roadmap.toolName} — ${roadmap.toolDescription}\\n\\nHere are the pieces the student wrote across each step:\\n${solutionsList}\\n\\nAssemble these into one clean final tool, write the full walkthrough, and the concept map.`;
      const text = await askClaude(prompt, system);
      const parsed = parseJSON(text);
      setCapstoneCode(parsed.finalCode || "");
      setCapstoneWalkthrough(
        (parsed.walkthrough || "") +
          (parsed.conceptMap
            ? "\\n\\n---\\nWHAT YOU LEARNED (CONCEPT MAP)\\n" + parsed.conceptMap
            : "")
      );
      saveFinishedTool({
        name: roadmap.toolName,
        description: roadmap.toolDescription,
      });
      try {
        const toolsRaw = localStorage.getItem(TOOLS_KEY);
        if (toolsRaw) setMyTools(JSON.parse(toolsRaw));
      } catch (e) {}
    } catch (e) {
      setCapstoneCode("// Couldn't assemble automatically — your step-by-step code above is still yours to keep.");
      setCapstoneWalkthrough("");
    }
    setBuildingCapstone(false);
  }

  function downloadCapstone() {
    const name = (roadmap.toolName || "my-tool").replace(/\\s+/g, "-").toLowerCase();
    const blob = new Blob([capstoneCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".js";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHtmlRunner() {
    const name = (roadmap.toolName || "my-tool").replace(/\\s+/g, "-").toLowerCase();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${roadmap.toolName || "My Tool"}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.5; }
  h1 { font-size: 1.4rem; }
  pre { background: #0B1220; color: #5FE3C9; padding: 16px; border-radius: 12px; overflow: auto; font-size: 13px; }
  .note { color: #666; font-size: 14px; margin-bottom: 20px; }
</style>
</head>
<body>
  <h1>${roadmap.toolName || "My Tool"}</h1>
  <p class="note">You built this with Forge. The code below is yours forever. Open the browser console (F12) to see output if the tool uses console.log.</p>
  <pre id="code"></pre>
  <script>
    const code = ${JSON.stringify(capstoneCode)};
    document.getElementById("code").textContent = code;
    try {
      // eslint-disable-next-line no-new-func
      new Function(code)();
    } catch (e) {
      console.error(e);
    }
  </script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareTool() {
    const text = `I just built "${roadmap.toolName}" — an AI-powered tool I wrote myself from scratch. Forge taught me the exact path. First 2 steps free → ${SITE_URL}`;
    setShareText(text);
    if (navigator.share) {
      navigator.share({ text, title: "I built " + roadmap.toolName, url: SITE_URL }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareText(text + "  (copied!)");
      });
    }
  }

  function goToCheckout() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ roadmap, completed, levelCode, unlocked, goal, experience })
      );
    } catch (e) {}
  }

  function pickExample(exampleGoal) {
    setGoal(exampleGoal);
  }

  function resetToOnboarding() {
    localStorage.removeItem(SAVE_KEY);
    setPhase("onboarding");
    setGoal("");
    setExperience(null);
    setRoadmap(null);
    setCompleted({});
    setLevelCode({});
    setUnlocked(false);
    setCapstoneCode("");
    setCapstoneWalkthrough("");
    setShareText("");
  }

  // ---- ONBOARDING ----
  if (phase === "onboarding") {
    return (
      <Shell>
        <Panel>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>
            Build With Code
          </div>
          <div style={{ color: MUTED, marginBottom: 22, fontSize: 15, lineHeight: 1.5 }}>
            Not another tutorial. Tell us the real thing you want to build, and we'll teach you exactly
            the code you need — nothing else — until you've actually built it. You walk away with the
            tool and the skill.
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, letterSpacing: 0.5, marginBottom: 10 }}>
            OR PICK AN EXAMPLE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {EXAMPLE_TOOLS.map((ex) => (
              <button
                key={ex.title}
                onClick={() => pickExample(ex.goal)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: goal === ex.goal ? `1px solid ${AMBER}` : "1px solid rgba(255,255,255,0.1)",
                  background: goal === ex.goal ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)",
                  color: goal === ex.goal ? AMBER : TEXT,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {ex.title}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            What do you want your AI-powered tool to do?
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. a tool that reads my notes and turns them into a study quiz"
            rows={3}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: TEXT,
              fontSize: 15,
              resize: "vertical",
              marginBottom: 18,
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Have you coded before?</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["Never, zero", "A little", "Some experience"].map((opt) => (
              <button
                key={opt}
                onClick={() => setExperience(opt)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: experience === opt ? `1px solid ${CYAN}` : "1px solid rgba(255,255,255,0.15)",
                  background: experience === opt ? "rgba(95,227,201,0.12)" : "transparent",
                  color: experience === opt ? CYAN : MUTED,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {error && <div style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <Btn onClick={generateRoadmap} disabled={!goal.trim() || !experience}>
            Build my path →
          </Btn>
        </Panel>
        {myTools.length > 0 && (
          <Panel>
            <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, marginBottom: 10, letterSpacing: 0.5 }}>
              YOUR FINISHED TOOLS
            </div>
            {myTools.slice(0, 5).map((t, i) => (
              <div key={i} style={{ fontSize: 13.5, marginBottom: 8, color: TEXT }}>
                <strong>{t.name}</strong>
                <span style={{ color: MUTED }}> — {t.date}</span>
              </div>
            ))}
          </Panel>
        )}
      </Shell>
    );
  }

  if (phase === "generating") {
    return (
      <Shell>
        <Panel>
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚙️</div>
            <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>
              Designing your path...
            </div>
            <div style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
              Figuring out exactly what you need to learn to build this.
            </div>
          </div>
        </Panel>
      </Shell>
    );
  }

  if (phase === "roadmap" && roadmap) {
    const doneCount = Object.keys(completed).length;
    return (
      <Shell>
        {verifyingPayment && (
          <Panel>
            <div style={{ textAlign: "center", fontSize: 13.5, color: MUTED }}>Confirming your payment...</div>
          </Panel>
        )}
        <Panel>
          <div style={{ fontSize: 12, color: CYAN, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
            YOUR TOOL
          </div>
          <div className="display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            {roadmap.toolName}
          </div>
          <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.5 }}>{roadmap.toolDescription}</div>
        </Panel>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>
          {doneCount} of {roadmap.levels.length} steps complete · progress saved automatically
        </div>
        {roadmap.levels.map((lvl, i) => {
          const sequenceUnlocked = i === 0 || completed[i - 1];
          const paywalled = i >= FREE_LEVELS && !unlocked;
          return (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: completed[i] ? CYAN : sequenceUnlocked ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)",
                    border: `2px solid ${completed[i] ? CYAN : sequenceUnlocked ? AMBER : "rgba(255,255,255,0.15)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: completed[i] ? "#06251F" : sequenceUnlocked ? AMBER : MUTED,
                    flexShrink: 0,
                  }}
                >
                  {completed[i] ? "✓" : i + 1}
                </div>
                {i < roadmap.levels.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: completed[i] ? CYAN : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 18 }}>
                <Panel>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{lvl.title}</div>
                        {i < FREE_LEVELS && !completed[i] && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: CYAN, background: "rgba(95,227,201,0.1)", border: `1px solid ${CYAN}`, borderRadius: 100, padding: "2px 8px" }}>
                            FREE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{lvl.concept}</div>
                    </div>
                    {!completed[i] && (
                      <Btn variant="secondary" onClick={() => sequenceUnlocked && openLevel(i)} disabled={!sequenceUnlocked}>
                        {!sequenceUnlocked ? "Locked" : paywalled ? "Unlock" : "Start"}
                      </Btn>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          );
        })}
        {doneCount === roadmap.levels.length && (
          <Btn onClick={buildCapstone}>Build the real thing →</Btn>
        )}
      </Shell>
    );
  }

  if (phase === "paywall" && roadmap) {
    return (
      <Shell>
        <Panel>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔓</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            You've seen how it works
          </div>
          <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            The first {FREE_LEVELS} steps are free. Unlocking finishes <strong style={{ color: TEXT }}>{roadmap.toolName}</strong> and gives you the working tool, run guide, full walkthrough, concept map, and ownership forever.
          </div>
          <div
            style={{
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: 16,
              padding: "20px",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            <div className="display" style={{ fontSize: 34, fontWeight: 800, color: AMBER }}>{BUILD_PRICE}</div>
            <div style={{ fontSize: 13, color: MUTED }}>
              one time — keep the tool forever, no subscription
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, textAlign: "center" }}>
            Typical AI cost to complete a full build is roughly $0.15–0.40. You pay once and own it.
          </div>
          <a
            href="https://buy.stripe.com/4gMbJ3e8845LdgO190bsc00"
            onClick={goToCheckout}
            style={{
              display: "block",
              textAlign: "center",
              width: "100%",
              padding: "16px 20px",
              borderRadius: 18,
              background: AMBER,
              color: "#241326",
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Unlock & finish my tool
          </a>
          <button
            onClick={() => setPhase("roadmap")}
            style={{ background: "none", border: "none", color: MUTED, fontSize: 13, marginTop: 16, width: "100%", padding: 8 }}
          >
            ← back, not ready yet
          </button>
        </Panel>
      </Shell>
    );
  }

  if (phase === "lesson" && roadmap) {
    const level = roadmap.levels[levelIndex];
    return (
      <Shell>
        <button
          onClick={() => setPhase("roadmap")}
          style={{ background: "none", border: "none", color: MUTED, fontSize: 13, marginBottom: 14, padding: 0 }}
        >
          ← back to path
        </button>
        <Panel>
          <div style={{ fontSize: 12, color: CYAN, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
            STEP {levelIndex + 1} · {level.concept.toUpperCase()}
          </div>
          <div className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            {level.title}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: TEXT, marginBottom: 12 }}>
            {level.explanation}
          </div>
          {level.whyItMatters && (
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: CYAN, marginBottom: 12 }}>
              <strong>Why this matters for your tool:</strong> {level.whyItMatters}
            </div>
          )}
          {level.commonMistake && (
            <div
              style={{
                background: "rgba(255,107,107,0.06)",
                border: "1px solid rgba(255,107,107,0.25)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.5,
                marginBottom: 12,
                color: MUTED,
              }}
            >
              <strong style={{ color: "#FF9B9B" }}>Watch out:</strong> {level.commonMistake}
            </div>
          )}
          <div
            style={{
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <strong>Your task:</strong> {level.task}
          </div>
        </Panel>
        <Panel>
          <textarea
            className="mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "#080D18",
              color: CYAN,
              fontSize: 13.5,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 4, flexWrap: "wrap" }}>
            <Btn variant="ghost" onClick={runCode}>▶ Run</Btn>
          </div>
          {output && (
            <div
              className="mono"
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "#080D18",
                fontSize: 12.5,
                color: MUTED,
                whiteSpace: "pre-wrap",
              }}
            >
              {output}
            </div>
          )}
        </Panel>
        <Panel>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: MUTED }}>
            Stuck? Ask your mentor anything about this step
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              placeholder="Why doesn't my loop stop?"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: TEXT,
                fontSize: 13.5,
              }}
            />
            <Btn variant="ghost" onClick={askMentor} disabled={asking || !askText.trim()}>
              {asking ? "..." : "Ask"}
            </Btn>
          </div>
          {askAnswer && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: TEXT,
              }}
            >
              {askAnswer}
            </div>
          )}
        </Panel>
        <Panel>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {level.explainPrompt}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>
            Explain it like you're teaching someone else — this is what actually locks it in.
          </div>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            placeholder="In your own words, what does this code do and why?"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: TEXT,
              fontSize: 14,
              resize: "vertical",
              marginBottom: 12,
            }}
          />
          <Btn variant="secondary" onClick={checkCode} disabled={checking || !explanation.trim()}>
            {checking ? "Reviewing..." : "Check my work"}
          </Btn>
          {feedback && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: feedback.passed ? "rgba(95,227,201,0.1)" : "rgba(255,107,107,0.08)",
                border: `1px solid ${feedback.passed ? CYAN : "#FF6B6B"}`,
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              {feedback.feedback}
            </div>
          )}
          {feedback?.passed && (
            <Btn onClick={() => setPhase("roadmap")}>Nice — back to path</Btn>
          )}
          {!feedback?.passed && level.hint && (
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 10 }}>Hint: {level.hint}</div>
          )}
        </Panel>
      </Shell>
    );
  }

  if (phase === "capstone" && roadmap) {
    if (buildingCapstone) {
      return (
        <Shell>
          <Panel>
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔧</div>
              <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>
                Assembling your tool...
              </div>
              <div style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
                Combining every piece you wrote into one finished, working tool.
              </div>
            </div>
          </Panel>
        </Shell>
      );
    }
    return (
      <Shell>
        <Panel>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏁</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            You built {roadmap.toolName}
          </div>
          <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
            Most people never go from zero to a working tool. You just did. Every piece below is code
            you personally wrote and explained — not copy-paste. This is yours forever. No subscription.
            No lock-in.
          </div>
        </Panel>
        {capstoneWalkthrough && (
          <Panel>
            <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, marginBottom: 10, letterSpacing: 0.5 }}>
              HOW IT WORKS + WHAT YOU LEARNED
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.7, color: TEXT, whiteSpace: "pre-wrap" }}>
              {capstoneWalkthrough}
            </div>
          </Panel>
        )}
        {capstoneCode && (
          <Panel>
            <div style={{ fontSize: 13, fontWeight: 700, color: AMBER, marginBottom: 10, letterSpacing: 0.5 }}>
              YOUR FINISHED TOOL
            </div>
            <div
              className="mono"
              style={{
                background: "#080D18",
                borderRadius: 10,
                padding: 14,
                fontSize: 12.5,
                color: CYAN,
                whiteSpace: "pre-wrap",
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {capstoneCode}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <Btn onClick={downloadCapstone}>⬇ Download .js</Btn>
              <Btn variant="secondary" onClick={downloadHtmlRunner}>⬇ Download HTML runner</Btn>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
              <strong style={{ color: TEXT }}>How to run later:</strong> Open the HTML file in any browser,
              or run the .js file with Node. The code is yours — no account, no API key from us required
              after this.
            </div>
          </Panel>
        )}
        <Panel>
          <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, marginBottom: 8, letterSpacing: 0.5 }}>
            SHOW SOMEONE WHAT YOU JUST BUILT
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>
            You went from zero to a real working tool. Share it — and send people to the free first steps.
          </div>
          <Btn variant="secondary" onClick={shareTool}>Share what I built</Btn>
          {shareText && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                fontSize: 13,
                lineHeight: 1.5,
                color: TEXT,
              }}
            >
              {shareText}
            </div>
          )}
        </Panel>
        <div style={{ fontSize: 12.5, color: MUTED, textAlign: "center", marginBottom: 16 }}>
          Typical AI cost for a full build: ~$0.15–0.40. You paid $4.99 once and own it forever.
        </div>
        <Btn variant="ghost" onClick={resetToOnboarding}>
          Build another tool
        </Btn>
      </Shell>
    );
  }

  return null;
}
