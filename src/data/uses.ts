/*
 * The five "What it's for" pages (/for/<id>), one per use of the system, in the order the site tells
 * the story (copy.md: positioning pass). The header menu, the phone sheet, the home accordion and the
 * footer link here. src/pages/for/[use].astro renders every entry with the HOME PAGE's own building
 * blocks (owner, 2026-09-27: these pages must look like the home page): a full-view navy hero with the
 * home H1 size and the "Runs with" marquee, a feature accordion beside real app captures, the illustrated
 * steps row on navy, a split "good to know" band, resource-style cards to the other uses, light footer.
 * Wording limits (copy.md builder notes and the evidence table): "lists its sources", never "cites";
 * sources appear only when documents were retrieved; explanations, summaries and practice questions are
 * things a student asks the chat for, not features; "agentic coding" is a training subject run on the
 * app's agents, never a claim that Mission LLM is a coding tool; "stays in the building" always sits next
 * to its condition (a local model runtime); the manager role is server-wide; no LMS or study-feature
 * claims; roadmap items say "in development"; no standalone "AI" in a Clash Display heading.
 * Captures: every alt describes the real capture (public/images/product); SHOTS holds one alt per file.
 */
import { COUNTS, TELEMETRY_ENV } from "./site";

export type ShotName =
  | "hero"
  | "grounded"
  | "feature-documents"
  | "feature-workspaces"
  | "feature-users"
  | "feature-agents"
  | "feature-models"
  | "security"
  | "security-offline"
  | "security-roles"
  | "security-history"
  | "security-telemetry";

/** One alt text per capture, describing what the capture shows. */
export const SHOTS: Record<ShotName, string> = {
  hero: "A Lab 2 prep thread in an Intro to Ecology workspace: two answers drawn from the lab handout and the readings, each with its documents listed under it.",
  grounded:
    "A student's answer about energy flow and the nitrogen cycle, with the Sources panel open: each course reading it drew on, a passage from it and its match score.",
  "feature-documents":
    "A student's question about carrying capacity in a course workspace, answered from the readings, with each reading listed under the answer.",
  "feature-workspaces":
    "A learner's Spanish Practice workspace with one thread per topic, and two answers drawn from the learner's own grammar notes.",
  "feature-users":
    "The Users page as an instructor with the manager role sees it: the admin, the instructor and the student accounts, each with its role.",
  "feature-agents":
    "The Agent Skills settings: skills an admin switches on or off, such as document creation, charts and a SQL connector, plus custom skills, agent flows and MCP servers.",
  "feature-models":
    "A course workspace's Chat Settings: its own model provider, the Agent, Chat and Query modes, its system prompt and its Query mode refusal response.",
  security: "The Event Logs page: sign-ins, a failed sign-in, an uploaded document, a new user and an invite, each with the user and the time.",
  "security-offline": "The LLM Preference page, set to an OpenAI-compatible model server on the same machine (127.0.0.1).",
  "security-roles": "The Members tab of a course workspace, listing the students added to it, each with the default role.",
  "security-history":
    "The Workspace Chats page as an instructor sees it: each question with the student who sent it, the workspace, the answer and the time, with an Export menu.",
  "security-telemetry":
    "The Privacy & Data-Handling page with the anonymous telemetry switch off, and the vectors kept in the built-in LanceDB store on the instance.",
};

export type UseFeature = { id: string; title: string; body: string; html?: string; image: ShotName; link?: { href: string; label: string } };

export type Use = {
  id: string;
  /** Menu and card title, e.g. "Classrooms". */
  title: string;
  meta: { title: string; description: string };
  /** Hero: eyebrow, a short home-size H1, the lead and the capture shown beside it. */
  eyebrow: string;
  heading: string;
  lead: string;
  image: ShotName;
  /** "What it gives you": the accordion's heading and five items, each with its own capture. */
  featuresTitle: string;
  features: UseFeature[];
  /** "How it works": the steps row's heading and three steps, each with an isometric drawing. */
  stepsTitle: string;
  steps: { title: string; body: string; art: string }[];
  /** "Good to know": the band's heading, the facts to know before relying on it and one link out. */
  notesTitle: string;
  notes: string[];
  more: { href: string; label: string };
};

const telemetryHtml = `Set <code>${TELEMETRY_ENV.replace(/"/g, "&quot;")}</code> before the first start and no usage events are sent. Or turn it off in Settings.`;

