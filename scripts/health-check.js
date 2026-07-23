#!/usr/bin/env node

/**
 * Health Check Script for TrustOS
 * Verifies all components are working properly
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class HealthCheck {
    constructor() {
        this.token = process.env.PAT_TOKEN;
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message, type = 'info') {
        const symbols = {
            'pass': '✅',
            'fail': '❌',
            'info': 'ℹ️',
            'warn': '⚠️'
        };
        console.log(`${symbols[type] || 'ℹ️'} ${message}`);
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async checkToken() {
        this.log('Checking GitHub token...');
        if (!this.token) {
            this.log('No PAT_TOKEN found in environment!', 'fail');
            this.failed++;
            return false;
        }
        
        try {
            const result = await this.executeCommand(
                `curl -s -H "Authorization: token ${this.token}" https://api.github.com/user`
            );
            const user = JSON.parse(result);
            if (user.login) {
                this.log(`Token valid for user: ${user.login}`, 'pass');
                this.passed++;
                return true;
            } else {
                this.log('Token is invalid or expired', 'fail');
                this.failed++;
                return false;
            }
        } catch (error) {
            this.log(`Token check failed: ${error.message}`, 'fail');
            this.failed++;
            return false;
        }
    }

    async checkRepositoryAccess() {
        this.log('Checking repository access...');
        try {
            await this.executeCommand('git ls-remote origin');
            this.log('Repository access confirmed', 'pass');
            this.passed++;
            return true;
        } catch (error) {
            this.log(`Repository access failed: ${error.message}`, 'fail');
            this.failed++;
            return false;
        }
    }

    async checkGitConfig() {
        this.log('Checking Git configuration...');
        try {
            const name = await this.executeCommand('git config user.name');
            const email = await this.executeCommand('git config user.email');
            
            if (name.trim() && email.trim()) {
                this.log(`Git configured: ${name.trim()} <${email.trim()}>`, 'pass');
                this.passed++;
                return true;
            } else {
                this.log('Git user not configured properly', 'fail');
                this.failed++;
                return false;
            }
        } catch (error) {
            this.log(`Git config check failed: ${error.message}`, 'fail');
            this.failed++;
            return false;
        }
    }

    async checkGitHubCLI() {
        this.log('Checking GitHub CLI installation...');
        try {
            const version = await this.executeCommand('gh --version');
            const versionMatch = version.match(/gh version (\d+\.\d+\.\d+)/);
            if (versionMatch) {
                this.log(`GitHub CLI installed: v${versionMatch[1]}`, 'pass');
                this.passed++;
                return true;
            } else {
                this.log('GitHub CLI not found or not working', 'fail');
                this.failed++;
                return false;
            }
        } catch (error) {
            this.log(`GitHub CLI check failed: ${error.message}`, 'fail');
            this.failed++;
            return false;
        }
    }

    async checkDependencies() {
        this.log('Checking dependencies...');
        try {
            await this.executeCommand('npm list --depth=0');
            this.log('Dependencies installed', 'pass');
            this.passed++;
            return true;
        } catch (error) {
            this.log(`Dependencies check failed: ${error.message}`, 'fail');
            this.failed++;
            return false;
        }
    }

    async checkWorkflowFiles() {
        this.log('Checking workflow files...');
        const workflows = [
            '.github/workflows/automation.yml',
            '.github/workflows/scheduler.yml'
        ];
        
        let allExist = true;
        for (const workflow of workflows) {
            const exists = fs.existsSync(path.join(__dirname, '..', workflow));
            if (exists) {
                this.log(`Found ${workflow}`, 'pass');
                this.passed++;
            } else {
                this.log(`Missing ${workflow}`, 'fail');
                this.failed++;
                allExist = false;
            }
        }
        return allExist;
    }

    async run() {
        console.log('\n🔍 Running TrustOS Health Check...\n');
        console.log('=' .repeat(50));
        
        const checks = [
            this.checkToken(),
            this.checkRepositoryAccess(),
            this.checkGitConfig(),
            this.checkGitHubCLI(),
            this.checkDependencies(),
            this.checkWorkflowFiles()
        ];
        
        await Promise.all(checks);
        
        console.log('\n' + '='.repeat(50));
        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
        
        if (this.failed === 0) {
            console.log('✅ All health checks passed! TrustOS is ready to run.\n');
            return true;
        } else {
            console.log('❌ Some health checks failed. Please fix the issues above.\n');
            return false;
        }
    }
}
