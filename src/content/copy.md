# Mission LLM website copy (v1)

## Builder notes (read first)

1. **The screenshots show an interface that is still in development.** The four chat concept renders (`chat-sources.png`, `chat-cite.png`, `chat-frame.png`, `chat-empty.png`) show numbered inline citations, page and section references, and an "Open" at-page viewer. None of these ship today. The three website concepts (`agent-run.png`, `admin-users.png`, `workspace-model.png`, each with a `-phone` detail) show shipped capabilities in the next interface. Every product screenshot must carry this caption: "Concept of the next Mission LLM interface. Inline citations and page references are in development." Never place a screenshot next to "Available today" copy without it.
2. **The renders use a neutral placeholder account** ("Alex Rivera", "Admin"). They were re-rendered at 2x from the concept pages with the owner's name replaced (`scratchpad/site/render-concepts.cjs`). The raw PNGs stay in `public/images/product/` for swapping and are removed from `dist/` after the build; only AVIF and WebP variants ship. `chat-empty.png` also shows "Synced 2 hours ago". Document sync exists only as an experimental feature (`frontend/src/pages/Admin/ExperimentalFeatures/Features/LiveSync`), so keep the caption on that image too.
3. **Counts are verified.**
   - 38 user-selectable LLM providers. The server has 40 folders, but `modelMap` and `modelRouter` are not providers, and the Model Router is not counted.
   - 10 vector databases.
   - 14 embedding engines.
4. **Telemetry opt-out is `DISABLE_TELEMETRY="true"`.** It must be the exact string `true`.
5. **The repo docs disagree with the code in places.** The copy follows the code:
   - README.md:118 says pricing data comes from raw.githubusercontent.com. The code fetches pricing from models.dev and context windows from raw.githubusercontent.com.
   - README.md:119 names hub.anythingllm.com. The server calls hub.external.anythingllm.com.
   - The Compose example in docker/HOW_TO_USE_DOCKER.md points Ollama at 127.0.0.1, which is the container itself. The site version uses host.docker.internal plus `extra_hosts`, as docker/docker-compose.yml does. It also adds `DISABLE_TELEMETRY`, drops the obsolete `version:` key and uses a current model tag.
   - The Helm README example sets `mountPath: /storage`, which does not match the chart's `STORAGE_DIR` (/app/server/storage). The site snippet keeps the chart default.
6. **Placeholders with a TODO:** image registry, repository URL, docs site, contact addresses, Privacy and Terms, copyright holder. Do not use "Sigmatech". The README, NOTICE and Helm chart use it, but the spec says it is undecided.
7. **"In development" items stay at the capability level** ("Sign-in protection and a lockout policy", "API key scopes, expiry and rate limits", "Hardened HTTP defaults"). The precise gaps behind them (no login throttling, unhashed API keys, no security headers or CORS allow-list today) belong in the hardening guide or private docs, not on a public page.
8. **Every tour item has its own screen.** Items 2, 4 and 5 use website concepts built on the final concept design system (`scratchpad/site/concepts/`: agent run, workspace model settings, Admin > Users). Replace them with real renders once the final app design ships.

---

## Global

### Site metadata
- Site name: Mission LLM
- Default meta description: "Mission LLM is a self-hosted AI assistant for documents and agents. Run it on your own infrastructure with local or cloud models, including on disconnected networks."

### Header
- Emblem and wordmark: Mission LLM
- Nav: Product (`/#product`), Security (`/security`), Deployment (`/#deploy`), Editions (`/editions`), Docs (shown as text with a "Soon" tag, not a link, until the docs site exists <!-- TODO: no Mission LLM docs site yet -->)
- Button: Download (`/download`)
- Mobile toggle labels: "Menu" / "Close menu"

