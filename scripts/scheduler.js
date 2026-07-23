#!/usr/bin/env node

/**
 * Dynamic Scheduler for TrustOS Automation
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class DynamicScheduler {
    constructor() {
        this.runCount = 0;
        this.baseDelay = 45;
        this.currentDelay = this.baseDelay;
        this.logFile = path.join(__dirname, '../scheduler.log');
        this.isRunning = false;
        this.lastRunFile = path.join(__dirname, '../.lastrun');
        
        // IMPORTANT: Use your actual repository name with the dash
        this.repoOwner = 'demaru-dev';
        this.repoName = 'TrustOS-';  // Note the dash at the end
        
        this.token = process.env.PAT_TOKEN;
        
        if (!this.token) {
            console.error('❌ PAT_TOKEN environment variable not set!');
            process.exit(1);
        }
        
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
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
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log:', error.message);
        }
    }

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            this.log(`Executing: ${command}`);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.log(`❌ Command failed: ${error.message}`);
                    reject(error);
                } else {
                    if (stdout) this.log(`stdout: ${stdout}`);
                    resolve(stdout);
                }
            });
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
            
            const triggerCommand = `
                curl -X POST \
                -H "Authorization: token ${this.token}" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/workflows/automation.yml/dispatches \
                -d '{"ref":"main"}'
            `;
            
            await this.executeCommand(triggerCommand);
            
            this.log(`✅ Successfully triggered automation run #${this.runCount}`);
            
            this.currentDelay = this.baseDelay + this.runCount;
            this.log(`⏰ Next run scheduled in ${this.currentDelay} minutes`);
            
            fs.writeFileSync(this.lastRunFile, Date.now().toString());
            
        } catch (error) {
            this.log(`❌ Failed to trigger automation: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    start() {
        this.log('🚀 Dynamic Scheduler Started');
        this.log(`📊 Initial delay: ${this.baseDelay} minutes`);
        
        if (this.lastRunTime === 0) {
            this.log('⏰ No previous run found, triggering initial run...');
            setTimeout(() => {
                this.triggerAutomation();
            }, 5000);
        }
        
        cron.schedule('* * * * *', async () => {
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
            } else if (lastRunTime === 0) {
                await this.triggerAutomation();
            }
        });
        
        this.log('✅ Scheduler running...');
    }
}

const scheduler = new DynamicScheduler();
scheduler.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
