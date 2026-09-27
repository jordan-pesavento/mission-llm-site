/*
 * Shared site data: names, navigation, footer, verified counts and placeholders.
 * Text here is taken verbatim from src/content/copy.md. Section builders import from this file
 * instead of retyping numbers or links, so a correction lands everywhere at once.
 * Evidence paths are relative to D:/OB Vault/mission-llm (read-only source of truth).
 */

export const SITE = {
  name: "Mission LLM",
  // Default meta description (copy.md: Global > Site metadata).
  description:
    "Mission LLM is a private, offline AI system for schools and teams. It runs on your own hardware, answers from your own documents with the sources listed, and works with local models on disconnected networks.",
  origin: "https://mission-llm.com" as string | null,
  // The nav bar at rest and the logo navy (DESIGN-SPEC section 10).
  themeColor: "#070f26",
  /** Share card (Open Graph, X/Twitter), emitted with absolute URLs once `origin` is set. */
  shareImage: "/og/mission-llm.png",
  shareImageAlt: "Mission LLM: Your class, your model. An isometric classroom of lit laptops linked to an in-house server, with an answer card that lists its sources.",
};

/** Every product screenshot carries this caption (copy.md builder note 1). */
export const CONCEPT_CAPTION =
  "The Mission LLM app, shown with fictional sample documents.";

/**
 * Verified counts (copy.md builder note 3). Use these constants; never type the numbers inline.
 * - llmProviders: frontend/src/pages/GeneralSettings/LLMPreference/index.jsx AVAILABLE_LLM_PROVIDERS (38; Model Router excluded)
 * - vectorDatabases: frontend/src/pages/GeneralSettings/VectorDatabase/index.jsx and server/utils/vectorDbProviders/ (10)
 * - embeddingEngines: server/utils/EmbeddingEngines/ (14)
 */
export const COUNTS = {
  llmProviders: 38,
  vectorDatabases: 10,
  embeddingEngines: 14,
  // Admin, manager and default (server/utils/middleware/multiUserProtected.js:3-8).
  userRoles: 3,
  // Container install methods on /download: Docker, Docker Compose, Kubernetes, Helm, OpenShift
  // (docker/HOW_TO_USE_DOCKER.md, cloud-deployments/k8, cloud-deployments/helm, cloud-deployments/openshift).
  installMethods: 5,
  // AWS CloudFormation, Google Cloud Deployment Manager, DigitalOcean Terraform (cloud-deployments/*).
  cloudTemplates: 3,
} as const;

/** Container install methods, in the order /download lists them after Build from source. */
export const INSTALL_METHODS = ["Docker", "Docker Compose", "Kubernetes", "Helm", "OpenShift"] as const;

/** The server listens on 3001 (docker/HOW_TO_USE_DOCKER.md:139-144, server/index.js). */
export const PORT = 3001;
export const LOCAL_URL = "http://localhost:3001";

/** Telemetry opt-out. Must be the exact string "true" (server/models/telemetry.js:49-53). */
export const TELEMETRY_ENV = 'DISABLE_TELEMETRY="true"';

/**
 * Placeholders. Every one of these is a TODO for the owner; scripts/check-copy.mjs lists them.
 * Do not invent real values.
 */
export const PLACEHOLDER = {
  registry: "REGISTRY", // image registry: public images are not published yet
  image: "REGISTRY/mission-llm:latest",
  repositoryUrl: "https://github.com/jordan-pesavento/mission-llm",
  docsUrl: "#", // TODO: no Mission LLM docs site yet
  securityEmail: "https://github.com/jordan-pesavento/mission-llm/security/advisories/new", // GitHub private vulnerability reporting
  privacyUrl: "#", // TODO
  termsUrl: "#", // TODO
  licensesUrl: "https://github.com/jordan-pesavento/mission-llm/blob/main/LICENSE",
  securityPolicyUrl: "https://github.com/jordan-pesavento/mission-llm/blob/main/SECURITY.md",
  sourceCodeUrl: "https://github.com/jordan-pesavento/mission-llm",
};

