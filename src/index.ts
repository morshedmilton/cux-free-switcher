#!/usr/bin/env node

/*
  Copyright (C) 2026 Md. Morshed Milton
  
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
*/

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.cux-free');
const configPath = path.join(CONFIG_DIR, 'config.json');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

let conversationHistory: Message[] = [];

function initializeConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      accounts: [
        {
          slot: 1,
          email: "default@example.com",
          sessionKey: "sk-ant-sid02-default",
          routingHint: "sk-ant-rh-default",
          status: "active"
        }
      ],
      current_slot: 0
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
}

function loadConfig() {
  initializeConfig();
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveConfig(config: any) {
  initializeConfig();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

function rotateAccount(errorStatus: number): boolean {
  const config = loadConfig();
  const currentSlot = config.current_slot;
  const accounts = config.accounts;
  
  if (errorStatus === 403) {
    console.log(`\n\x1b[31m[Invalid/Expired] Slot ${accounts[currentSlot].slot} (${accounts[currentSlot].email}) marked as expired.\x1b[0m`);
    accounts[currentSlot].status = 'expired';
  } else if (errorStatus === 429) {
    console.log(`\n\x1b[33m[Rate-Limited] Slot ${accounts[currentSlot].slot} (${accounts[currentSlot].email}) hit limits.\x1b[0m`);
    accounts[currentSlot].status = 'rate-limited';
  }

  let nextSlot = (currentSlot + 1) % accounts.length;
  let foundValidAccount = false;

  for (let i = 0; i < accounts.length; i++) {
    if (accounts[nextSlot].status === 'active') {
      config.current_slot = nextSlot;
      foundValidAccount = true;
      break;
    }
    nextSlot = (nextSlot + 1) % accounts.length;
  }

  saveConfig(config);

  if (foundValidAccount) {
    console.log(`\x1b[32m[Auto-Switch] Swapped to Slot ${config.current_slot + 1} (${accounts[config.current_slot].email}) - Context Preserved.\x1b[0m`);
    return true;
  } else {
    console.error('\n\x1b[31m[Critical] No active accounts left in the pool! Exiting...\x1b[0m');
    return false;
  }
}

async function handleChatStream(prompt: string, model: string, thinking: boolean, effort: string): Promise<string> {
  let retry = true;
  let assistantResponse = '';

  while (retry) {
    const config = loadConfig();
    const activeAccount = config.accounts[config.current_slot];
    
    if (activeAccount.status !== 'active') {
      const skipped = rotateAccount(0);
      if (!skipped) return '';
      continue;
    }

    const cookieString = `sessionKey=${activeAccount.sessionKey}; routingHint=${activeAccount.routingHint};`;
    
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://claude.ai/api/append_message',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
          'Cookie': cookieString,
          'Origin': 'https://claude.ai',
          'Referer': 'https://claude.ai/'
        },
        data: {
          completion: {
            history: conversationHistory, 
            prompt: prompt,
            timezone: 'Asia/Dhaka',
            model: model, 
            thinking: thinking, // নতুন থিংকিং মোড সুইচ
            effort: effort       // নতুন ৪-লেভেল এফোর্ট প্যারামিটার
          }
        },
        responseType: 'stream'
      });

      process.stdout.write(`\x1b[36mClaude (${activeAccount.email}) > \x1b[0m`);

      await new Promise<void>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const parsed = JSON.parse(line.slice(5).trim());
                if (parsed.completion) {
                  process.stdout.write(parsed.completion);
                  assistantResponse += parsed.completion;
                }
              } catch (e) {}
            }
          }
        });

        response.data.on('end', () => {
          console.log();
          retry = false;
          resolve();
        });

        response.data.on('error', (err: any) => reject(err));
      });

      return assistantResponse;

    } catch (error: any) {
      const status = error.response ? error.response.status : 0;
      if (status === 403 || status === 429) {
        const canContinue = rotateAccount(status);
        if (!canContinue) {
          retry = false;
          return '';
        }
      } else {
        console.error('\nUnexpected Connection Error:', error.message);
        retry = false;
        return '';
      }
    }
  }
  return '';
}

function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\x1b[35m====================================================\x1b[0m');
  console.log('\x1b[35m   CUX Free Switcher CLI - Active & Context Ready   \x1b[0m');
  console.log('\x1b[35m====================================================\x1b[0m');

  // ১. মডেল সিলেকশন
  console.log('Select Model:');
  console.log('1. Claude Sonnet 4.6 (Default)');
  console.log('2. Claude Haiku 4.5');
  
  rl.question('Choose model (1 or 2): ', (modelChoice) => {
    let selectedModel = 'claude-4-6-sonnet';
    if (modelChoice.trim() === '2') {
      selectedModel = 'claude-haiku-4-5';
    }

    // ২. থিংকিং সুইচ সিলেকশন
    console.log('\nThinking Switch:');
    console.log('1. Enable Thinking (Default)');
    console.log('2. Disable Thinking');

    rl.question('Choose option (1 or 2): ', (thinkingChoice) => {
      let isThinkingEnabled = true;
      if (thinkingChoice.trim() === '2') {
        isThinkingEnabled = false;
      }

      // ৩. এফোর্ট লেভেল সিলেকশন (ফ্রি অ্যাকাউন্টের ৪টি লেভেল)
      console.log('\nSelect Reasoning Effort Level:');
      console.log('1. Low');
      console.log('2. Medium');
      console.log('3. High (Default)');
      console.log('4. Max');

      rl.question('Choose effort level (1-4, default 3): ', (effortChoice) => {
        let selectedEffort = 'high';
        const choice = effortChoice.trim();
        if (choice === '1') selectedEffort = 'low';
        else if (choice === '2') selectedEffort = 'medium';
        else if (choice === '3') selectedEffort = 'high';
        else if (choice === '4') selectedEffort = 'max';

        // কনফিগারেশন চিরতরে লক
        console.log(`\n\x1b[32m[Config Locked] Model: ${selectedModel} | Thinking: ${isThinkingEnabled} | Effort: ${selectedEffort}\x1b[0m`);
        console.log('Type your message and press Enter. Type "exit" to quit.\n');

        const promptUser = () => {
          rl.question('\x1b[33mYou > \x1b[0m', async (input: string) => {
            const trimmedInput = input.trim();
            
            if (trimmedInput.toLowerCase() === 'exit') {
              rl.close();
              return;
            }

            if (trimmedInput === '') {
              promptUser();
              return;
            }

            conversationHistory.push({ role: 'user', content: trimmedInput });

            const response = await handleChatStream(trimmedInput, selectedModel, isThinkingEnabled, selectedEffort);

            if (response !== '') {
              conversationHistory.push({ role: 'assistant', content: response });
            } else {
              console.log('\x1b[31m[System] Connection terminated due to lack of active tokens.\x1b[0m');
              rl.close();
              return;
            }

            promptUser();
          });
        };

        promptUser();
      });
    });
  });
}

initializeConfig();
startCLI();