export const USES: Use[] = [
  {
    id: "classrooms",
    title: "Classrooms",
    meta: {
      title: "Mission LLM for classrooms | A course assistant on your own hardware",
      description:
        "A course assistant for the whole class that answers from the course readings and lists its sources, running on your school's own hardware.",
    },
    eyebrow: "For classrooms",
    heading: "A course assistant for every class.",
    lead: "Put the course readings in a workspace and your students ask questions in plain language. Mission LLM answers from those readings on your own hardware and lists the sources it used under the answer.",
    image: "feature-documents",
    featuresTitle: "Everything the course assistant needs.",
    features: [
      {
        id: "sources",
        title: "Sources listed",
        body: "When passages from the readings were retrieved, the documents are listed under the answer. Open Sources to read each passage and how closely it matched.",
        image: "grounded",
        link: { href: "/#grounded", label: "How grounded answers work" },
      },
      {
        id: "readings",
        title: "The course readings",
        body: "PDFs, Word files, slides, spreadsheets and scanned handouts with OCR. Pin the syllabus so the model sees its full text on every question.",
        image: "feature-documents",
      },
      {
        id: "prompt",
        title: "Prompt and mode",
        body: "Set the course's system prompt, choose Query mode to answer only from the readings, and write the reply for questions they do not cover.",
        image: "feature-models",
      },
      {
        id: "members",
        title: "Only your students",
        body: "In multi-user mode, students see only the course workspaces they are added to, and a per-user daily message limit keeps the hardware fair.",
        image: "security-roles",
        link: { href: "/security#controls-access", label: "Learn more about access" },
      },
      {
        id: "local",
        title: "A local model",
        body: "Run the model with Ollama, LM Studio or another local runtime, and the questions and readings stay in the building.",
        image: "security-offline",
        link: { href: "/security#outbound", label: "Every outbound connection" },
      },
    ],
    stepsTitle: "From readings to answers in three steps.",
    steps: [
      {
        title: "Add the readings",
        body: "Upload the course's documents to its workspace. They are parsed, embedded and stored on your server.",
        art: "images/steps/documents.svg",
      },
      {
        title: "Students ask",
        body: "Each student signs in with their own account and asks in the course workspace, in threads of their own.",
        art: "images/install/open-app.svg",
      },
      {
        title: "Sources are listed",
        body: "The answer lists the readings it drew on, so students can check the passage before they rely on it.",
        art: "images/menu/students.svg",
      },
    ],
    notesTitle: "Good to know.",
    notes: [
      "Admins and managers can read workspace chats, with who sent each one. Tell your students.",
      "Sources are listed only when documents were retrieved for that question.",
      "Numbered inline citations and page references are in development.",
    ],
    more: { href: "/security", label: "Read the security overview" },
  },
  {
    id: "students",
    title: "Students",
    meta: {
      title: "Mission LLM for students | Study help from the assigned material",
      description:
        "Study help drawn from the assigned material: explanations, summaries and practice questions from the readings in your course workspace, on hardware your school or you control.",
    },
    eyebrow: "For students",
    heading: "Study help from your readings.",
    lead: "Ask for an explanation, a summary or practice questions, and the answer draws on the readings in your course workspace. Independent learners can run the whole system on their own computer.",
    image: "feature-workspaces",
    featuresTitle: "Study with the material you were assigned.",
    features: [
      {
        id: "ask",
        title: "Explanations",
        body: "Ask in plain language, as often as you need. The answer draws on the workspace's documents and lists the ones it used.",
        image: "hero",
      },
      {
        id: "threads",
        title: "One thread per topic",
        body: "Keep each topic in its own thread, and fork a thread to try another direction without losing the original.",
        image: "feature-workspaces",
      },
      {
        id: "check",
        title: "Check the sources",
        body: "Ask for practice questions from a reading, then open Sources to check your answers against the passages.",
        image: "grounded",
        link: { href: "/#grounded", label: "How grounded answers work" },
      },
      {
        id: "modes",
        title: "Chat or Query mode",
        body: "Chat mode adds the model's general knowledge. Query mode answers only from the documents in the workspace.",
        image: "feature-models",
      },
      {
        id: "own",
        title: "On your own computer",
        body: "Install it with Docker, add your own notes and readings, and pair it with a local runtime such as Ollama or LM Studio.",
        image: "security-offline",
        link: { href: "/download", label: "Run it on your own computer" },
      },
    ],
    stepsTitle: "Start studying in three steps.",
    steps: [
      {
        title: "Open your workspace",
        body: "Sign in and pick a course workspace your instructor added you to, or create your own if you run it yourself.",
        art: "images/install/open-app.svg",
      },
      {
        title: "Ask about the reading",
        body: "Ask for an explanation, a summary or practice questions, one topic per thread.",
        art: "images/steps/documents.svg",
      },
      {
        title: "Check the sources",
        body: "Read the passages an answer drew on before you rely on it. A model can be wrong.",
        art: "images/menu/students.svg",
      },
    ],
    notesTitle: "Good to know.",
    notes: [
      "On a school install, admins and managers can read workspace chats.",
      "A model can be wrong. Check the listed sources before you rely on an answer.",
      "Explanations, summaries and practice questions are things you ask the chat for, not separate tools.",
    ],
    more: { href: "/download", label: "Install it yourself" },
  },
  {
    id: "courses",
    title: "Teaching a course",
    meta: {
      title: "Mission LLM for teaching a course | A workspace per course",
      description:
        "Build a workspace for each course from the syllabus, readings and handouts, invite your students into it, and review how they use it, on your school's own hardware.",
    },
    eyebrow: "For teaching a course",
    heading: "One workspace for every course.",
    lead: "Build a workspace from the syllabus, readings and handouts, invite your students into it, and review how they use it. The course material stays on the hardware your school runs.",
    image: "feature-users",
    featuresTitle: "Run the course, not the software.",
    features: [
      {
        id: "workspace",
        title: "The course workspace",
        body: "The syllabus, readings and handouts in one workspace, plus GitHub, GitLab or Gitea repositories, websites and YouTube transcripts.",
        image: "feature-documents",
      },
      {
        id: "invite",
        title: "Invite your students",
        body: "Invitations carry the course workspaces, so each student lands in the right course. Suspend an account at any time.",
        image: "feature-users",
      },
      {
        id: "members",
        title: "Course members",
        body: "Each workspace lists its members. Students with the default role see only the workspaces they are added to.",
        image: "security-roles",
        link: { href: "/security#controls-access", label: "Learn more about access" },
      },
      {
        id: "review",
        title: "Chat review and export",
        body: "Read the course's chats with who sent each one, and export them as CSV, JSON or JSONL.",
        image: "security-history",
        link: { href: "/security#controls-oversight", label: "Learn more about oversight" },
      },
      {
        id: "tune",
        title: "Tune the assistant",
        body: "Each workspace has its own model, chat mode, system prompt and refusal reply, and its own similarity threshold and passage count.",
        image: "feature-models",
      },
    ],
    stepsTitle: "Set up a course in three steps.",
    steps: [
      {
        title: "Create the workspace",
        body: "Name it after the course and add the syllabus, readings and handouts, or connect a repository or a website.",
        art: "images/install/course-documents.svg",
      },
      {
        title: "Invite your students",
        body: "Send invitations that carry the course workspace, so every student lands in the right course.",
        art: "images/steps/team.svg",
      },
      {
        title: "Review and adjust",
        body: "Read how the class uses it, then tune the prompt, the mode and the documents.",
        art: "images/install/access.svg",
      },
    ],
    notesTitle: "Good to know.",
    notes: [
      "The manager role is server-wide: a manager can open every workspace, not only their own courses.",
      "Roles scoped to a single workspace are in development.",
      "An embedded chat widget does not ask visitors to sign in, so give it only public course material.",
    ],
    more: { href: "/#steps", label: "See the setup from install to invite" },
  },
  {
    id: "instructors",
    title: "Training instructors",
    meta: {
      title: "Mission LLM for training instructors | AI workflows on a local model",
      description:
        "Teach faculty modern AI workflows, agentic coding included, on the app's agents, skills and MCP servers with a local model on your own hardware.",
    },
    eyebrow: "For training instructors",
    heading: "Train faculty on agents.",
    lead: "Run workshops on modern AI workflows, agentic coding included, with a local model on your own hardware. Admins decide which skills and MCP servers are on, so the training environment is one you control.",
    image: "feature-agents",
    featuresTitle: "A training lab you control.",
    features: [
      {
        id: "skills",
        title: "Skills and MCP servers",
        body: "Switch built-in skills on or off, add custom skills, chain steps in the no-code flow builder, and connect MCP servers over stdio, SSE or streamable HTTP.",
        image: "feature-agents",
        link: { href: "/security#controls-integrations", label: "See the agent controls" },
      },
      {
        id: "coding",
        title: "Agentic coding",
        body: "Show how agents plan, call tools and work with files. The filesystem skill (Docker installs) works in a folder under the server's storage.",
        image: "feature-agents",
      },
      {
        id: "local",
        title: "A local model",
        body: "Ollama, LM Studio, LocalAI, KoboldCPP, NVIDIA NIM or any OpenAI-compatible server, on hardware you run.",
        image: "security-offline",
      },
      {
        id: "agent-model",
        title: "A model per workspace",
        body: "Give each workshop workspace, and its agents, their own provider and model.",
        image: "feature-models",
      },
      {
        id: "accounts",
        title: "Participant accounts",
        body: "Invite each instructor, then review the workshop chats and the admin event log.",
        image: "feature-users",
      },
    ],
    stepsTitle: "Run a workshop in three steps.",
    steps: [
      {
        title: "Turn on the skills",
        body: "Switch on the built-in skills the workshop needs: document search, summaries, charts, file creation and SQL.",
        art: "images/install/telemetry-off.svg",
      },
      {
        title: "Connect MCP servers",
        body: "Add Model Context Protocol servers to give agents the tools your workshop teaches.",
        art: "images/steps/model.svg",
      },
      {
        title: "Hand a task to an agent",
        body: "Type @agent, or use Automatic mode with a model that supports tool calling, and follow each tool call in the chat.",
        art: "images/install/open-app.svg",
      },
    ],
    notesTitle: "Good to know.",
    notes: [
      "Mission LLM is not a code editor. Agentic coding is what the training covers, run on the app's agents.",
      "Web search and cloud models connect out only when you configure them.",
      "Agents work best with a model that supports tool calling.",
    ],
    more: { href: "/security#controls-integrations", label: "See the agent controls" },
  },
  {
    id: "teams",
    title: "Teams and labs",
    meta: {
      title: "Mission LLM for teams and labs | Your documents, answered in-house",
      description:
        "Put policies, manuals and research in workspaces, decide who sees which, and get answers with the sources listed, on hardware your team controls.",
    },
    eyebrow: "For teams and labs",
    heading: "Your documents, answered in-house.",
    lead: "Put policies, manuals and research in workspaces, decide who sees which, and ask questions in plain language. Each workspace picks its own model, local or cloud.",
    image: "grounded",
    featuresTitle: "Team knowledge, kept on your network.",
    features: [
      {
        id: "sources",
        title: "Sources listed",
        body: "Answers list the documents they drew on when passages were retrieved, with each passage and its match score one click away.",
        image: "grounded",
        link: { href: "/#grounded", label: "How grounded answers work" },
      },
      {
        id: "access",
        title: "Decide who sees which",
        body: "One workspace per team or topic. People with the default role see only the workspaces they are added to.",
        image: "security-roles",
        link: { href: "/security#controls-access", label: "Learn more about access" },
      },
      {
        id: "models",
        title: `${COUNTS.llmProviders} model providers`,
        body: "Set a system default, then pick a local or approved cloud model for any workspace.",
        image: "feature-models",
      },
      {
        id: "events",
        title: "Admin event log",
        body: "Sign-ins, failed sign-ins, and changes to users, API keys, invites, workspaces and documents, in one log.",
        image: "security",
        link: { href: "/security#controls-oversight", label: "Learn more about oversight" },
      },
      {
        id: "telemetry",
        title: "Telemetry off switch",
        body: `Set ${TELEMETRY_ENV} before the first start and no usage events are sent. Or turn it off in Settings.`,
        html: telemetryHtml,
        image: "security-telemetry",
        link: { href: "/security#outbound", label: "Every outbound connection" },
      },
    ],
    stepsTitle: "From documents to answers in three steps.",
    steps: [
      {
        title: "A workspace per topic",
        body: "Keep policies, manuals, research and project files apart, each with its own documents and settings.",
        art: "images/steps/documents.svg",
      },
      {
        title: "Add the right people",
        body: "Invite your team and add each person to the workspaces they need.",
        art: "images/steps/team.svg",
      },
      {
        title: "Ask and check",
        body: "Ask in plain language, and open the listed sources to read the passages behind the answer.",
        art: "images/menu/students.svg",
      },
    ],
    notesTitle: "Good to know.",
    notes: [
      "SSO, a tamper-evident audit trail and retention controls are in development.",
      "Cloud providers are optional. Pair it with a local runtime and the documents stay on your network.",
      "The Security page lists every outbound connection and how to avoid it.",
    ],
    more: { href: "/editions", label: "Compare editions" },
  },
];

export const useHref = (id: string) => `/for/${id}`;
