import { useState } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';

const LANGUAGE_MAP = {
    javascript: 63,
    python: 71,
    java: 62,
};

function App() {
    const [code, setCode] = useState('// Write your solution here');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('python');
    const [isLoading, setIsLoading] = useState(false);

    const problem = {
        title: 'Reverse a String',
        description: `Write a function that takes a string as input and returns the string reversed.

Example:
Input: "hello"
Output: "olleh"`,
        testCases: [
            { input: 'hello', expectedOutput: 'olleh' },
            { input: 'racecar', expectedOutput: 'racecar' },
            { input: 'world', expectedOutput: 'dlrow' },
        ],
    };

    const decode = (str) => (str ? atob(str).trim() : '');

    const runCode = async () => {
        setIsLoading(true);
        setOutput('');

        const results = [];

        for (const test of problem.testCases) {
            try {
                const response = await axios.post(
                    'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true',
                    {
                        source_code: btoa(code),
                        language_id: LANGUAGE_MAP[language],
                        stdin: btoa(test.input),
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RapidAPI-Key': 'REPLACE_WITH_YOUR_KEY',
                            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                        },
                    }
                );

                const actualOutput = decode(response.data.stdout || response.data.stderr);
                const expectedOutput = test.expectedOutput.trim();
                const passed = actualOutput === expectedOutput;

                results.push({
                    input: test.input,
                    expected: expectedOutput,
                    actual: actualOutput,
                    passed,
                });
            } catch (err) {
                results.push({
                    input: test.input,
                    expected: test.expectedOutput,
                    actual: 'Error',
                    passed: false,
                });
            }
        }

        const formatted = results
            .map(
                (r, i) =>
                    `Test Case ${i + 1}:
Input: ${r.input}
Expected: ${r.expected}
Actual: ${r.actual}
Result: ${r.passed ? '✅ Pass' : '❌ Fail'}`
            )
            .join('\n\n');

        setOutput(formatted);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-10 px-6 py-4 mb-4">
                <h1 className="text-3xl font-bold text-center text-green-700">
                    Interview Platform
                </h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 pb-10">
                <div className="bg-white border rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        {problem.title}
                    </h2>
                    <pre className="text-gray-600 whitespace-pre-wrap leading-relaxed text-base">
            {problem.description}
          </pre>
                </div>

                <div className="flex flex-col gap-4">
                    <select
                        className="border px-3 py-2 rounded text-gray-800 font-medium w-fit bg-white"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                    </select>

                    <MonacoEditor
                        height="400px"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                    />

                    <button
                        onClick={runCode}
                        disabled={isLoading}
                        className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded w-fit ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading ? 'Running...' : 'Run Code'}
                    </button>

                    <div className="bg-white border rounded-xl p-4 shadow-lg">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Output:</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{output}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;