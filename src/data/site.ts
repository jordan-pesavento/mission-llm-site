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
    "Mission LLM is a self-hosted assistant for courses and teams. It answers from your documents with the sources listed, and runs with local or cloud models on hardware you control, including disconnected networks.",
  origin: "https://mission-llm.com" as string | null,
  // The nav bar at rest and the logo navy (DESIGN-SPEC section 10).
  themeColor: "#070f26",
  /** Share card (Open Graph, X/Twitter), emitted with absolute URLs once `origin` is set. */
  shareImage: "/og/mission-llm.png",
  shareImageAlt: "Mission LLM: Your class, answered. An isometric lecture hall linked to a local server.",
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
 * Header navigation (DESIGN-SPEC section 6): the "Who it's for" menu, then these links, then Download.
 * Docs is left out until a Mission LLM docs site exists.
 * TODO: add { label: "Docs", href: PLACEHOLDER.docsUrl } once the docs site exists (no Mission LLM docs site yet).
 */
export const NAV: NavItem[] = [
  { label: "Security", href: "/security" },
  { label: "Editions", href: "/editions" },
  { label: "Contact", href: CONTACT_HREF },
];

/**
 * The "Who it's for" menu trigger. Without JavaScript it renders as a link to the audience section.
 */
export const AUDIENCE_MENU = { label: "Who it's for", href: "/#product" } as const;

/**
 * The five audiences: the desktop menu and the phone and tablet sheet list them in this order, each
 * as a thumbnail row. Each links to an anchor at the top of the home accordion block (#for-<id>,
 * FeatureAccordion.astro), and the accordion opens the item with the same id. The ids must match
 * the FeaturesProduct items. `sheet` is a shorter line for the phone sheet where it differs.
 * Thumbnails: public/images/menu/<id>.svg, whole drawings in tight 4:3 viewBoxes with 1px strokes
 * (generated by scripts/art/menu-thumbs.mjs).
 */
export type MenuItem = { id: string; title: string; desc: string; sheet?: string; href: string; thumb: string };
export const AUDIENCES: MenuItem[] = [
  { id: "instructors", title: "Instructors", desc: "Build a course workspace from your syllabus and readings." },
  {
    id: "students",
    title: "Students in a course",
    desc: "Ask about the course and see which readings an answer used.",
    sheet: "See which readings an answer used.",
  },
  {
    id: "learners",
    title: "Independent learners",
    desc: "A workspace for any subject, built from your own notes.",
    sheet: "A workspace for any subject, from your own notes.",
  },
  { id: "school-it", title: "School IT", desc: "School servers, local models, no internet required." },
  { id: "organizations", title: "Organizations", desc: "The same workspaces for teams, with roles and agents." },
].map((a) => ({ ...a, href: `/#for-${a.id}`, thumb: `/images/menu/${a.id}.svg` }));

/** The phone and tablet sheet's "More" rows, after the audiences. */
export const SHEET_MORE: MenuItem[] = [
  { id: "security", title: "Security", desc: "Where data goes and which controls ship today.", href: "/security", thumb: "/images/menu/security.svg" },
  { id: "editions", title: "Editions", desc: "Community today, Enterprise planned.", href: "/editions", thumb: "/images/menu/editions.svg" },
];

/** The desktop menu's footer row. */
export const MENU_FOOT = { text: "Not sure which fits?", link: { label: "Tell us what you need", href: CONTACT_HREF } } as const;

/** The line under the footer lockup (copy.md: Global > Footer; DESIGN-SPEC section 10). */
export const FOOTER_DESCRIPTOR = "A private assistant for courses and teams, on hardware you control.";

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
      { label: "Who it's for", href: "/#product" },
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
    title: "Mission LLM | A private assistant for courses and teams",
    description:
      "A self-hosted assistant that answers from your course documents, lists its sources, and runs with local models on your school's own hardware.",
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
      "Mission LLM Community is free to self-host for any class, school or team. Mission LLM Enterprise adds planned support, deployment help and governance features.",
  },
  contact: {
    title: "Contact | Mission LLM",
    description:
      "Contact the Mission LLM team. Course instructors, students, independent learners, school IT teams and companies are welcome. We reply by email.",
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
