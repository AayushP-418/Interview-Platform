import { useState, useEffect } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';

const LANGUAGE_MAP = {
    javascript: 63,
    python: 71,
    java: 62,
    c: 50,
    cpp: 54,
    sql: 82,
};

const STARTER_CODE = {
    python: `//Enter code below
def reverse_string(s):`,

    java: `//Enter code below
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

    }
}`,

    javascript: `//Enter code below`,

    c: `//Enter code below`,

    cpp: `//Enter code below`,

    sql: `-- Write your SQL query here`
};

function App() {
    const [code, setCode] = useState(STARTER_CODE['python']);
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('python');
    const [isLoading, setIsLoading] = useState(false);
    const [showSubmitResult, setShowSubmitResult] = useState(false);

    useEffect(() => {
        setCode(STARTER_CODE[language]);
    }, [language]);

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

    const decode = (str) => {
        try {
            return atob(str || '').trim();
        } catch {
            return '';
        }
    };

    const runCode = async () => {
        setIsLoading(true);
        setOutput('Running single test with first input...');
        setShowSubmitResult(false);

        const test = problem.testCases[0];

        try {
            const response = await axios.post(
                'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true',
                {
                    source_code: btoa(code),
                    language_id: LANGUAGE_MAP[language],
                    stdin: btoa(test.input + '\n'),
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': 'YOUR KEY HERE',
                        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                    },
                }
            );

            const stdout = decode(response.data.stdout);
            const stderr = decode(response.data.stderr);
            const actualOutput = stdout || stderr || 'No output';

            setOutput(`Input: ${test.input}\nExpected: ${test.expectedOutput}\nActual: ${actualOutput}`);
        } catch (err) {
            setOutput('Execution error');
        } finally {
            setIsLoading(false);
        }
    };

    const submitCode = async () => {
        setIsLoading(true);
        setOutput('');
        setShowSubmitResult(true);

        const results = [];

        for (const test of problem.testCases) {
            try {
                const response = await axios.post(
                    'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true',
                    {
                        source_code: btoa(code),
                        language_id: LANGUAGE_MAP[language],
                        stdin: btoa(test.input + '\n'),
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RapidAPI-Key': 'YOUR KEY HERE',
                            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                        },
                    }
                );

                const stdout = decode(response.data.stdout);
                const stderr = decode(response.data.stderr);
                const actualOutput = stdout || stderr || 'No output';
                const expectedOutput = test.expectedOutput.trim();
                const passed = actualOutput === expectedOutput;

                results.push({ input: test.input, expected: expectedOutput, actual: actualOutput, passed });
            } catch (err) {
                results.push({ input: test.input, expected: test.expectedOutput, actual: 'Execution error', passed: false });
            }
        }

        const formatted = results.map((r, i) => `Test Case ${i + 1}:\nInput: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\nResult: ${r.passed ? '✅ Pass' : '❌ Fail'}`).join('\n\n');

        setOutput(formatted);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-10 px-6 py-4 mb-4">
                <h1 className="text-3xl font-bold text-center text-green-700">Interview Platform</h1>
            </header>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">{problem.title}</h2>
                    <pre className="text-gray-600 whitespace-pre-wrap leading-relaxed text-base">{problem.description}</pre>
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
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="sql">SQL</option>
                    </select>

                    <MonacoEditor
                        height="400px"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                    />

                    <div className="flex gap-4">
                        <button
                            onClick={runCode}
                            disabled={isLoading}
                            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded ${
                                isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            Run Code
                        </button>

                        <button
                            onClick={submitCode}
                            disabled={isLoading}
                            className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded ${
                                isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            Submit
                        </button>
                    </div>

                    <div className="bg-white border rounded-xl p-4 shadow-lg">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">{showSubmitResult ? 'Submission Result:' : 'Output:'}</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{output}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
