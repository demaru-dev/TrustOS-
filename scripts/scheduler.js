#!/usr/bin/env node

/**
 * Dynamic Scheduler for TrustOS Automation
 * 
 * This script schedules the automation runs with increasing intervals:
 * - First run: 45 minutes from start
 * - Next run: 46 minutes
 * - Next run: 47 minutes
 * - ... and so on
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class DynamicScheduler {
    constructor() {
        this.runCount = 0;
        this.baseDelay = 45; // minutes
        this.currentDelay = this.baseDelay;
        this.logFile = path.join(__dirname, '../scheduler.log');
        this.isRunning = false;
        this.lastRunFile = path.join(__dirname, '../.lastrun');
        
        // Get token from environment
        this.token = process.env.PAT_TOKEN;
        
        if (!this.token) {
            console.error('❌ PAT_TOKEN environment variable not set!');
            console.error('Please set PAT_TOKEN in your environment or GitHub secrets.');
            process.exit(1);
        }
        
        // Create logs directory if it doesn't exist
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Read last run time if exists
        if (fs.existsSync(this.lastRunFile)) {
            try {
                this.lastRunTime = parseInt(fs.readFileSync(this.lastRunFile, 'utf8'));
                this.log(`📊 Last run was at: ${new Date(this.lastRunTime).toISOString()}`);
            } catch (error) {
                this.log('📊 No valid last run time found');
                this.lastRunTime = 0;
            }
        } else {
            this.lastRunTime = 0;
        }
        
        this.log('🚀 Dynamic Scheduler Initialized');
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
            console.error('Failed to write to log:', error.message);
        }
    }

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            this.log(`Executing: ${command}`);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.log(`❌ Command failed: ${error.message}`);
                    if (stderr) this.log(`stderr: ${stderr}`);
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
            
            // Trigger the GitHub Actions workflow via API
            const repo = 'demaru-dev/TrustOS';
            const workflow = 'automation.yml';
            
            const triggerCommand = `
                curl -X POST \
                -H "Authorization: token ${this.token}" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches \
                -d '{"ref":"main"}'
            `;
            
            await this.executeCommand(triggerCommand);
            
            this.log(`✅ Successfully triggered automation run #${this.runCount}`);
            
            // Update the schedule for next run
            this.currentDelay = this.baseDelay + this.runCount;
            this.log(`⏰ Next run scheduled in ${this.currentDelay} minutes`);
            
            // Update the last run time
            fs.writeFileSync(this.lastRunFile, Date.now().toString());
            
            // Update the cron schedule
            await this.updateCronSchedule();
            
        } catch (error) {
            this.log(`❌ Failed to trigger automation: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    async updateCronSchedule() {
        // Update the .github/workflows/automation.yml with new cron schedule
        const workflowPath = path.join(__dirname, '../.github/workflows/automation.yml');
        
        if (fs.existsSync(workflowPath)) {
            try {
                let content = fs.readFileSync(workflowPath, 'utf8');
                
                // Calculate the minutes for the next run
                const minutes = this.currentDelay % 60;
                const hours = Math.floor(this.currentDelay / 60);
                
                let cronExpression;
                if (hours === 0) {
                    cronExpression = `*/${minutes} * * * *`;
                } else {
                    cronExpression = `${minutes} */${hours} * * *`;
                }
                
                // Update the cron line
                content = content.replace(
                    /- cron: '.*'/,
                    `- cron: '${cronExpression}'`
                );
                
                fs.writeFileSync(workflowPath, content);
                this.log(`📝 Updated cron schedule to: ${cronExpression}`);
                
                // Commit and push the change
                try {
                    await this.executeCommand(`
                        git config user.name "${{ secrets.USER_NAME }}"
                        git config user.email "${{ secrets.USER_EMAIL }}"
                        git add .github/workflows/automation.yml
                        git commit -m "Update automation schedule to ${cronExpression}" || true
                        git push origin main || true
                    `);
                } catch (error) {
                    this.log(`⚠️ Could not commit schedule change: ${error.message}`);
                }
                
            } catch (error) {
                this.log(`❌ Failed to update cron schedule: ${error.message}`);
            }
        }
    }

    start() {
        this.log('🚀 Dynamic Scheduler Started');
        this.log(`📊 Initial delay: ${this.baseDelay} minutes`);
        
        // Run immediately if no last run exists
        if (this.lastRunTime === 0) {
            this.log('⏰ No previous run found, triggering initial run...');
            setTimeout(() => {
                this.triggerAutomation();
            }, 5000);
        }
        
        // Schedule the next runs using cron
        cron.schedule('* * * * *', async () => {
            // Calculate time since last run
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
                // If no last run, trigger immediately
                await this.triggerAutomation();
            }
        });
        
        this.log('✅ Scheduler running...');
        this.log('💡 Press Ctrl+C to stop');
    }
}

// Start the scheduler
const scheduler = new DynamicScheduler();
scheduler.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
