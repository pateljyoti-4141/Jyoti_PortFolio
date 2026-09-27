
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-toggle__icon');
const savedTheme = localStorage.getItem('jyoti-portfolio-theme');

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeIcon.textContent = theme === 'dark' ? '\u263D' : '\u2600';
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    localStorage.setItem('jyoti-portfolio-theme', theme);
}

setTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
});

const terminalForm = document.querySelector('#terminal-form');
const terminalInput = document.querySelector('#terminal-input');
const terminalOutput = document.querySelector('#terminal-output');

if (terminalForm && terminalInput && terminalOutput) {
    const commandHistory = [];
    let historyIndex = 0;
    let portfolioGeneratorPromise;
    const runButton = terminalForm.querySelector('.terminal__submit');
    const portfolioContext = [
        'Jyoti Patel is a software engineer at Siemens Digital Industries Software.',
        'Jyoti works on Model-Based Definition in Siemens Design Center, including C++, CAD workflows, automation, debugging, and performance optimization.',
        'Jyoti is an Associate Software Engineer from January 2025 to present and was a Graduate Trainee Engineer from July 2024 to January 2025.',
        'Jyoti previously worked as a Mechanical Engineering Q&A Expert at Chegg from November 2021 to May 2024.',
        'Jyoti earned an M.Tech in Mining Machinery Engineering at IIT (ISM) Dhanbad from 2022 to 2024 and a B.Tech in Mechanical Engineering at KNIT Sultanpur from 2017 to 2021.',
        'The portfolio lists C++, Python, Java, React, Node.js, Docker, AI, CAD, and systems engineering.',
        'Featured projects are AI Engine, Core System, and Vision API.',
        'Contact: pateljyoti05022000@gmail.com. LinkedIn: linkedin.com/in/pateljyoti8991.',
    ].join(' ');
    const commands = {
        help: 'Commands: help, about, skills, projects, contact, clear, ask <question>. The local AI model downloads on first ask.',
        about: 'Jyoti Patel is a software engineer focused on high-performance systems and practical AI solutions.',
        skills: 'Languages: C++, Python, Java. Focus areas: backend engineering, system design, and AI/ML.',
        projects: 'Featured projects: AI Engine, Core System, and Vision API. Open the Projects page to explore them.',
        contact: 'Reach Jyoti at hello@jyoti.dev or open the Contact page.',
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

    async function askPortfolioAI(question) {
        const responseLine = appendTerminalLine('Loading the free browser AI model. First use downloads model files...', 'terminal__line--response');
        terminalInput.disabled = true;
        runButton.disabled = true;

        try {
            if (!portfolioGeneratorPromise) {
                portfolioGeneratorPromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3')
                    .then(({ pipeline }) => pipeline('text2text-generation', 'Xenova/flan-t5-small', { dtype: 'q4' }))
                    .catch(error => {
                        portfolioGeneratorPromise = undefined;
                        throw error;
                    });
            }

            const generator = await portfolioGeneratorPromise;
            responseLine.textContent = 'Thinking...';
            const [result] = await generator(
                `Answer the visitor's question about Jyoti Patel using only the PROFILE. If a detail is missing, say it is not listed. Keep the answer concise. PROFILE: ${portfolioContext} QUESTION: ${question}`,
                { max_new_tokens: 96, do_sample: false },
            );
            responseLine.textContent = result.generated_text.trim() || 'I could not find that detail in the portfolio.';
        } catch (error) {
            responseLine.classList.add('terminal__line--error');
            responseLine.textContent = 'The browser AI could not load. Check your connection and try again.';
            console.error('Portfolio AI failed to load or respond:', error);
        } finally {
            terminalInput.disabled = false;
            runButton.disabled = false;
            terminalInput.focus();
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    }

    terminalForm.addEventListener('submit', event => {
        event.preventDefault();
        const command = terminalInput.value.trim();
        if (!command) return;

        appendTerminalLine(`$ ${command}`, 'terminal__line--command');
        commandHistory.push(command);
        historyIndex = commandHistory.length;

        const normalizedCommand = command.toLowerCase();
        if (normalizedCommand === 'clear') {
            terminalOutput.replaceChildren();
        } else if (/^ask(?:\s|$)/i.test(command)) {
            const question = command.replace(/^ask\s*/i, '').trim();
            if (question) {
                askPortfolioAI(question);
            } else {
                appendTerminalLine('Usage: ask <question about Jyoti or this portfolio>', 'terminal__line--error');
            }
        } else {
            appendTerminalLine(commands[normalizedCommand] || `Command not found: ${command}. Type "help" to see available commands.`, commands[normalizedCommand] ? 'terminal__line--response' : 'terminal__line--error');
        }

        terminalInput.value = '';
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

