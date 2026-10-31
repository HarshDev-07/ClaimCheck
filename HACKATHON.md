## Team Name

**White Collar**

## Team Members

1. **Shivam**
2. **Harsh**
3. **Tushar**

## Selected Problem Statement

**Evidence-Based Open Source Issue and Pull Request Triage**

## Problem Description

Develop an AI-assisted system that evaluates technical claims submitted through GitHub Issues and Pull Requests by analyzing repository source code, technical documentation, and reproducible test evidence.

The proposed solution aims to make open-source contribution workflows more reliable by assessing claims and classifying them into three categories:

- **Verified:** The claim is supported by available technical evidence.
- **Refuted:** The claim is contradicted by the available evidence.
- **Unverifiable:** There is insufficient evidence to reach a reliable conclusion.

The system will prioritize evidence-based analysis, transparency, and explainability to help maintainers make more informed decisions during issue and pull request triage.

## AI Models and Tools Used

### 1. Google Gemma 4

**Purpose:** Core AI model for technical claim extraction, analysis, and structured reasoning.

**Reason for Selection:** Gemma 4 was selected as the primary AI model for ProofPulse because of its reasoning and coding capabilities, along with its suitability for local deployment. It will help analyze GitHub Issues and Pull Requests, identify technical claims, understand repository context, and generate structured outputs for the verification process.

**Role in the Project:**
- Extract individual technical claims from GitHub Issues and Pull Requests.
- Analyze issue descriptions and relevant technical information.
- Convert extracted claims into structured JSON for further processing.
- Summarize supporting evidence and explain verification results.
- Highlight claims that require additional information or investigation.

### 2. Claude

**Purpose:** Brainstorming, planning, and architectural exploration.

**Reason for Selection:** Claude was used to explore potential solutions, understand project requirements, evaluate possible approaches, and develop the initial project architecture.

### 3. ChatGPT

**Purpose:** Brainstorming, problem-solving, and development planning.

**Reason for Selection:** ChatGPT was used to refine project ideas, break down complex requirements, explore technical implementation strategies, and structure the development workflow.

### 4. GitHub Copilot

**Purpose:** Code editing and development assistance.

**Reason for Selection:** GitHub Copilot was selected to assist with code generation, editing, debugging, and improving development efficiency throughout the implementation process.

### 5. Perplexity

**Purpose:** Technical research and information gathering.

**Reason for Selection:** Perplexity was used to research the selected problem statement, understand its technical background, explore relevant technologies, and gather supporting information for implementation decisions.

## Project Goal

To build an intelligent, evidence-driven GitHub triage solution that evaluates technical claims using repository context and reproducible evidence, helping open-source maintainers make accurate, transparent, and informed decisions.

The system will combine AI-assisted analysis with deterministic source-code checks and reproducible testing to ensure that verification results are supported by actual evidence rather than AI-generated assumptions.

## Project Tagline

**"Don't Trust the Claim. Verify the Evidence."**
