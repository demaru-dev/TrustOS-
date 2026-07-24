#!/usr/bin/env node

/**
 * Dynamic Scheduler for TrustOS Automation
 * With randomized delays to make activity patterns organic
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class DynamicScheduler {
    constructor() {
        this.runCount = 0;
        this.logFile = path.join(__dirname, '../scheduler.log');
        this.lastRunFile = path.join(__dirname, '../.lastrun');
        this.isRunning = false;
        
        // Repository info
        this.repoOwner = 'demaru-dev';
        this.repoName = 'TrustOS-';
        
        // Randomization settings
        this.minDelay = 30; // Minimum minutes between runs
        this.maxDelay = 90; // Maximum minutes between runs
        
        // Get token from environment
        this.token = process.env.PAT_TOKEN;
        
        if (!this.token) {
            console.error('❌ PAT_TOKEN environment variable not set!');
            process.exit(1);
        }
        
        // Create logs directory
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Read last run time
        if (fs.existsSync(this.lastRunFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.lastRunFile, 'utf8'));
                this.lastRunTime = data.timestamp || 0;
                this.runCount = data.runCount || 0;
                this.log(`📊 Last run was at: ${new Date(this.lastRunTime).toISOString()}`);
                this.log(`📊 Total runs so far: ${this.runCount}`);
            } catch (error) {
                this.lastRunTime = 0;
                this.runCount = 0;
            }
        } else {
            this.lastRunTime = 0;
            this.runCount = 0;
        }
        
        this.log('🚀 Dynamic Scheduler Initialized');
        this.log(`📦 Repo: ${this.repoOwner}/${this.repoName}`);
        this.log(`⏰ Random delay range: ${this.minDelay} - ${this.maxDelay} minutes`);
        this.log(`🔑 Token configured: ${this.token ? 'Yes' : 'No'}`);
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            // Silent fail for logging
        }
    }

    getRandomDelay() {
        // Generate random delay between min and max
        const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay;
        return delay;
    }

    makeGitHubRequest(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: `/repos/${this.repoOwner}/${this.repoName}${endpoint}`,
                method: method,
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'TrustOS-Scheduler'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const parsed = JSON.parse(responseData);
                            resolve(parsed);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                        }
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async triggerAutomation() {
        if (this.isRunning) {
            this.log('⏳ Automation already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.runCount++;
        
        try {
            this.log(`🚀 Triggering automation run #${this.runCount}`);
            
            // Trigger the workflow via GitHub API
            await this.makeGitHubRequest(
                'POST',
                '/actions/workflows/automation.yml/dispatches',
                { ref: 'main' }
            );
            
            // Calculate next random delay
            const nextDelay = this.getRandomDelay();
            
            this.log(`✅ Successfully triggered automation run #${this.runCount}`);
            this.log(`⏰ Next run will be in ${nextDelay} minutes (randomized)`);
            
            // Save the last run time and count
            const data = {
                timestamp: Date.now(),
                runCount: this.runCount
            };
            fs.writeFileSync(this.lastRunFile, JSON.stringify(data));
            
            this.log(`📊 Total runs: ${this.runCount}`);
            
        } catch (error) {
            this.log(`❌ Failed to trigger automation: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    start() {
        this.log('🚀 Dynamic Scheduler Started');
        this.log(`⏰ Random delay range: ${this.minDelay} - ${this.maxDelay} minutes`);
        
        // Check if we should run immediately
        if (this.lastRunTime === 0) {
            this.log('⏰ No previous run found, triggering initial run in 5 seconds...');
            setTimeout(() => {
                this.triggerAutomation();
            }, 5000);
        } else {
            // Calculate when next run should be
            const now = Date.now();
            const minutesSinceLastRun = (now - this.lastRunTime) / (60 * 1000);
            
            // Get the delay that was set for this run
            let expectedDelay = this.minDelay;
            if (fs.existsSync(path.join(__dirname, '../.nextdelay'))) {
                try {
                    expectedDelay = parseInt(fs.readFileSync(path.join(__dirname, '../.nextdelay'), 'utf8'));
                } catch (error) {
                    expectedDelay = this.minDelay;
                }
            }
            
            if (minutesSinceLastRun >= expectedDelay) {
                this.log(`⏰ ${minutesSinceLastRun.toFixed(1)} minutes since last run, triggering...`);
                setTimeout(() => {
                    this.triggerAutomation();
                }, 5000);
            } else {
                const waitMinutes = expectedDelay - minutesSinceLastRun;
                this.log(`⏰ Next run in approximately ${waitMinutes.toFixed(1)} minutes`);
            }
        }
        
        // Set up interval to check every minute
        setInterval(async () => {
            const now = Date.now();
            let lastRunTime = 0;
            let expectedDelay = this.minDelay;
            
            if (fs.existsSync(this.lastRunFile)) {
                try {
                    const data = JSON.parse(fs.readFileSync(this.lastRunFile, 'utf8'));
                    lastRunTime = data.timestamp || 0;
                } catch (error) {
                    lastRunTime = 0;
                }
            }
            
            // Read the expected delay for this run
            if (fs.existsSync(path.join(__dirname, '../.nextdelay'))) {
                try {
                    expectedDelay = parseInt(fs.readFileSync(path.join(__dirname, '../.nextdelay'), 'utf8'));
                } catch (error) {
                    expectedDelay = this.minDelay;
                }
            }
            
            const minutesSinceLastRun = (now - lastRunTime) / (60 * 1000);
            
            if (minutesSinceLastRun >= expectedDelay && lastRunTime > 0) {
                this.log(`⏰ ${minutesSinceLastRun.toFixed(1)} minutes since last run, triggering...`);
                await this.triggerAutomation();
            }
        }, 60000); // Check every minute
        
        this.log('✅ Scheduler running...');
        this.log('💡 Press Ctrl+C to stop');
    }
}

// Create and start the scheduler
const scheduler = new DynamicScheduler();
scheduler.start();
