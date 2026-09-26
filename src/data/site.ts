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
    "Mission LLM is a self-hosted AI assistant for documents and agents. Run it on your own infrastructure with local or cloud models, including on disconnected networks.",
  // TODO: production origin is not decided (Vercel project and .com domain pending). Leave null until then.
  origin: null as string | null,
  themeColor: "#fbfcfe",
  /** Share card (Open Graph, X/Twitter), emitted with absolute URLs once `origin` is set. */
  shareImage: "/og/mission-llm.png",
  shareImageAlt: "Mission LLM: private AI, grounded in your own documents.",
};

/** Every product screenshot carries this caption (copy.md builder note 1). */
export const CONCEPT_CAPTION =
  "Concept of the next Mission LLM interface. Inline citations and page references are in development.";

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
} as const;

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
  repositoryUrl: "REPOSITORY_URL", // TODO: repository access not decided
  docsUrl: "#", // TODO: no Mission LLM docs site yet
  contactEmail: "mailto:contact@example.com", // TODO: real address
  securityEmail: "mailto:security@example.com", // TODO: real security contact
  privacyUrl: "#", // TODO
  termsUrl: "#", // TODO
  licensesUrl: "#", // TODO: link LICENSE and NOTICE
  securityPolicyUrl: "#", // TODO: link SECURITY.md
  sourceCodeUrl: "#", // TODO: repository access not decided
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

/** Header navigation (copy.md: Global > Header). */
export const NAV: NavItem[] = [
  { label: "Product", href: "/#product" },
  { label: "Security", href: "/security" },
  { label: "Deployment", href: "/#deploy" },
  { label: "Editions", href: "/editions" },
  { label: "Docs", href: PLACEHOLDER.docsUrl, todo: "no Mission LLM docs site yet" },
];

/** Every Download button on the site points here. */
export const DOWNLOAD_HREF = "/download";

/** One line under the footer wordmark (copy.md: Global > Footer). */
export const FOOTER_DESCRIPTOR = "Self-hosted AI for documents and agents, on infrastructure you control.";

/** Footer columns (copy.md: Global > Footer). Contact lives under Resources. */
export const FOOTER: { title: string; links: NavItem[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/#product" },
      { label: "Grounded answers", href: "/#grounded" },
      { label: "Deployment", href: "/#deploy" },
      { label: "Security", href: "/security" },
      { label: "Editions", href: "/editions" },
      { label: "Download", href: DOWNLOAD_HREF },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: PLACEHOLDER.docsUrl, todo: "docs site" },
      { label: "Source code", href: PLACEHOLDER.sourceCodeUrl, todo: "repository access not decided" },
      { label: "Security policy", href: PLACEHOLDER.securityPolicyUrl, todo: "link SECURITY.md" },
      { label: "AnythingLLM project", href: UPSTREAM.url },
      { label: "Contact", href: PLACEHOLDER.contactEmail, todo: "real address" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: PLACEHOLDER.privacyUrl, todo: "privacy page" },
      { label: "Terms", href: PLACEHOLDER.termsUrl, todo: "terms page" },
      { label: "Licenses and notices", href: PLACEHOLDER.licensesUrl, todo: "link LICENSE and NOTICE" },
    ],
  },
];

/** Page metadata (copy.md: each page's Meta title and Meta description). */
export const PAGES = {
  home: {
    title: "Mission LLM | Private AI for your documents and agents",
    description:
      "Self-hosted AI that answers from your documents, shows its sources, and runs with local or cloud models on infrastructure you control.",
  },
  download: {
    title: "Download Mission LLM | Install options",
    description:
      "Install Mission LLM with Docker, Docker Compose, Kubernetes, Helm or OpenShift. System requirements and commands.",
  },
  security: {
    title: "Security and deployment | Mission LLM",
    description:
      "Where your data goes in Mission LLM, the controls available today, what is in development, and how to harden an install.",
    // Shown as "Last updated" on the Security page. Change it whenever that page's facts change.
    lastUpdated: "2026-09-25",
  },
  editions: {
    title: "Editions | Mission LLM",
    description:
      "Mission LLM Community is free to self-host. Mission LLM Enterprise adds support, deployment help and planned governance features.",
  },
  notFound: {
    title: "Page not found | Mission LLM",
    description: "The page you asked for does not exist or has moved.",
  },
} as const;
