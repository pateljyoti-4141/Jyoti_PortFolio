const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-toggle__icon');
const savedTheme = localStorage.getItem('jyoti-portfolio-theme');

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '\u263D' : '\u2600';
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    localStorage.setItem('jyoti-portfolio-theme', theme);
}

if (themeToggle && themeIcon) {
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    });
}

const terminalForm = document.querySelector('#terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('#terminal-output');

if (terminalForm && terminalInput && terminalOutput) {
    const commandHistory = [];
    const conversationHistory = [];
    let historyIndex = 0;
    let portfolioGeneratorPromise;
    let customModelConfig;
    const runButton = terminalForm.querySelector('.terminal__submit');
    const modelLoadButton = document.querySelector('#terminal-ai-toggle');
    const llmSettingsButton = document.querySelector('#terminal-llm-settings');
    const clearChatButton = document.querySelector('#terminal-clear');
    const llmSettingsDialog = document.querySelector('#llm-settings');
    const llmSettingsForm = document.querySelector('#llm-settings-form');
    const llmEndpointInput = document.querySelector('#llm-endpoint');
    const llmModelInput = document.querySelector('#llm-model');
    const llmApiKeyInput = document.querySelector('#llm-api-key');
    const llmSettingsStatus = document.querySelector('#llm-settings-status');

    const portfolioContext = [
        'Jyoti Patel is a Software Engineer at Siemens Digital Industries Software specializing in enterprise software engineering, Model-Based Definition (MBD), C++, and CAD automation workflows under manager Manish Warade.',
        'Jyoti works on software architecture, C++ application development, performance optimization, debugging, MBD Business Intelligence (BI) telemetry tracking on SAN servers, and Drawing AI integration ("Accelerate Drawing" and Smart Drawing Checker using ONNX Runtime and AI assistants like GitHub Copilot and MCP).',
        'Jyoti is an Associate Software Engineer from January 2025 to present and was a Graduate Trainee Engineer from July 2024 to January 2025.',
        'Jyoti previously worked as a Technical Content & Engineering Q&A Expert at Chegg from November 2021 to May 2024.',
        'Jyoti earned an M.Tech in Mining Machinery Engineering at IIT (ISM) Dhanbad (2022-2024) with a thesis on Dual Spool Valve Control Systems, and a B.Tech in Mechanical Engineering at KNIT Sultanpur (2017-2021) with a project on Automatic Paper Cutting Machines using the Geneva mechanism.',
        'The skills page covers Languages (C++, Python, Java), Block-Based UI & Frontend (React, HTML5, CSS3, JavaScript, Tailwind), MBD & Backend (MATLAB/Simulink, Code Generation, Node.js, Express, SQL, MongoDB), Core Systems & CS (System Design, DSA, Multithreading, OS, Networks, DBMS), OS & Scripting (Linux, Windows, PowerShell), AI & Infrastructure (ONNX Runtime, ML, DL), and IDEs / Workflow (Visual Studio, VS Code, GitHub Copilot GHCP, Model Context Protocol MCP, Git/GitHub, Unit Testing, Debugging, Profiling, CI/CD).',
        'Contact: pateljyoti05022000@gmail.com. LinkedIn: linkedin.com/in/pateljyoti8991.',
    ].join(' ');

    const commands = {
        help: 'Available commands: help, skills, projects, experience, education, contact, clear. You can also type any question about Jyoti to query the AI.',
        skills: 'Jyoti\'s core software engineering skills include C++, Python, Java, Model-Based Definition (MBD), C++ application development, React, Node.js, ONNX Runtime, Git/GitHub, Visual Studio, VS Code, GHCP, and MCP.',
        projects: 'Key software projects: 1. MBD BI Tracking (SAN server analytics & telemetry). 2. Drawing AI Integration ("Accelerate Drawing" & Smart Drawing Checker). 3. Dual Spool Valve Control System (M.Tech Thesis). 4. Automatic Paper Cutting Machine (B.Tech Project).',
        experience: 'Software Engineer at Siemens Digital Industries Software (MBD Apps, 2024-Present). Previously Technical Expert at Chegg (2021-2024).',
        education: 'M.Tech from IIT (ISM) Dhanbad (2024). B.Tech from KNIT Sultanpur (2021).',
        contact: 'Email: pateljyoti05022000@gmail.com | LinkedIn: linkedin.com/in/pateljyoti8991',
    };

    const questionAliases = {
        'kuchh bhi': 'Give a brief introduction to Jyoti Patel and suggest a portfolio topic the visitor can ask about.',
        anything: 'Give a brief introduction to Jyoti Patel and suggest a portfolio topic the visitor can ask about.',
    };

    function appendTerminalLine(text, className) {
        const line = document.createElement('p');
        line.className = `terminal__line ${className}`;
        line.textContent = text;
        terminalOutput.append(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        while (terminalOutput.childElementCount > 30) {
            terminalOutput.firstElementChild.remove();
        }

        return line;
    }

    function findCommand(input) {
        const normalized = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (normalized === 'clear') return 'clear';
        if (commands[normalized]) return normalized;

        if (normalized.includes('skill')) return 'skills';
        if (normalized.includes('project') || normalized.includes('paper cutting') || normalized.includes('mbd') || normalized.includes('drawing')) return 'projects';
        if (normalized.includes('experienc') || normalized.includes('work') || normalized.includes('siemens') || normalized.includes('chegg')) return 'experience';
        if (normalized.includes('educat') || normalized.includes('college') || normalized.includes('degree') || normalized.includes('iit') || normalized.includes('knit')) return 'education';
        if (normalized.includes('contact') || normalized.includes('email') || normalized.includes('linkedin')) return 'contact';

        return null;
    }

    function clearChat() {
        terminalOutput.replaceChildren();
        conversationHistory.length = 0;
        commandHistory.length = 0;
        historyIndex = 0;
    }

    async function askPortfolioAI(question) {
        const responseLine = appendTerminalLine('Preparing the browser AI model...', 'terminal__line--response');
        const modelConfig = customModelConfig;
        terminalInput.disabled = true;
        if (runButton) runButton.disabled = true;

        try {
            let answer;
            if (modelConfig) {
                responseLine.textContent = 'Sending your question to your model...';
                const response = await fetch(modelConfig.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(modelConfig.apiKey ? { Authorization: `Bearer ${modelConfig.apiKey}` } : {}),
                    },
                    body: JSON.stringify({
                        model: modelConfig.model,
                        messages: [
                            {
                                role: 'system',
                                content: `You are Jyoti Patel's portfolio assistant. Answer concisely using only this profile. If a detail is missing, say so. PROFILE: ${portfolioContext}`,
                            },
                            ...conversationHistory.slice(-8),
                            { role: 'user', content: question },
                        ],
                        max_tokens: 180,
                        temperature: 0.2,
                    }),
                });
                if (!response.ok) throw new Error(`Model endpoint returned ${response.status}`);
                const result = await response.json();
                const content = result?.choices?.[0]?.message?.content;
                answer = Array.isArray(content)
                    ? content.map(part => typeof part === 'string' ? part : part.text || '').join(' ')
                    : content;
                if (typeof answer !== 'string') throw new Error('Model response did not contain chat text');
            } else {
                const generator = await loadPortfolioModel(responseLine);
                responseLine.textContent = 'Thinking...';
                const promptText = `You are Jyoti Patel's portfolio assistant. Answer concisely in 1-2 sentences using only this profile. PROFILE: ${portfolioContext}\nQuestion: ${question}\nAnswer:`;
                const [result] = await generator(promptText, {
                    max_new_tokens: 64,
                    do_sample: false,
                    no_repeat_ngram_size: 3,
                    repetition_penalty: 1.2,
                });
                let genText = result?.generated_text || '';
                answer = genText.replace(/.*Answer:\s*/i, '').trim();
                if (!answer) answer = genText.trim();
            }

            answer = answer.replace(/\s+/g, ' ').trim();
            const unusableAnswer = !answer || answer.length < 5;
            responseLine.textContent = !unusableAnswer
                ? answer
                : 'Jyoti Patel is a Software Engineer at Siemens specializing in C++, Model-Based Definition (MBD), and CAD automation workflows.';
            
            if (!unusableAnswer && modelConfig) {
                conversationHistory.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
                if (conversationHistory.length > 12) conversationHistory.splice(0, conversationHistory.length - 12);
            }
        } catch (error) {
            responseLine.classList.add('terminal__line--error');
            responseLine.textContent = modelConfig
                ? 'Could not reach your model. Check the endpoint and key.'
                : 'Jyoti Patel is a Software Engineer at Siemens specializing in C++, MBD BI tracking, and Drawing AI integration.';
            console.error('Portfolio AI failed:', error);
        } finally {
            terminalInput.disabled = false;
            if (runButton) runButton.disabled = false;
            terminalInput.focus();
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    }

    function loadPortfolioModel(statusLine) {
        if (portfolioGeneratorPromise) return portfolioGeneratorPromise;

        if (modelLoadButton) {
            modelLoadButton.disabled = true;
            modelLoadButton.textContent = 'Loading...';
        }
        statusLine.textContent = 'Downloading the free browser model. First use may take a while...';
        portfolioGeneratorPromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3')
            .then(({ pipeline }) => pipeline('text2text-generation', 'Xenova/flan-t5-small', { dtype: 'q4' }))
            .then(generator => {
                if (modelLoadButton) {
                    modelLoadButton.textContent = 'Local AI ready';
                }
                statusLine.textContent = 'Model ready. Ask a portfolio question or type help.';
                return generator;
            })
            .catch(error => {
                portfolioGeneratorPromise = undefined;
                if (modelLoadButton) {
                    modelLoadButton.disabled = false;
                    modelLoadButton.textContent = 'Load local AI';
                }
                statusLine.classList.add('terminal__line--error');
                statusLine.textContent = 'The browser AI could not load. Check your connection and try again.';
                throw error;
            });

        return portfolioGeneratorPromise;
    }

    if (llmSettingsButton && llmSettingsDialog) {
        llmSettingsButton.addEventListener('click', () => {
            if (llmSettingsStatus) llmSettingsStatus.textContent = '';
            llmSettingsDialog.showModal();
        });
    }

    if (llmSettingsForm) {
        llmSettingsForm.addEventListener('submit', event => {
            event.preventDefault();
            let endpoint;
            try {
                endpoint = new URL(llmEndpointInput.value.trim());
            } catch {
                if (llmSettingsStatus) llmSettingsStatus.textContent = 'Enter a valid chat completions URL.';
                return;
            }
            if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
                if (llmSettingsStatus) llmSettingsStatus.textContent = 'Enter a valid HTTP or HTTPS endpoint without embedded credentials.';
                return;
            }
            if (location.protocol === 'https:' && endpoint.protocol !== 'https:') {
                if (llmSettingsStatus) llmSettingsStatus.textContent = 'Use an HTTPS endpoint when the portfolio is opened over HTTPS.';
                return;
            }

            customModelConfig = {
                endpoint: endpoint.href,
                model: llmModelInput.value.trim(),
                apiKey: llmApiKeyInput.value.trim(),
            };
            conversationHistory.length = 0;
            if (llmApiKeyInput) llmApiKeyInput.value = '';
            if (llmSettingsButton) llmSettingsButton.textContent = 'LLM connected';
            llmSettingsDialog.close();
            appendTerminalLine('Your model is connected. New questions will use it until you switch to the local model.', 'terminal__line--response');
        });
    }

    const llmCancelBtn = document.querySelector('#llm-cancel');
    const llmClearBtn = document.querySelector('#llm-clear');
    if (llmCancelBtn && llmSettingsDialog) {
        llmCancelBtn.addEventListener('click', () => llmSettingsDialog.close());
    }
    if (llmClearBtn) {
        llmClearBtn.addEventListener('click', () => {
            customModelConfig = undefined;
            conversationHistory.length = 0;
            if (llmSettingsForm) llmSettingsForm.reset();
            if (llmSettingsButton) llmSettingsButton.textContent = 'Use your LLM';
            if (llmSettingsStatus) llmSettingsStatus.textContent = 'Connection and key cleared from this tab.';
        });
    }
    if (llmSettingsDialog && llmApiKeyInput) {
        llmSettingsDialog.addEventListener('close', () => {
            llmApiKeyInput.value = '';
        });
    }

    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => {
            clearChat();
            appendTerminalLine('Chat cleared.', 'terminal__line--response');
            terminalInput.focus();
        });
    }

    if (modelLoadButton) {
        modelLoadButton.addEventListener('click', () => {
            customModelConfig = undefined;
            conversationHistory.length = 0;
            if (llmApiKeyInput) llmApiKeyInput.value = '';
            if (llmSettingsButton) llmSettingsButton.textContent = 'Use your LLM';
            const statusLine = appendTerminalLine('Starting the free browser AI model...', 'terminal__line--response');
            loadPortfolioModel(statusLine).catch(error => console.error('Portfolio AI failed to load:', error));
        });
    }

    terminalForm.addEventListener('submit', event => {
        event.preventDefault();
        const command = terminalInput.value.trim();
        if (!command) return;

        appendTerminalLine(`$ ${command}`, 'terminal__line--command');
        commandHistory.push(command);
        historyIndex = commandHistory.length;

        const commandName = findCommand(command);
        if (commandName === 'clear') {
            clearChat();
        } else if (commandName) {
            appendTerminalLine(commands[commandName], 'terminal__line--response');
        } else {
            const normalizedQuestion = command.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            askPortfolioAI(questionAliases[normalizedQuestion] || command);
        }

        terminalInput.value = "";
    });

    terminalInput.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp' && commandHistory.length) {
            event.preventDefault();
            historyIndex = Math.max(0, historyIndex - 1);
            terminalInput.value = commandHistory[historyIndex];
        } else if (event.key === 'ArrowDown' && historyIndex < commandHistory.length - 1) {
            event.preventDefault();
            historyIndex += 1;
            terminalInput.value = commandHistory[historyIndex];
        } else if (event.key === 'ArrowDown' && historyIndex === commandHistory.length - 1) {
            event.preventDefault();
            historyIndex = commandHistory.length;
            terminalInput.value = '';
        }
    });
}
