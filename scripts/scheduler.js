#!/usr/bin/env node

/**
 * Dynamic Scheduler for TrustOS Automation
 * Uses GitHub API directly to trigger workflows
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class DynamicScheduler {
    constructor() {
        this.runCount = 0;
        this.baseDelay = 45; // minutes
        this.currentDelay = this.baseDelay;
        this.logFile = path.join(__dirname, '../scheduler.log');
        this.lastRunFile = path.join(__dirname, '../.lastrun');
        this.isRunning = false;
        
        // Repository info
        this.repoOwner = 'demaru-dev';
        this.repoName = 'TrustOS-';
        
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
                this.lastRunTime = parseInt(fs.readFileSync(this.lastRunFile, 'utf8'));
                this.log(`📊 Last run was at: ${new Date(this.lastRunTime).toISOString()}`);
            } catch (error) {
                this.lastRunTime = 0;
            }
        } else {
            this.lastRunTime = 0;
        }
        
        this.log('🚀 Dynamic Scheduler Initialized');
        this.log(`📦 Repo: ${this.repoOwner}/${this.repoName}`);
        this.log(`📊 Initial delay: ${this.baseDelay} minutes`);
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
            
            this.log(`✅ Successfully triggered automation run #${this.runCount}`);
            
            // Update the schedule for next run
            this.currentDelay = this.baseDelay + this.runCount;
            this.log(`⏰ Next run scheduled in ${this.currentDelay} minutes`);
            
            // Save the last run time
            fs.writeFileSync(this.lastRunFile, Date.now().toString());
            
            this.log(`📊 Total runs triggered: ${this.runCount}`);
            
        } catch (error) {
            this.log(`❌ Failed to trigger automation: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    start() {
        this.log('🚀 Dynamic Scheduler Started');
        this.log(`📊 Initial delay: ${this.baseDelay} minutes`);
        
        // Check if we should run immediately
        if (this.lastRunTime === 0) {
            this.log('⏰ No previous run found, triggering initial run...');
            setTimeout(() => {
                this.triggerAutomation();
            }, 5000);
        } else {
            // Calculate when next run should be
            const now = Date.now();
            const minutesSinceLastRun = (now - this.lastRunTime) / (60 * 1000);
            
            if (minutesSinceLastRun >= this.currentDelay) {
                this.log(`⏰ ${minutesSinceLastRun.toFixed(1)} minutes since last run, triggering...`);
                setTimeout(() => {
                    this.triggerAutomation();
                }, 5000);
            } else {
                const waitMinutes = this.currentDelay - minutesSinceLastRun;
                this.log(`⏰ Next run in ${waitMinutes.toFixed(1)} minutes`);
            }
        }
        
        // Set up interval to check every minute
        setInterval(async () => {
            const now = Date.now();
            let lastRunTime = 0;
            
            if (fs.existsSync(this.lastRunFile)) {
                try {
                    lastRunTime = parseInt(fs.readFileSync(this.lastRunFile, 'utf8'));
                } catch (error) {
                    lastRunTime = 0;
                }
            }
            
            const minutesSinceLastRun = (now - lastRunTime) / (60 * 1000);
            
            if (minutesSinceLastRun >= this.currentDelay && lastRunTime > 0) {
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