export const UPSTREAM = {
  name: "AnythingLLM",
  url: "https://github.com/Mintplex-Labs/anything-llm",
  license: "MIT License",
  credit: "Mission LLM is built on the open-source AnythingLLM project (MIT License).",
};

export const NON_AFFILIATION =
  "Mission LLM is not affiliated with or endorsed by the U.S. Department of Defense or the U.S. Space Force.";

// TODO: legal entity and copyright holder not decided. Do not use "Sigmatech".
export const COPYRIGHT = "© 2026 Mission LLM.";

/**
 * A link whose destination is still a TODO ("#") renders as non-interactive text marked
 * "Coming soon" (Header, Footer), and switches back to a link as soon as the href is real.
 */
export type NavItem = { label: string; href: string; todo?: string };
export const isPlaceholder = (href: string) => href === "#";

/** Every Download button on the site points here. */
export const DOWNLOAD_HREF = "/download";

/** Every "Contact us" link points here: the contact form (src/pages/contact.astro, api/contact.js). */
export const CONTACT_HREF = "/contact";

/**
 * Header navigation (DESIGN-SPEC section 6): the "What it's for" menu, then these links, then Download.
 * Docs is left out until a Mission LLM docs site exists.
 * TODO: add { label: "Docs", href: PLACEHOLDER.docsUrl } once the docs site exists (no Mission LLM docs site yet).
 */
export const NAV: NavItem[] = [
  { label: "Security", href: "/security" },
  { label: "Editions", href: "/editions" },
  { label: "Contact", href: CONTACT_HREF },
];

/**
 * The "What it's for" menu trigger. Without JavaScript it renders as a link to the uses section.
 */
export const AUDIENCE_MENU = { label: "What it's for", href: "/#product" } as const;

/**
 * The five uses of the system (positioning pass, copy.md: Home > What it is for): the desktop menu
 * and the phone and tablet sheet list them in this order, each as a thumbnail row. Each links to an
 * anchor at the top of the home accordion block (#for-<id>, FeatureAccordion.astro), and the
 * accordion opens the item with the same id. The ids must match the FeaturesProduct items. `sheet`
 * is a shorter line for the phone sheet where it differs.
 * Thumbnails: public/images/menu/<thumb>.svg, whole drawings in tight 4:3 viewBoxes with 1px strokes
 * (generated by scripts/art/menu-thumbs.mjs). The five files keep their original names, so `thumb`
 * names the drawing each use shows (an answer with numbered sources, the upload panel, the Users
 * page, the app in Docker on your own server, telemetry switched off); each file is used exactly once.
 */
export type MenuItem = { id: string; title: string; desc: string; sheet?: string; href: string; thumb: string };
export const AUDIENCES: MenuItem[] = [
  {
    id: "classrooms",
    thumb: "students",
    title: "Classrooms",
    desc: "A course assistant that answers from the course readings and lists its sources.",
    sheet: "A course assistant that lists its sources.",
  },
  {
    id: "students",
    thumb: "learners",
    title: "Students",
    desc: "Study help drawn from the assigned material, in a workspace of your own.",
    sheet: "Study help drawn from the assigned material.",
  },
  {
    id: "courses",
    thumb: "instructors",
    title: "Teaching a course",
    desc: "Build a workspace per course from the syllabus, readings and handouts.",
    sheet: "A workspace per course, from the syllabus and readings.",
  },
  {
    id: "instructors",
    thumb: "school-it",
    title: "Training instructors",
    desc: "Teach faculty modern AI workflows, agentic coding included, on a local model.",
    sheet: "Agentic coding and other AI workflows, on a local model.",
  },
  {
    id: "teams",
    thumb: "organizations",
    title: "Teams and labs",
    desc: "Policies, manuals and research, searchable with the sources listed.",
    sheet: "Policies, manuals and research, with sources.",
  },
].map((a) => ({ ...a, href: `/#for-${a.id}`, thumb: `/images/menu/${a.thumb}.svg` }));

