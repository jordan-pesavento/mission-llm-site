/*
 * The five "What it's for" pages (/for/<id>), one per use of the system, in the order the site tells
 * the story (copy.md: positioning pass). The header menu, the phone sheet, the home accordion and the
 * footer link here; src/pages/for/[use].astro renders every entry with the same template, so the five
 * pages share one structure, one rhythm and one set of components.
 * Wording limits (copy.md builder notes and the evidence table): "lists its sources", never "cites";
 * sources appear only when documents were retrieved; explanations, summaries and practice questions are
 * things a student asks the chat for, not features; "agentic coding" is a training subject run on the
 * app's agents, never a claim that Mission LLM is a coding tool; "stays in the building" always sits next
 * to its condition (a local model runtime); the manager role is server-wide; no LMS or study-feature
 * claims; roadmap items say "in development".
 */
import { COUNTS } from "./site";

type ImageName =
  | "feature-documents"
  | "feature-workspaces"
  | "feature-users"
  | "feature-agents"
  | "feature-models";

export type Use = {
  id: string;
  /** Menu and card title, e.g. "Classrooms". */
  title: string;
  /** Page <title> and meta description. */
  meta: { title: string; description: string };
  eyebrow: string;
  heading: string;
  lead: string;
  image: { name: ImageName; alt: string };
  /** Three steps: how the use works, in order. */
  steps: { title: string; body: string }[];
  /** Six capabilities that serve this use, each with a Phosphor icon name. */
  features: { icon: string; title: string; body: string }[];
  /** Plain facts to know before relying on it. */
  notes: string[];
  /** One link out, under the notes. */
  more: { href: string; label: string };
};

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
    heading: "A course assistant for the whole class.",
    lead: "Put the course readings in a workspace and your students ask questions in plain language. Mission LLM answers from those readings on your own hardware and lists the sources it used under the answer.",
    image: {
      name: "feature-documents",
      alt: "A student's question about carrying capacity in a course workspace, answered from the readings, with each reading listed under the answer.",
    },
    steps: [
      {
        title: "Add the readings",
        body: "Upload PDFs, Word files, slides, spreadsheets and scanned handouts to the course workspace. They are parsed, embedded and stored on your server.",
      },
      {
        title: "Students ask",
        body: "Each student signs in with their own account and chats in the course workspaces they were added to, in threads of their own.",
      },
      {
        title: "Sources are listed",
        body: "When passages from the readings were retrieved, the answer lists those documents under it. Open Sources to read the passages and how closely each matched.",
      },
    ],
    features: [
      { icon: "magnifying-glass", title: "Query mode", body: "Answer only from the course documents, with a refusal message you write for questions the readings do not cover." },
      { icon: "push-pin", title: "Pinned documents", body: "Pin the syllabus so the model sees its full text on every question." },
      { icon: "chat-centered-text", title: "A prompt per course", body: "Give each workspace its own system prompt: the level, the tone and what the assistant should avoid." },
      { icon: "lightbulb", title: "Suggested prompts", body: "Offer students a few starting questions when they open the workspace." },
      { icon: "gauge", title: "Daily message limits", body: "Set a per-user daily message limit so a whole class shares the hardware fairly." },
      { icon: "cpu", title: "A local model", body: "Run the model with Ollama, LM Studio or another local runtime, and the questions and readings stay in the building." },
    ],
    notes: [
      "Admins and managers can read workspace chats, with who sent each one. Tell your students.",
      "Sources are listed only when documents were retrieved for that question.",
      "Numbered inline citations and page references are in development.",
    ],
    more: { href: "/#grounded", label: "How grounded answers work" },
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
    heading: "Study help from the assigned material.",
    lead: "Ask for an explanation, a summary or practice questions, and the answer draws on the readings in your course workspace. Independent learners can run the whole system on their own computer.",
    image: {
      name: "feature-workspaces",
      alt: "A learner's Spanish Practice workspace with one thread per topic, and two answers drawn from the learner's own grammar notes.",
    },
    steps: [
      {
        title: "Open your workspace",
        body: "Sign in and pick a course workspace your instructor added you to, or create your own if you run Mission LLM yourself.",
      },
      {
        title: "One thread per topic",
        body: "Keep each topic in its own thread, and fork a thread to try another direction without losing the original.",
      },
      {
        title: "Check the sources",
        body: "Open Sources under an answer to read the passages it drew on before you rely on it.",
      },
    ],
    features: [
      { icon: "chats-circle", title: "Explanations and summaries", body: "Ask in plain language, as often as you need. The answer draws on the workspace's documents." },
      { icon: "list-checks", title: "Practice questions", body: "Ask for practice questions from a reading, then check your answers against the source." },
      { icon: "files", title: "Your own material", body: "PDF, Word, PowerPoint, EPUB, Markdown, web pages, YouTube transcripts and scanned pages with OCR." },
      { icon: "git-fork", title: "Threads and forks", body: "Separate lines of study in one workspace, each with its own history." },
      { icon: "sliders-horizontal", title: "Chat or Query mode", body: "Chat mode adds the model's general knowledge; Query mode answers only from the documents." },
      { icon: "laptop", title: "On your own computer", body: "Install it with Docker and pair it with a local runtime such as Ollama or LM Studio." },
    ],
    notes: [
      "On a school install, admins and managers can read workspace chats.",
      "A model can be wrong. Check the listed sources before you rely on an answer.",
      "Explanations, summaries and practice questions are things you ask the chat for, not separate tools.",
    ],
    more: { href: "/download", label: "Run it on your own computer" },
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
    heading: "A workspace for every course you teach.",
    lead: "Build a workspace from the syllabus, readings and handouts, invite your students into it, and review how they use it. The course material stays on the hardware your school runs.",
    image: {
      name: "feature-users",
      alt: "The Users page as an instructor with the manager role sees it: the admin, the instructor and the student accounts, each with its role.",
    },
    steps: [
      {
        title: "Create the workspace",
        body: "Name it after the course, add the syllabus, readings and handouts, or connect a code repository or a website.",
      },
      {
        title: "Invite your students",
        body: "Send invitations that carry the course workspaces, so each student lands in the right course. Suspend an account at any time.",
      },
      {
        title: "Review and adjust",
        body: "Read the course's chats with who sent each one, export them, and tune the prompt, the mode and the documents.",
      },
    ],
    features: [
      { icon: "users-three", title: "Three roles", body: "Admins run the server, managers run workspaces and users, and students see only their own workspaces." },
      { icon: "export", title: "Chat review and export", body: "Review workspace chats and export them as CSV, JSON or JSONL." },
      { icon: "sliders-horizontal", title: "Retrieval settings", body: "Set a similarity threshold and how many passages each answer draws on." },
      { icon: "plugs-connected", title: "Course sources", body: "GitHub, GitLab and Gitea repositories, websites, YouTube transcripts and Confluence." },
      { icon: "chat-centered-text", title: "Course prompt and model", body: "Each workspace has its own system prompt, chat mode and model." },
      { icon: "browser", title: "Embeddable chat widget", body: "Put a course assistant on a page you host, with allowed domains and per-day and per-session limits." },
    ],
    notes: [
      "The manager role is server-wide: a manager can open every workspace, not only their own courses.",
      "Roles scoped to a single workspace are in development.",
      "Visitors to the embedded chat widget do not sign in, so give it only public course material.",
    ],
    more: { href: "/#steps", label: "Set up a course in four steps" },
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
    heading: "Train instructors on modern AI workflows.",
    lead: "Run faculty workshops on agents, tools and agentic coding with a local model on your own hardware. Admins decide which skills and MCP servers are on, so the training environment is one you control.",
    image: {
      name: "feature-agents",
      alt: "The Agent Skills settings: skills an admin switches on or off, such as document creation, charts and a SQL connector, plus custom skills, agent flows and MCP servers.",
    },
    steps: [
      {
        title: "Turn on the skills",
        body: "Switch built-in skills on or off: document search, summaries, charts, file creation, SQL queries and web search through a provider you choose.",
      },
      {
        title: "Connect MCP servers",
        body: "Add Model Context Protocol servers over stdio, SSE or streamable HTTP to give agents the tools your workshop needs.",
      },
      {
        title: "Hand a task to an agent",
        body: "Type @agent in a workspace, or use Automatic mode with a model that supports native tool calling, and follow each tool call in the chat.",
      },
    ],
    features: [
      { icon: "code", title: "Agentic coding", body: "Show how agents plan, call tools and work with files. The filesystem skill (Docker installs) works in a folder under the server's storage." },
      { icon: "flow-arrow", title: "Agent flows", body: "Chain steps into a flow in the no-code builder." },
      { icon: "puzzle-piece", title: "Custom skills", body: "Add agent skills of your own for the tools your department uses." },
      { icon: "robot", title: "A model for agents", body: "Give a workspace's agents their own provider and model." },
      { icon: "cpu", title: "Local runtimes", body: "Ollama, LM Studio, LocalAI, KoboldCPP, NVIDIA NIM or any OpenAI-compatible server." },
      { icon: "terminal-window", title: "Developer API", body: "Admin-issued API keys, OpenAI-compatible endpoints and documentation at /api/docs." },
    ],
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
    heading: "Your team's knowledge, with the sources listed.",
    lead: "Put policies, manuals and research in workspaces, decide who sees which, and ask questions in plain language. Each workspace picks its own model, local or cloud.",
    image: {
      name: "feature-models",
      alt: "The Chat Settings of a workspace: its own LLM provider setting and its chat mode.",
    },
    steps: [
      {
        title: "A workspace per topic",
        body: "Keep policies, manuals, research and project files apart, each with its own documents and settings.",
      },
      {
        title: "Add the right people",
        body: "In multi-user mode, people with the default role see only the workspaces they have been added to.",
      },
      {
        title: "Ask and check",
        body: "Answers list the documents they drew on when passages were retrieved, with the passages one click away.",
      },
    ],
    features: [
      { icon: "stack", title: `${COUNTS.llmProviders} model providers`, body: "Set a system default, then pick a local or approved cloud model for any workspace." },
      { icon: "target", title: "Accuracy Optimized search", body: "Rerank results on the built-in LanceDB store for closer matches." },
      { icon: "list-magnifying-glass", title: "Event log", body: "Sign-ins, failed sign-ins and changes to users, API keys, workspaces and documents." },
      { icon: "database", title: "Any document set", body: "Office files, PDFs, mailboxes, web pages, wikis and code repositories." },
      { icon: "cube", title: "Deploy where your data lives", body: "Docker, Docker Compose, Kubernetes, Helm or OpenShift, on your own hardware." },
      { icon: "terminal-window", title: "Developer API", body: "Build internal tools on OpenAI-compatible endpoints with admin-issued keys." },
    ],
    notes: [
      "SSO, a tamper-evident audit trail and retention controls are in development.",
      "Cloud providers are optional. Pair it with a local runtime and the documents stay on your network.",
      "The Security page lists every outbound connection and how to avoid it.",
    ],
    more: { href: "/editions", label: "Compare editions" },
  },
];

export const useHref = (id: string) => `/for/${id}`;