### Footer
- Under the wordmark: "Self-hosted AI for documents and agents, on infrastructure you control."
- Entries without a destination yet show as text with a "Soon" tag, not as links.
- **Product:** Overview (`/#product`), Grounded answers (`/#grounded`), Deployment (`/#deploy`), Security (`/security`), Editions (`/editions`), Download (`/download`)
- **Resources:** Documentation (<!-- TODO -->), Source code (<!-- TODO: repository access not decided -->), Security policy (<!-- TODO: link SECURITY.md -->), AnythingLLM project (https://github.com/Mintplex-Labs/anything-llm), Contact (`mailto:contact@example.com` <!-- TODO: real address -->)
- **Legal:** Privacy (<!-- TODO -->), Terms (<!-- TODO -->), Licenses and notices (<!-- TODO: link LICENSE and NOTICE -->)
- Fine print, line 1: "Mission LLM is built on the open-source AnythingLLM project (MIT License)."
- Fine print, line 2: "Mission LLM is not affiliated with or endorsed by the U.S. Department of Defense or the U.S. Space Force."
- Fine print, line 3: "© 2026 Mission LLM." <!-- TODO: legal entity and copyright holder not decided -->

---

## Home (`/`)

Meta title: "Mission LLM | Private AI for your documents and agents"
Meta description: "Self-hosted AI that answers from your documents, shows its sources, and runs with local or cloud models on infrastructure you control."

### Hero
- Eyebrow: Self-hosted AI for documents and agents
- Headline: **Private AI, grounded in your own documents.**
- Subhead: Mission LLM runs on infrastructure you control, answers from your documents with the sources listed, and works with local models on networks that have no internet connection.
- Primary action: Download (`/download`)
- Secondary action: Security overview (`/security`)
- Supporting line: Free to self-host. Runs in Docker, Kubernetes, Helm and OpenShift.
- Screenshot: `chat-sources.png` (phones: the Sources panel detail)
  - Alt: "Mission LLM chat answering a question about a change control process, with a sources panel listing three documents."
  - Phone alt: "The Sources panel of a Mission LLM answer, listing the three documents it used."
  - Caption: "Concept of the next Mission LLM interface. Inline citations and page references are in development."
- Alternate headlines:
  - "Your documents. Your models. Your network."
  - "Answers you can trace, on hardware you own."

### Proof strip
Visually hidden heading: At a glance

| Fact | Line |
| --- | --- |
| Runs on disconnected networks | Local models, the built-in embedder and the built-in vector store need no internet connection. |
| 38 model providers | Local runtimes and cloud APIs, chosen per workspace. |
| 10 vector databases | LanceDB built in, plus PGVector, Qdrant, Milvus, Chroma, Weaviate and more. |
| Docker, Kubernetes, Helm, OpenShift | Plus AWS, Google Cloud and DigitalOcean templates. |

Footnote: "Offline use requires a local model runtime and built-in models staged in advance. See Security for every outbound connection."
Alternate fact: "14 embedding engines. Including a built-in embedder that runs on the server's CPU."

### Product tour
Anchor: `#product`
- Eyebrow: Product
- Heading: **One workspace for your documents, models and agents.**
- Intro: Every capability described here ships today. The screens show the next interface, which is in development.

#### 1. Document knowledge
- Tab label: Document knowledge
- Title: Answers drawn from your documents, with the sources listed.
- Body: Add files to a workspace and Mission LLM parses, embeds and indexes them on your server. For each question it finds the most relevant passages, gives them to the model, and lists the documents it used under the answer.
- Facts:
  - PDF, Word, PowerPoint, Excel, OpenDocument, text, Markdown, CSV, HTML, EPUB and mailbox files.
  - OCR for images and scanned PDFs. Local transcription for audio and video.
  - Connectors for GitHub, GitLab, Gitea, Confluence, websites, YouTube transcripts, Obsidian, Drupal Wiki and Paperless-ngx.
- Screenshot: `chat-sources.png`, the Sources list beside the passage viewer (phones: the passage) (concept caption)
  - Alt: "The Sources panel of an answer listing three documents, beside a viewer that shows the cited passage of a configuration management plan."

#### 2. Agents and tools
- Tab label: Agents and tools
- Title: Agents that work with the tools you turn on.
- Body: Type @agent to hand a task to an agent, or use Automatic mode with models that support native tool calling. Admins decide which skills are on. Built-in skills search your documents, summarize files, scrape and search the web, build charts and query SQL databases.
- Facts:
  - Connect Model Context Protocol (MCP) servers over stdio, SSE or streamable HTTP.
  - Add custom agent skills, and chain steps in the no-code agent flow builder.
  - Web search through a provider you choose, including self-hosted SearXNG.
  - The SQL skill connects to PostgreSQL, MySQL and SQL Server.
- Screenshot: `agent-run.png` (phones: `agent-run-phone.png`) (concept caption)
  - Alt: "An agent run in Mission LLM: the agent searched the workspace documents, called a GitLab MCP server tool and summarized attachments, then listed two change requests that block a release."

#### 3. Workspaces and threads
- Tab label: Workspaces and threads
- Title: Workspaces keep teams and subjects apart.
- Body: Each workspace has its own documents, system prompt, model, chat mode and retrieval settings. Threads keep separate lines of work inside a workspace. In multi-user mode, people see only the workspaces they have been added to.
- Facts:
  - Choose Automatic, Chat or Query mode for each workspace.
  - Pin a document so the model sees its full text on every question.
  - Fork a thread to explore a different direction without losing the original.
  - Suggested prompts help new users start.
- Screenshot: `chat-frame.png`, the workspace rail beside the thread (phones: the rail) (concept caption)
  - Alt: "The workspace list in Mission LLM with the threads of an Engineering Specs workspace, beside an answered question."

#### 4. Model choice
- Tab label: Model choice
- Title: Local or cloud models, chosen per workspace.
- Body: Pick from 38 model providers. Run models on your own hardware with Ollama, LM Studio, LocalAI, KoboldCPP, NVIDIA NIM or any OpenAI-compatible server. Or connect cloud services you have approved, such as Azure OpenAI, AWS Bedrock, Google Vertex AI, OpenAI or Anthropic.
- Facts:
  - Set a system default, then override it for any workspace and for that workspace's agents.
  - Route messages between models with rules in the Model Router.
  - 14 embedding engines, including a built-in embedder that runs on the server's CPU.
- Screenshot: `workspace-model.png` (phones: `workspace-model-phone.png`) (concept caption)
  - Alt: "Workspace chat settings with the provider list open, separating local runtimes such as Ollama and LM Studio from cloud services such as Azure OpenAI and AWS Bedrock."

#### 5. Multi-user with roles
- Tab label: Multi-user and roles
- Title: Accounts and roles for a whole team.
- Body: Turn on multi-user mode and each person signs in with their own account. Admins control the whole system. Managers run workspaces and users but cannot change model, vector database or embedding connections. Default users chat only in the workspaces they are assigned to.
- Facts:
  - Invitations, account suspension and per-user daily message limits.
  - An admin event log of sign-ins, failed sign-ins, and changes to users, API keys, workspaces and documents.
  - Admins can export chat history as CSV, JSON or JSONL.
- Screenshot: `admin-users.png` (phones: `admin-users-phone.png`) (concept caption)
  - Alt: "The Users page in Mission LLM settings, listing accounts with admin, manager and default roles, daily message limits and one suspended account."

### Grounded answers (dark band)
Anchor: `#grounded`
- Eyebrow: Grounded answers
- Heading: **See where each answer came from.**
- Body: When a workspace has documents, Mission LLM searches them before the model answers. Open Sources on an answer to see each document it used, the exact passages it retrieved, and how closely each passage matched the question.
- **Available today**
  - A similarity threshold and passage count for each workspace.
  - Document pinning for material the model must always see.
  - Accuracy Optimized search, which reranks results on the built-in LanceDB store.
  - Query mode, with a refusal message you write for questions your documents do not cover.
- **In development**
  - Numbered inline citations tied to the Sources panel.
  - Page and section references, with the original file opened at the cited passage.
  - Strict grounding that holds Query mode to fresh sources on every turn of a conversation.
  - Hybrid keyword and vector search on every supported vector database.
- Screenshot: `chat-cite.png`, the chat pane with the popover (phones: the popover)
  - Alt: "An answer about a change control process, with a popover showing the cited passage from a release checklist."
  - Caption: "Concept of the next Mission LLM interface. Inline citations and page references are in development."

### Deploy anywhere
Anchor: `#deploy`
- Eyebrow: Deployment
- Heading: **Deploy it where your data already lives.**
- Body: Mission LLM ships as a single container that serves the web app and API on port 3001. Run it on a workstation, a server in your rack, a Kubernetes cluster or a cloud account you control. On a disconnected network, pair it with a local model runtime and stage the built-in models in advance.
- Targets:

| Target | Detail |
| --- | --- |
| Docker | One container, one storage volume. |
| Docker Compose | The same container, managed as a service. |
| Kubernetes | An example manifest with persistent storage, a service and an ingress. |
| Helm | A chart with ConfigMap settings, Secret references, Ingress and Gateway API routes. |
| OpenShift | An image and entrypoint built for restricted SCCs and arbitrary user IDs. |
| Cloud templates | AWS CloudFormation, Google Cloud Deployment Manager, DigitalOcean Terraform. |
| Disconnected networks | Local models, the built-in embedder and LanceDB, with no cloud dependency. |
| Build from source | Build the image yourself from the repository's Dockerfile. |

- Code block, label "Run with Docker (Linux or macOS)":
```shell
export STORAGE_LOCATION=$HOME/missionllm && \
mkdir -p $STORAGE_LOCATION && \
touch "$STORAGE_LOCATION/.env" && \
docker run -d --rm -p 3001:3001 \
--cap-add SYS_ADMIN \
-v ${STORAGE_LOCATION}:/app/server/storage \
-v ${STORAGE_LOCATION}/.env:/app/server/.env \
-e STORAGE_DIR="/app/server/storage" \
REGISTRY/mission-llm:latest
```
- Caption: "REGISTRY is a placeholder. Public images are not published yet. Today you build the image from source (see Download)."
- Link: See every install option (`/download`)

### Security and control
- Eyebrow: Security and control
- Heading: **Controls that exist today, and the ones we are building.**
- Intro: "Available today" lists only what ships in the current release. Everything else is labeled "In development".
- **Available today**
  - **Your data is stored on your server.** Documents, embeddings, chat history and accounts live in the storage volume you mount.
  - **Local models only, if you choose.** No cloud provider is required for chat, embeddings or search.
  - **Multi-user roles.** Admin, manager and default roles, with workspace membership.
  - **Event log.** Sign-ins, failed sign-ins, and changes to users, API keys, invites, workspaces and documents.
  - **API keys.** Admins issue and revoke keys for the developer API.
  - **Telemetry off with one setting.** Set `DISABLE_TELEMETRY="true"` and no usage events are sent.
  - **HTTPS and password rules.** Built-in TLS with your certificate, and configurable password complexity.
  - **Your network boundary.** One port, published only where you choose.
- **In development**
  - Single sign-on with OIDC and SAML, SCIM provisioning, and smart card (PIV and CAC) sign-in.
  - Multi-factor authentication and sessions that can be revoked.
  - Workspace-level roles, custom roles and groups.
  - A complete, tamper-evident audit trail with forwarding to your SIEM.
  - An offline mode switch with a report of every outbound connection.
  - API key scopes and expiry.
  - An encrypted secrets store.
  - Model and tool policies for each workspace.
  - Retention rules, legal hold and scoped eDiscovery export.
- Link: Read the security overview (`/security`)

### Open source foundation
- Eyebrow: Foundation
- Heading: **Built on AnythingLLM, run for organizations.**
- Body: Mission LLM is built on the open-source AnythingLLM project (MIT License) by Mintplex Labs. AnythingLLM provides the core: document ingestion, retrieval, agents and the provider integrations. Mission LLM tracks upstream releases and adds what an organization needs to operate it with confidence.
- **What Mission LLM adds today**
  - An in-place upgrade path for existing AnythingLLM installs, carrying over the database, settings and vector collections.
  - A documented list of the outbound connections the server can make.
  - Deployment templates that pull only the image you build and host.
- **What it is building:** the governance work listed under "In development" above.
- Credit line: "Mission LLM is built on the open-source AnythingLLM project (MIT License)."

### Final CTA
- Heading: **Stand it up on your own hardware.**
- Body: Start with one container and a local model. Add users, workspaces and documents when you are ready.
- Primary action: Download (`/download`)
- Secondary action: Compare editions (`/editions`)

---

## Download (`/download`)

Meta title: "Download Mission LLM | Install options"
Meta description: "Install Mission LLM with Docker, Docker Compose, Kubernetes, Helm or OpenShift. System requirements and commands."

### Hero
- Eyebrow: Download
- Heading: **Install Mission LLM on your own infrastructure.**
- Body: Mission LLM runs as a container. Pick the method that fits your environment. The commands below come from the project's deployment documentation.
- Status callout: "Public release images are not published yet. Build the image from source today, push it to your own registry, and replace REGISTRY in the commands below."

### Platforms
Directly under the hero, four equal cards (Download buttons across the site lead here):
- **Server:** "Docker, build from source". "A workstation, a server in your rack, or Kubernetes, Helm and OpenShift." Label: Available today. Action: Get started (`#p-source`, the Build from source tab).
- **Windows**, **macOS**, **Linux:** "Desktop app". Label: Coming soon. No links.
- Footnote: "Until the desktop apps ship, build and run Mission LLM in Docker on your workstation. Checksums and signatures will be published with the first release." (link: `#p-source`)

### System requirements
| Item | Requirement |
| --- | --- |
| Memory | 2 GB of RAM or more. |
| Disk | 10 GB minimum recommended. Storage grows with your documents, vectors and models. |
| CPU architecture | x86-64 (amd64) or ARM64. |
| Container runtime | Docker. Use 18.03 or later on Windows and macOS, or 20.10 or later on Linux, so the container can reach model runtimes on the host. |
| Language model | A local runtime such as Ollama or LM Studio, or an account with a cloud provider you approve. |
| Local model hardware | Depends on the model and runtime you choose. |
| Kubernetes installs | A cluster with persistent volume support. Helm 3 for the chart. |

### Install options
Anchor: `#options`. Build from source is the first and default tab (the one method that works before public images exist).

#### Docker
Summary: One container and one storage folder. Your data persists across image updates.

Linux or macOS:
```shell
export STORAGE_LOCATION=$HOME/missionllm && \
mkdir -p $STORAGE_LOCATION && \
touch "$STORAGE_LOCATION/.env" && \
docker run -d --rm -p 3001:3001 \
--cap-add SYS_ADMIN \
-v ${STORAGE_LOCATION}:/app/server/storage \
-v ${STORAGE_LOCATION}/.env:/app/server/.env \
-e STORAGE_DIR="/app/server/storage" \
REGISTRY/mission-llm:latest
```
Windows (PowerShell):
```powershell
$env:STORAGE_LOCATION="$HOME\Documents\missionllm"; `
If(!(Test-Path $env:STORAGE_LOCATION)) {New-Item $env:STORAGE_LOCATION -ItemType Directory}; `
If(!(Test-Path "$env:STORAGE_LOCATION\.env")) {New-Item "$env:STORAGE_LOCATION\.env" -ItemType File}; `
docker run -d --rm -p 3001:3001 `
--cap-add SYS_ADMIN `
-v "$env:STORAGE_LOCATION`:/app/server/storage" `
-v "$env:STORAGE_LOCATION\.env:/app/server/.env" `
-e STORAGE_DIR="/app/server/storage" `
REGISTRY/mission-llm:latest;
```
Notes:
- Open http://localhost:3001 once the container is running.
- To turn off telemetry from the first start, add `-e DISABLE_TELEMETRY="true"` before the image name.
- Model runtime on the same machine: in Mission LLM, use `http://host.docker.internal:PORT` instead of `localhost`. On Linux, also add `--add-host=host.docker.internal:host-gateway` to the run command.

#### Docker Compose
Summary: The same container as a managed service that restarts automatically.
```yaml
services:
  missionllm:
    image: REGISTRY/mission-llm:latest
    container_name: missionllm
    ports:
      - "3001:3001"
    cap_add:
      - SYS_ADMIN
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - STORAGE_DIR=/app/server/storage
      - JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_STRING
      - DISABLE_TELEMETRY=true
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_PATH=http://host.docker.internal:11434
      - OLLAMA_MODEL_PREF=llama3.1:8b
      - OLLAMA_MODEL_TOKEN_LIMIT=4096
      - EMBEDDING_ENGINE=ollama
      - EMBEDDING_BASE_PATH=http://host.docker.internal:11434
      - EMBEDDING_MODEL_PREF=nomic-embed-text:latest
      - EMBEDDING_MODEL_MAX_CHUNK_LENGTH=8192
      - VECTOR_DB=lancedb
      - WHISPER_PROVIDER=local
      - TTS_PROVIDER=native
      - PASSWORDMINCHAR=8
    volumes:
      - missionllm_storage:/app/server/storage
    restart: always

volumes:
  missionllm_storage:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/on/local/disk
```
```shell
docker compose up -d
```
Note: Any setting from `docker/.env.example` can go in the `environment` list.

#### Build from source
Summary: Build the image yourself from the repository. This is the supported path today.
```shell
git clone https://github.com/jordan-pesavento/mission-llm.git mission-llm
cd mission-llm
docker build -f docker/Dockerfile -t mission-llm:latest .
```
Then run it with the Docker command above, using `mission-llm:latest` as the image name. Or build and run with Compose from the repository:
```shell
touch server/storage/missionllm.db
cd docker
cp .env.example .env
docker-compose up -d --build
```
Note: The build downloads packages from the internet. For a disconnected site, build on a connected machine and move the image across with your approved transfer process.

#### Kubernetes
Summary: An example manifest with a persistent volume, deployment, service and ingress.
1. Set `image` to the image in your registry.
2. Replace the volume placeholder with storage that fits your cluster. The example uses an AWS EBS volume.
3. Apply it:
```shell
kubectl apply -f cloud-deployments/k8/manifest.yaml
```

#### Helm
Summary: A chart with ConfigMap settings, Secret references, persistent storage, and Ingress and Gateway API support. Telemetry is off by default in the chart.

`values-secret.yaml`:
```yaml
image:
  repository: REGISTRY/mission-llm
  tag: "latest"

service:
  type: ClusterIP
  port: 3001

envFrom:
  - secretRef:
      name: missionllm-secrets

persistentVolume:
  size: 16Gi
```
```shell
cd cloud-deployments/helm/charts
helm install my-missionllm ./missionllm -f values-secret.yaml
```
Note: Keep API keys and other secrets in Kubernetes Secrets. The chart's `config` values render to a ConfigMap, which is not encrypted.

#### OpenShift
Summary: A dedicated image for restricted security context constraints, arbitrary user IDs and GID 0. The template is community-maintained.
```shell
docker build -f cloud-deployments/openshift/Dockerfile -t REGISTRY/missionllm:openshift .
docker push REGISTRY/missionllm:openshift
oc new-project missionllm
oc new-app REGISTRY/missionllm:openshift
oc expose svc/missionllm --port=3001
oc set env deployment/missionllm \
  STORAGE_DIR=/app/server/storage \
  JWT_SECRET=$(openssl rand -hex 32)
```

#### Cloud templates
- AWS CloudFormation: one EC2 instance running the container.
- Google Cloud Deployment Manager: one Compute Engine VM.
- DigitalOcean Terraform: one Droplet.
- Hugging Face Spaces: a Dockerfile for evaluation in a Space.

Note: Each template pulls the image you name and serves HTTP on port 3001 without TLS. Add TLS and a password before you expose it.

#### Without containers
Running directly on Node.js 18 or later with Yarn 1.x is documented for reference only and is not a supported deployment method.

### After you install
1. Open http://localhost:3001, or your server's address on port 3001.
2. In onboarding, choose your model provider. Documents are embedded with the built-in embedder and stored in the built-in LanceDB store by default. You can change both in Settings.
3. Choose "Just me" to set a password, or "My team" to turn on multi-user mode, before anyone else can reach the server.
4. Confirm `DISABLE_TELEMETRY="true"` is set in the server environment.
5. Create a workspace and add your documents.

---

## Security (`/security`)

Meta title: "Security and deployment | Mission LLM"
Meta description: "Where your data goes in Mission LLM, the controls available today, what is in development, and how to harden an install."

### Hero
- Eyebrow: Security
- Heading: **Security and deployment overview.**
- Body: Mission LLM runs inside your boundary. This page covers where data goes, which controls ship today, which are in development, and how to harden an install.
- Callout: "Mission LLM does not hold any government certification or authorization today. Because it runs on your infrastructure, you assess it as part of your own system."

### Data flow in plain language

#### Stays on your server
- Uploaded documents and the text parsed from them.
- Embeddings, when you use the built-in embedder and the built-in LanceDB store.
- Chat history, workspaces, users, API keys and the event log, in a SQLite database in your storage volume.

All of it lives in the storage directory you mount, so your existing backup and encryption-at-rest controls apply.

#### Leaves only when you configure it
- **Cloud language model:** the question, recent chat history and retrieved passages go to that provider.
- **Cloud embedding engine:** document text goes to that provider to be embedded.
- **Hosted vector database:** vectors and passage text are stored with that service.
- **Agent skills, MCP servers and data connectors:** each contacts the service you point it at, such as a search provider, a database or a Git server.

The Privacy and Data page in Settings shows how each configured provider handles your data.

#### Other outbound connections
| Connection | When | What is sent | How to avoid it |
| --- | --- | --- | --- |
| Telemetry (the upstream project's analytics account) | On boot and during use, unless disabled | Anonymous usage events, such as which provider types are selected | Set `DISABLE_TELEMETRY="true"` before the first start |
| models.dev | At boot, when the pricing cache is missing or older than three days | A request for public model pricing data | Block it. The server logs the failure and keeps running. |
| raw.githubusercontent.com | At boot, when the context-window cache is missing or stale | A request for public model context-window data | Block it, and set token limits for local models in their provider settings |
| Hugging Face, then cdn.anythingllm.com | First use of the built-in embedder or reranker | A model file download | Stage the models under `storage/models` |
| Hugging Face | First local audio transcription | A Whisper model download | Stage the model under `storage/models` |
| OCR language data | First OCR of an image or scanned PDF | A language data download by the OCR library | Stage the data under `storage/models/tesseract` |
| Community Hub (hub.external.anythingllm.com) | Only when an admin browses or imports items | Browse and import requests | Do not open the Community Hub pages |
| Onboarding survey (onboarding.anythingllm.com) | Only if someone fills it in and submits it, from their browser | The email, use case and comment entered | Leave the survey blank |

Footnote: "An offline mode switch that turns all of these off at once is in development."

### Controls available today

#### Access
- **Authentication:** a single password, or multi-user mode with individual accounts. You choose during onboarding.
- **Roles:** admin, manager and default. Default users chat only in the workspaces they are assigned to.
- **Account controls:** invitations, suspension and per-user daily message limits.
- **Password complexity:** minimum and maximum length and required character types, set with `PASSWORDMINCHAR`, `PASSWORDREQUIREMENTS` and related variables.
- **Simple SSO passthrough:** sign users in with temporary tokens issued through your own identity bridge (`SIMPLE_SSO_ENABLED`).

#### Oversight
- **Admin event log:** sign-ins, failed sign-ins, attempts on suspended accounts, changes to users, invites and API keys, workspace and document changes, and chat exports.
- **Chat history export:** CSV, JSON or JSONL.
- **Hide chat history** from the interface: `DISABLE_VIEW_CHAT_HISTORY`.
- **Workspace deletion protection:** `WORKSPACE_DELETION_PROTECTION`.

#### Transport and runtime
- **Built-in HTTPS** with your certificate and key (`ENABLE_HTTPS`, `HTTPS_CERT_PATH`, `HTTPS_KEY_PATH`), or TLS at your own reverse proxy.
- **The container runs as a non-root user** (UID 1000 by default) and has a health check.
- **The Helm chart** keeps credentials in Kubernetes Secrets and ships with telemetry off.

#### Integrations
- **Developer API:** admin-issued API keys, OpenAPI documentation at `/api/docs`, and OpenAI-compatible endpoints.
- **Agent tools:** admins turn each agent skill and MCP server on or off.

### Hardening an install today
1. Set `DISABLE_TELEMETRY="true"` before the first start.
2. Set a password or turn on multi-user mode before anyone else can reach the server. Without either, anyone who can reach the address can use the instance.
3. Publish port 3001 only on the interface you intend. Put TLS in front of it with `ENABLE_HTTPS` or your reverse proxy.
4. For disconnected use, choose local providers for chat, embeddings and vector storage, and stage the built-in models under `storage/models`.
5. Set password complexity rules.
6. Keep provider keys and secrets out of shared configuration. In Kubernetes, use Secrets.
7. Mount storage on a volume that your backup and encryption controls already cover.

### In development
Intro: "These items are not in the current release. They move to 'Available today' only when they ship. Dates are not published."

#### Identity and access
- Single sign-on with OIDC and SAML 2.0, with group-to-role mapping.
- SCIM provisioning and deprovisioning.
- Smart card (PIV and CAC) sign-in.
- Multi-factor authentication (TOTP) and revocable sessions with idle timeout.
- Permission-based roles, workspace-level roles and groups.
- Sign-in protection and a lockout policy.
- A system use notice at sign-in and a configurable classification banner.

#### Audit and oversight
- An attributable, tamper-evident audit trail with syslog, webhook and file forwarding.
- Filterable, exportable event logs with a retention setting.
- Usage and cost reporting with budgets.

#### Data protection
- An encrypted secrets store.
- API key scopes, expiry and rate limits.
- Model policy: provider allow-lists, local-only workspaces, and redaction before external calls.
- Agent tool policy: tool profiles for each workspace and one approval policy.
- Retention rules, legal hold and scoped eDiscovery export.
- Backup and restore.

#### Disconnected operations
- An offline mode switch and an outbound connections report.
- Telemetry off by default.
- A model mirror setting for internal model hosting.
- An offline distribution kit with signed release bundles.

#### Hardening
- Hardened HTTP defaults.

#### Answer quality
- Strict grounding in Query mode, inline citations with page references, and hybrid keyword and vector search.

#### Accessibility
- A Section 508 and WCAG 2.2 AA conformance pass.

### Reporting a vulnerability
Body: Report suspected vulnerabilities privately to the Mission LLM maintainers at `mailto:security@example.com` <!-- TODO: real security contact -->. Please do not open a public issue.

---

## Editions (`/editions`)

Meta title: "Editions | Mission LLM"
Meta description: "Mission LLM Community is free to self-host. Mission LLM Enterprise adds support, deployment help and planned governance features."

### Hero
- Eyebrow: Editions
- Heading: **Start free. Add governance and support when you need them.**
- Body: Mission LLM Community is the full application you can run today. Mission LLM Enterprise is for organizations that need support, help deploying on their networks, and the governance features on our roadmap. Pricing is not published yet.

### Community
- Label: Community
- Price line: Free to self-host
- Summary: Everything Mission LLM does today, on your infrastructure.
- Includes:
  - Workspaces, threads and document retrieval with sources.
  - 38 model providers, 10 vector databases and 14 embedding engines.
  - Agents, custom skills, MCP servers and the agent flow builder.
  - Multi-user mode with admin, manager and default roles.
  - Event log, API keys and the developer API.
  - Docker, Compose, Kubernetes, Helm and OpenShift deployment.
- Support: Self-supported. Documentation and an issue tracker will be published with the first release. <!-- TODO: links -->
- Action: Download (`/download`)

### Enterprise
- Label: Enterprise
- Price line: Contact us
- Summary: Community, plus support, deployment help, and our roadmap's governance features as they ship.
- Includes:
  - Everything in Community.
  - Deployment assistance, including disconnected and restricted networks. <!-- TODO: confirm offering -->
  - Support on terms set in your agreement. <!-- TODO: confirm offering -->
- Planned for Enterprise (in development):
  - Single sign-on with OIDC, SAML and smart card sign-in, plus SCIM provisioning.
  - Multi-factor authentication and revocable sessions.
  - Workspace roles, custom roles and groups.
  - A tamper-evident audit trail with SIEM forwarding.
  - Model and tool policy, retention and legal hold.
  - An offline distribution kit with signed release bundles.
- Action: Contact us (`mailto:contact@example.com` <!-- TODO -->)
- Fine print: "Planned features are in development. Which features land in which edition may change before release."

### Comparison
| Capability | Community | Enterprise |
| --- | --- | --- |
| Self-hosted deployment | Included | Included |
| Local and cloud models, per workspace | Included | Included |
| Document retrieval with sources | Included | Included |
| Agents, skills, MCP and flows | Included | Included |
| Multi-user roles and event log | Included | Included |
| Developer API and API keys | Included | Included |
| Support | Self-supported | By agreement |
| Deployment assistance | Not included | Included |
| SSO, SCIM and smart card sign-in | Not included | In development |
| MFA and session controls | Not included | In development |
| Tamper-evident audit trail | Not included | In development |
| Model and tool policy | Not included | In development |
| Retention and legal hold | Not included | In development |

### Questions
- **Is Community free?** Yes. You can self-host it at no cost.
- **Do I need an internet connection?** No. Use a local model runtime and stage the built-in models in advance. The Security page lists every outbound connection.
- **Where is my data stored?** In the storage volume you mount on your own server.
- **Can I move from AnythingLLM?** Yes. Mission LLM upgrades an existing AnythingLLM install in place, including its database and settings.
- **When will the Enterprise features ship?** Dates are not published. A feature moves to "Available today" only when it ships.

---

## 404

- Meta title: "Page not found | Mission LLM"
- Display code: 404
- Heading: **Page not found.**
- Body: The page you asked for does not exist or has moved.
- Links: Home (`/`), Download (`/download`), Security overview (`/security`)

---

## Evidence table

All paths are relative to `D:/OB Vault/mission-llm` unless marked otherwise.

| Claim | Evidence |
| --- | --- |
| 38 user-selectable LLM providers | `frontend/src/pages/GeneralSettings/LLMPreference/index.jsx:106-435` (38 entries; the Model Router is separate at 92-100). `server/utils/helpers/index.js:141-252` (38 provider cases plus `missionllm-router` at 255). `server/utils/AiProviders/` has 40 folders, including `modelMap` and `modelRouter` |
| Per-workspace model override, including for agents; no workspace-level exclusions | `server/prisma/schema.prisma:121-168` (chatProvider, chatModel, agentProvider, agentModel). `frontend/src/pages/WorkspaceSettings/ChatSettings/WorkspaceLLMSelection/index.jsx:22,33` (DISABLED_PROVIDERS empty). `frontend/src/pages/WorkspaceSettings/AgentConfig/AgentLLMSelection/index.jsx` |
| Model Router, rule-based routing | `frontend/src/pages/GeneralSettings/LLMPreference/index.jsx:92-100`. `server/utils/router/index.js`. `frontend/src/pages/GeneralSettings/ModelRouters` |
| Local runtimes named (Ollama, LM Studio, LocalAI, KoboldCPP, NVIDIA NIM, OpenAI-compatible) | `frontend/src/pages/GeneralSettings/LLMPreference/index.jsx:140-197, 251-257, 426-434` (the provider descriptions say "Run LLMs locally") |
| 10 vector databases; LanceDB is the default | `frontend/src/pages/GeneralSettings/VectorDatabase/index.jsx:36-110`. `server/utils/helpers/index.js:84-125` (default `lancedb`). `server/utils/vectorDbProviders/` (10 folders) |
| 14 embedding engines; built-in embedder is the default | `frontend/src/pages/GeneralSettings/EmbeddingPreference/index.jsx:45-145`. `server/utils/helpers/index.js:272-330` (default NativeEmbedder). `server/utils/EmbeddingEngines/` (14 folders) |
| Built-in embedder and LanceDB keep data on the instance | `frontend/src/components/ProviderPrivacy/constants.js:324-338`. `docker/HOW_TO_USE_DOCKER.md:16-18`. `server/utils/vectorDbProviders/lance/index.js:29` |
| Storage layout (documents, lancedb, models, SQLite db) | `server/storage/` (documents, lancedb, models, missionllm.db). `server/prisma/schema.prisma:13-16` |
| Telemetry env var `DISABLE_TELEMETRY="true"` | `server/models/telemetry.js:49-53`. `server/utils/telemetry/index.js:8-14`. `server/utils/helpers/updateENV.js:594-600`. `README.md:108-112` |
| Telemetry goes to the upstream PostHog account; events carry provider selections | `server/models/telemetry.js:11, 51-52`. `server/endpoints/api/openai/index.js:147-153`. `README.md:112` |
| Admin UI telemetry toggle | `frontend/src/pages/GeneralSettings/PrivacyAndData/index.jsx:62-76` |
| Helm chart ships with telemetry off | `cloud-deployments/helm/charts/missionllm/values.yaml:119` |
| Outbound: models.dev pricing at boot, 3-day cache, failure caught | `server/utils/helpers/modelPricing/index.js:69-71, 146-162` |
| Outbound: raw.githubusercontent.com context windows, failure caught | `server/utils/AiProviders/modelMap/index.js:28-30, 42-48, 108` |
| Outbound: Hugging Face, then cdn.anythingllm.com, for embedder and reranker | `server/utils/EmbeddingEngines/native/index.js:37, 138-150`. `server/utils/EmbeddingRerankers/native/index.js:49, 156-164` |
| Outbound: Whisper model from Hugging Face | `collector/utils/WhisperProviders/localWhisper.js:4` |
| Outbound: OCR language data | `collector/utils/OCRLoader/index.js:24-28, 111-121` (cachePath under storage/models/tesseract). `collector/package.json:49` (tesseract.js ^6). The download on first use is the library's default behavior (inferred, not traced in repo code) |
| Outbound: Community Hub only when browsed | `server/models/communityHub.js:8-11`. `server/endpoints/communityHub.js:54`. `README.md:119` |
| Outbound: onboarding survey, from the browser, only if filled in | `frontend/src/utils/constants.js:2`. `frontend/src/pages/OnboardingFlow/Steps/Survey/index.jsx:15-40, 55-79` |
| Pre-stage models for air-gapped use | `README.md:122`. `server/storage/models/README.md` |
| No offline switch yet (roadmap) | `scratchpad/branding-run/verified-top.json` item 3 verdict |
| Docker run commands (Linux/macOS, Windows) | `docker/HOW_TO_USE_DOCKER.md:54-85` (image name swapped for the REGISTRY placeholder) |
| Docker build command | `docker/HOW_TO_USE_DOCKER.md:38-42` |
| Compose example (adapted) | `docker/HOW_TO_USE_DOCKER.md:94-133`. `docker/docker-compose.yml:30-31` (extra_hosts) |
| Compose from source steps | `docker/HOW_TO_USE_DOCKER.md:150-158` |
| host.docker.internal guidance and Docker versions | `docker/HOW_TO_USE_DOCKER.md:22-32, 170-174` |
| Port 3001, localhost:3001 | `docker/HOW_TO_USE_DOCKER.md:139-144`. `server/index.js:80, 205` |
| System requirements (2 GB RAM, 10 GB disk, LLM access) | `docker/HOW_TO_USE_DOCKER.md:5-14`. `BARE_METAL.md:10-16` |
| amd64 and arm64 | `docker/HOW_TO_USE_DOCKER.md:38`. `docker/Dockerfile:8, 77, 131` |
| Build downloads from the internet (NodeSource, Yarn, uv, Chromium on arm64) | `docker/Dockerfile:24, 29, 33, 64` |
| Non-root container user, health check | `docker/Dockerfile:5-6, 57, 134, 164, 177` |
| Kubernetes manifest with image placeholder and EBS volume | `cloud-deployments/k8/manifest.yaml:13-51, 104-106, 183, 210` |
| Helm chart: no default image, ConfigMap vs Secrets, install command, Helm 3 | `cloud-deployments/helm/charts/missionllm/README.md:9-82`. `.../values.yaml:8-12, 44-46, 121, 147-149`. `.../templates/` (configmap, ingress, httproute, pvc). `.../Chart.yaml` (apiVersion v2) |
| OpenShift image for restricted SCCs; community-maintained; commands | `cloud-deployments/openshift/README.md` (notice, key differences, build and `oc` commands) |
| Cloud templates: AWS, GCP, DigitalOcean, HF Spaces; image placeholder; HTTP only | `cloud-deployments/aws/cloudformation/DEPLOY.md:1-5`. `.../cloudformation_create_missionllm.json:92-94`. `cloud-deployments/gcp/deployment/DEPLOY.md:1-12`. `cloud-deployments/digitalocean/terraform/DEPLOY.md:1-8`. `.../user_data.tp1:16-18`. `cloud-deployments/huggingface-spaces/Dockerfile:1-6` |
| Bare metal is reference only; Node 18+, Yarn 1.x | `BARE_METAL.md:3-16` |
| Supported file types | `collector/utils/constants.js:45-86` |
| OCR for scanned PDFs and images; local transcription is the default | `collector/processSingleFile/convert/asPDF/index.js:24-33`. `collector/processSingleFile/convert/asImage.js`. `collector/processSingleFile/convert/asAudio.js:15-31` |
| Data connectors list | `frontend/src/components/Modals/ManageWorkspace/DataConnectors/index.jsx:17-69` |
| Answers list sources only when documents were retrieved (why the grounded band says "when a workspace has documents") | `server/utils/chats/stream.js` (sources are empty with no embedded documents, nothing above the similarity threshold, or a Chat mode answer from model knowledge). `frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/Citation/index.jsx:137` (renders nothing without sources) |
| Sources panel with passages and similarity score | `frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/Citation/index.jsx:111-127, 227-245`. `frontend/src/components/WorkspaceChat/ChatContainer/SourcesSidebar/` |
| Similarity threshold, passage count, Accuracy Optimized (LanceDB only) | `frontend/src/pages/WorkspaceSettings/VectorDatabase/` (DocumentSimilarityThreshold, MaxContextSnippets, VectorSearchMode/index.jsx:5,12-13). `server/prisma/schema.prisma:132-141` |
| Document pinning | `server/prisma/schema.prisma:34`. `frontend/src/locales/en/common.js:1505-1508` |
| Automatic, Chat and Query modes; custom refusal message | `frontend/src/pages/WorkspaceSettings/ChatSettings/ChatModeSelection/index.jsx:21-45`. `frontend/src/locales/en/common.js:205-216`. `frontend/src/pages/WorkspaceSettings/ChatSettings/ChatQueryRefusalResponse` |
| Query mode is not strict after the first turn (why "strict grounding" is listed as in development) | `scratchpad/branding-run/verified-top.json` item 2 (`server/utils/chats/stream.js:215-235`) |
| Inline citations, page refs, open-at-page are not built yet | `scratchpad/branding-run/verified-top.json` item 6 |
| Threads, thread forking, suggested messages | `server/prisma/schema.prisma:154-181`. `server/endpoints/workspaces.js:682, 742` |
| Workspace membership: default users see only assigned workspaces | `server/models/workspace.js:298-313`. `frontend/src/pages/Admin/Users/index.jsx:114-128` |
| Three roles and their permissions | `server/utils/middleware/multiUserProtected.js:3-8`. `server/models/user.js:51-58`. `frontend/src/pages/Admin/Users/index.jsx:114-128` |
| Invites, suspension, daily message limits | `server/prisma/schema.prisma:42-51, 67, 71`. `server/endpoints/system.js:135, 176-180`. `server/endpoints/chat.js:50-57` |
| Password or multi-user choice in onboarding | `frontend/src/pages/OnboardingFlow/Steps/UserSetup/index.jsx:17-76`. `README.md:108` |
| Password complexity env vars | `server/models/user.js:330-337`. `docker/.env.example:412-423` |
| Built-in HTTPS | `server/index.js:79-80`. `server/utils/boot/index.js:29-30`. `docker/.env.example:430-432` |
| DISABLE_VIEW_CHAT_HISTORY, WORKSPACE_DELETION_PROTECTION, SIMPLE_SSO_ENABLED | `docker/.env.example:494-505`. `server/utils/middleware/chatHistoryViewable.js`. `server/utils/middleware/workspaceDeletionProtection.js`. `server/utils/middleware/simpleSSOEnabled.js` |
| Event log events and admin-only page | `server/models/eventLogs.js:4-23`. `server/endpoints/system.js:1138-1175` (admin role). `frontend/src/main.jsx:179`. Event names come from `logEvent` calls across `server/endpoints` (login_event, failed_login_*, user_*, api_key_*, invite_*, workspace_*, document_*, exported_chats, event_logs_cleared) |
| Chat export CSV, JSON, JSONL | `server/utils/helpers/chat/convertTo.js:45-75, 193-197` |
| API keys issued and revoked by admins | `server/endpoints/admin.js:500, 544`. `server/endpoints/system.js:1034, 1087`. `server/models/apiKeys.js` |
| API keys are not scoped or hashed today (why scoped keys are listed as in development) | `scratchpad/branding-run/verified-top.json` item 4 |
| Developer API, Swagger at /api/docs, OpenAI-compatible endpoints | `server/endpoints/api/index.js:11-26`. `server/swagger/utils.js:18-41`. `server/endpoints/api/openai/index.js:19, 77, 196, 291, 358` |
| Built-in agent skills; SQL engines; scheduled jobs are single-user only (omitted from copy) | `frontend/src/pages/Admin/Agents/skills.jsx:32-175`. `server/utils/agents/aibitat/plugins/sql-agent/SQLConnectors/` (MSSQL, MySQL, Postgresql) |
| @agent and Automatic mode | `frontend/src/locales/en/common.js:205-216` |
| MCP over stdio, SSE and streamable HTTP | `server/utils/MCP/hypervisor/index.js:6-12, 385-448` |
| Custom agent skills | `server/utils/agents/imported.js:6-9, 255` |
| No-code agent flow builder | `frontend/src/pages/Admin/AgentBuilder/`. `server/utils/agentFlows/` |
| SearXNG web search | `server/utils/agents/aibitat/plugins/web-browsing.js:90-91, 977`. `docker/.env.example` (AGENT_SEARXNG_API_URL) |
| Admins turn skills and MCP servers on or off | `frontend/src/pages/Admin/Agents/`. `server/endpoints/mcpServers.js` |
| In-place upgrade path from AnythingLLM installs | `server/utils/boot/legacyUpgrade.js:1-40`. Commit `7efcf6b9` message (legacy fallbacks for vector collections and the PGVector table) |
| Documented outbound connections | `README.md:110-122` (partial; see builder note 5) |
| Templates pull only your own image | `cloud-deployments/aws/cloudformation/DEPLOY.md:5`. `cloud-deployments/helm/charts/missionllm/README.md:9` |
| Upstream credit, MIT License | `LICENSE`. `NOTICE`. `README.md:168-174` |
| Vulnerability reporting stays private | `SECURITY.md` ("Reporting a Vulnerability") |
| In-development items | `scratchpad/branding-run/roadmap.json` (quick_wins, core, big_bets, new_products). `scratchpad/branding-run/verified-top.json` |

Spec: `C:/Users/jorda/AppData/Local/Temp/claude/D--OB-Vault/3521ce5e-2448-4950-b754-ab35fb4b4f80/scratchpad/site/SITE-SPEC.md`. Screenshots checked: `.../scratchpad/concept/dir-c/shots/default/1920x1080.png`, `.../dir-c/shots/cite/1920x1080-state_cite.png`, `.../dir-a/shots/empty/1920x1080-state_empty.png`, `.../dir-b/shots/default/1920x1080.png`.
