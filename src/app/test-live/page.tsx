"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GeminiLiveClient } from '@/lib/gemini-live-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestLive() {
    const [apiKey, setApiKey] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [client, setClient] = useState<GeminiLiveClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Try to load from env
        const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (envKey) setApiKey(envKey);
        else addLog("WARN: No env key found.");
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [new Date().toISOString().split('T')[1].slice(0, 8) + ": " + msg, ...prev]);
    };

    const connect = () => {
        if (!apiKey) {
            addLog("ERROR: No API Key provided.");
            return;
        }

        const systemInstruction = `You are a test assistant. Say "Hello, I am alive" when you see a face.`;
        const newClient = new GeminiLiveClient({ apiKey, systemInstruction });

        newClient.on('connected', () => {
            addLog("SUCCESS: WebSocket Connected");
            setIsConnected(true);
        });

        newClient.on('disconnected', () => {
            addLog("INFO: WebSocket Disconnected");
            setIsConnected(false);
        });

        newClient.on('error', (err) => {
            addLog("ERROR: " + JSON.stringify(err));
            setIsConnected(false);
        });

        newClient.on('audio', (data) => {
            addLog("RECEIVED: Audio Chunk (" + data.length + " bytes)");
        });

        newClient.on('text', (text) => {
            addLog("RECEIVED TEXT: " + text);
        });

        setClient(newClient);
        newClient.connect();
    };

    const disconnect = () => {
        client?.disconnect();
    };

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-green-400 font-mono">
            <h1 className="text-2xl font-bold mb-4">Gemini Live Diagnostics</h1>

            <div className="flex gap-4 mb-4">
                <Input
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter API Key"
                    className="bg-black border-green-800 text-green-400 max-w-md"
                    type="password"
                />
                {!isConnected ? (
                    <Button onClick={connect} className="bg-green-700 hover:bg-green-600">CONNECT</Button>
                ) : (
                    <Button onClick={disconnect} variant="destructive">DISCONNECT</Button>
                )}
            </div>

            <div className="border border-green-800 bg-black p-4 h-96 overflow-y-auto rounded text-sm">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
