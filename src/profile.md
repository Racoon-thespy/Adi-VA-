# About Aditya Pratap Singh

Aditya Pratap Singh (goes by Aditya) is a 22-year-old engineer from Lucknow, currently based in Hyderabad. He graduated in 2026 with a B.Tech in Electronics and Communication Engineering from the Indian Institute of Information Technology (IIIT) Guwahati, and he currently works as a QA Intern at Equal AI.

He has a broad skill set, from web development to AI engineering, with a focus on voice AI and agentic systems. Working in QA has put him in every step of the software development lifecycle, so he sees how a product is built end to end. He has worked at both B2B and B2C product companies, and he says that wider context makes him stronger in each individual skill.

His portfolio is film-themed ("Absolute Cinema"), where his work is presented as "reels" and his bio as a "Director's Statement". His motto on the site is "Think logical, Paint Visceral".

## What he is looking for

- Roles in AI engineering, backend engineering, or frontend engineering. His manual and automated QA background makes him a strong fit for those roles too.
- He is most drawn to AI-focused organizations, because working close to AI is what he enjoys most.
- He is open to remote work and willing to relocate for the right opportunity.
- For timing or availability, visitors should contact him directly.

## Experience

### Equal AI: QA Intern (May 2026 to present)

Equal AI is a B2C AI product with over 1.5 million daily active users. Aditya owns QA for its Android app end to end.

- Took QA for the product from manual testing to fully automated testing, and set up the automation.
- Automated UI testing with Maestro. He uses Claude as an orchestrator, with markdown context files, to generate the Maestro test files.
- Extended those tests with Composeproof, a tool built by a colleague, which checks beneath the UI as well, running JVM tests for the Jetpack Compose app so the Android app works flawlessly.
- Built automated regression testing with observability checks between releases, to catch issues before they reach production.
- Investigated product analytics issues using event-level data validation, tracing root causes back to gaps in instrumentation.
- Turned product requirement documents into structured test coverage and tracked engineering tickets.
- Wrote structured test cases and drove cross-functional sign-off with Product.
- Working alongside the product team, he learned how products are made: experiments, user behavior, data, and how user cohorts behave and can be optimized for growth.

### Dialflo: Full Stack Engineer Intern, AI-focused (January 2026 to May 2026)

- Architected no-code workflow systems for configuring AI task assistants, improving client onboarding efficiency by 83 percent.
- Led a dashboard and website revamp using React and REST APIs, cutting page load time by 30 percent.
- Built a prompt-evaluation framework that reduced the AI assistant failure rate by up to 20 percent.
- Worked on backend services, including optimizing how data is transferred, using FastAPI, PostgreSQL and Docker.
- Built voice agents for multiple use cases. They were LiveKit-based agents handling inbound and outbound phone calls, using a cascade design: speech-to-text captures the caller, a language model with the agent's full context decides the reply, and text-to-speech speaks it. He got exposure to the telephony and VoIP layer, and his main contribution was writing and refining the agents' prompts, since the infrastructure was already in place.

### IISPPR: AI solutions for the public domain

IISPPR is an NGO that builds AI solutions for public-interest problems, such as making research and knowledge more accessible. Aditya worked on a summarization agent that uses a knowledge base of multiple research papers so the public can access that research more easily.

## Projects

### Contract Intelligence System (August 2025)
A GenAI-powered contract lifecycle management platform that automates contract ingestion, semantic search, and lifecycle tracking across more than 500 document types. It uses multi-modal parsing and LLM-based clause extraction, which cut review time from about four hours to under ninety minutes. It runs as microservices built with Python, FastAPI, React, PostgreSQL and Docker, and kept 99 percent uptime over a three-month production window.

### Universal Knowledge Agent (September 2025)
A document-intelligence chatbot that answers questions from uploaded PDFs, from web search, or from both. It uses retrieval-augmented generation (RAG): documents are chunked and embedded, stored in a FAISS vector index, and the most relevant passages are retrieved before the answer is generated. A routing step decides whether a question needs the documents, the web, or both. Built with Python, Google Gemini, LangChain, sentence-transformer embeddings, Serper search with a DuckDuckGo fallback, and Streamlit. The vector store persists, so documents are not reprocessed each time. The code is on his GitHub.

### Deep Research Sequential Agent
A Python multi-agent research system. Given a company, it gathers information from the web and from dataset platforms such as Kaggle, Hugging Face and GitHub, identifies relevant datasets, proposes potential AI and machine-learning use cases, compares findings against market standards, and produces a structured research report with references. He built it to explore breaking a complex research task into specialized stages instead of relying on one prompt. It has a command-line and a Streamlit interface, configurable research depth, logging, and saved outputs. The code is on his GitHub.

### This voice agent
The assistant the visitor is talking to. Aditya built it as a learning project while returning to AI engineering. The browser records speech, Whisper on Cloudflare Workers AI transcribes it, a Llama model answers using this profile, and a text-to-speech model speaks the reply. It runs on a Cloudflare Worker written in TypeScript, with layered defenses against prompt injection: a tightly scoped prompt, input and output limits, rate limiting, and no tools or secrets available to the model.

## Skills

Where he is strongest day to day right now: QA and test automation. His AI/ML and full-stack skills are real and have been used in internships and projects, and he is actively sharpening them with new work.

- **Languages:** Python, Java, JavaScript, SQL, C, HTML and CSS.
- **AI and ML:** LangChain, LangGraph, FAISS, Google ADK, PyTorch, TensorFlow, scikit-learn, Hugging Face, RAG, multi-agent systems, and voice agents with LiveKit.
- **Web and backend:** FastAPI, React, REST APIs, WebSockets, Streamlit.
- **Data and infrastructure:** PostgreSQL, MongoDB, Docker, AWS (EC2 and S3), Git, CI/CD.
- **Testing and QA:** Maestro, Pytest, Selenium, Composeproof, Firebase Test Lab, Flocon, adb and logcat, and prompt and LLM evaluation.
- **Product analytics and tools:** Mixpanel, Statsig, Jira, Confluence, Figma.

## Education and leadership

- B.Tech in Electronics and Communication Engineering, IIIT Guwahati, 2022 to 2026.
- Team Lead for Media and Publicity (content) at Yuvaan 2024, the institute's annual cultural fest, leading an eight-member team.
- Team Head for Media and Publicity at Entropy 2024, the institute's tech fest, leading sponsor coordination and promotional campaigns.

## Beyond code

- **Music:** he is a percussionist. Tabla is his main instrument, he loves the cajon, and he is learning drums. He played in a band at school and in college.
- **Photography:** an amateur photographer.
- **Writing:** he writes for his own muse, and is thinking about writing film scripts and combining that with cinematography.
- The creative reels on his portfolio (photography, writing, videography, music) are still marked "coming soon".

## Contact

- Email: pratapsinghaditya82@gmail.com
- LinkedIn: linkedin.com/in/aditya-pratap-singh67
- GitHub: github.com/Racoon-thespy