/** The phone and tablet sheet's "More" rows, after the audiences. */
export const SHEET_MORE: MenuItem[] = [
  { id: "security", title: "Security", desc: "Where data goes and which controls ship today.", href: "/security", thumb: "/images/menu/security.svg" },
  { id: "editions", title: "Editions", desc: "Community today, Enterprise planned.", href: "/editions", thumb: "/images/menu/editions.svg" },
];

/** The desktop menu's footer row. */
export const MENU_FOOT = { text: "Not sure which fits?", link: { label: "Tell us what you need", href: CONTACT_HREF } } as const;

/** The line under the footer lockup (copy.md: Global > Footer; DESIGN-SPEC section 10). */
export const FOOTER_DESCRIPTOR = "A private, offline AI system for schools and teams, on hardware you control.";

/**
 * Footer columns, in the reference's four-column structure (Product, Resources, Project, Contact).
 * Only destinations that exist are listed. Placeholder entries come back once they are real:
 * TODO: Resources > Documentation (PLACEHOLDER.docsUrl, docs site), Security policy
 * (PLACEHOLDER.securityPolicyUrl, link SECURITY.md); Project > Source code (PLACEHOLDER.sourceCodeUrl,
 * repository access not decided), Licenses and notices (PLACEHOLDER.licensesUrl, link LICENSE and
 * NOTICE).
 */
export const FOOTER: { title: string; links: NavItem[] }[] = [
  {
    title: "Product",
    links: [
      { label: "What it's for", href: "/#product" },
      { label: "Grounded answers", href: "/#grounded" },
      { label: "Deployment", href: "/#deploy" },
      { label: "Download", href: DOWNLOAD_HREF },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Security overview", href: "/security" },
      { label: "Install options", href: "/download#options" },
      { label: "System requirements", href: "/download#requirements" },
      { label: "Editions", href: "/editions" },
    ],
  },
  {
    title: "Project",
    links: [{ label: "AnythingLLM project", href: UPSTREAM.url }],
  },
  {
    title: "Contact",
    links: [
      { label: "Contact us", href: CONTACT_HREF },
      { label: "Report a vulnerability", href: "/security#report" },
    ],
  },
];

/** Bottom-row legal links (the reference's Privacy and Terms, bottom right). */
export const FOOTER_LEGAL: NavItem[] = [
  { label: "Privacy", href: PLACEHOLDER.privacyUrl, todo: "privacy page" },
  { label: "Terms", href: PLACEHOLDER.termsUrl, todo: "terms page" },
];

/** Page metadata (copy.md: each page's Meta title and Meta description). */
export const PAGES = {
  home: {
    title: "Mission LLM | A private, offline AI system for schools and teams",
    description:
      "An in-house AI system on your own hardware: course assistants that answer from your documents and list their sources, study help, instructor training and team knowledge, on local models.",
  },
  download: {
    title: "Download Mission LLM | Install options",
    description:
      "Build Mission LLM from source, then run it with Docker, Docker Compose, Kubernetes, Helm or OpenShift. System requirements and commands.",
  },
  security: {
    title: "Security and deployment | Mission LLM",
    description:
      "Where your data goes in Mission LLM, the controls available today, what is in development, and how to harden an install.",
    // Shown as "Last updated" on the Security page. Change it whenever that page's facts change.
    lastUpdated: "2026-09-26",
  },
  editions: {
    title: "Editions | Mission LLM",
    description:
      "Mission LLM Community is the full system, free to self-host for any class, school or team. Mission LLM Enterprise adds planned support, deployment help and governance features.",
  },
  contact: {
    title: "Contact | Mission LLM",
    description:
      "Contact the Mission LLM team. Instructors, students, school IT teams, labs and companies are welcome. We reply by email.",
  },
  contactSent: {
    title: "Message sent | Mission LLM",
    description: "Your message reached the Mission LLM team. We reply by email.",
  },
  notFound: {
    title: "Page not found | Mission LLM",
    description: "The page you asked for does not exist or has moved.",
  },
} as const;
