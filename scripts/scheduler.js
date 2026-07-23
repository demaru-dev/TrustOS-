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
        this.githubToken = process.env.GITHUB_TOKEN;
        
        if (!this.githubToken) {
            console.error('❌ GITHUB_TOKEN environment variable not set');
            process.exit(1);
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.log(`Command failed: ${error.message}`);
                    reject(error);
                } else {
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
                -H "Authorization: token ${this.githubToken}" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches \
                -d '{"ref":"main"}'
            `;
            
            await this.executeCommand(triggerCommand);
            
            this.log(`✅ Successfully triggered automation run #${this.runCount}`);
            
            // Update the schedule for next run
            this.currentDelay = this.baseDelay + this.runCount;
            this.log(`⏰ Next run scheduled in ${this.currentDelay} minutes`);
            
            // Update the cron schedule
            this.updateCronSchedule();
            
        } catch (error) {
            this.log(`❌ Failed to trigger automation: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    updateCronSchedule() {
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
                this.executeCommand(`
                    git config user.name "Eli Trust" && \
                    git config user.email "eli.trust@trustcorp.ai" && \
                    git add .github/workflows/automation.yml && \
                    git commit -m "Update automation schedule to ${cronExpression}" || true && \
                    git push origin main || true
                `).catch(() => {});
                
            } catch (error) {
                this.log(`❌ Failed to update cron schedule: ${error.message}`);
            }
        }
    }

    start() {
        this.log('🚀 Dynamic Scheduler Started');
        this.log(`📊 Initial delay: ${this.baseDelay} minutes`);
        
        // Run immediately on start
        setTimeout(() => {
            this.triggerAutomation();
        }, 1000);
        
        // Schedule the next runs using cron
        // Check every minute if we need to run
        cron.schedule('* * * * *', async () => {
            // Calculate time since last run
            // This is a simplified check - in production, you'd use a more robust system
            const lastRunFile = path.join(__dirname, '../.lastrun');
            
            let lastRunTime = 0;
            if (fs.existsSync(lastRunFile)) {
                lastRunTime = parseInt(fs.readFileSync(lastRunFile, 'utf8'));
            }
            
            const now = Date.now();
            const minutesSinceLastRun = (now - lastRunTime) / (60 * 1000);
            
            if (minutesSinceLastRun >= this.currentDelay) {
                // It's time to run
                fs.writeFileSync(lastRunFile, now.toString());
                await this.triggerAutomation();
            }
        });
        
        this.log('✅ Scheduler running...');
    }
}

// Start the scheduler
const scheduler = new DynamicScheduler();
scheduler.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
