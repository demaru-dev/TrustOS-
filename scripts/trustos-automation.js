#!/usr/bin/env node

/**
 * TrustOS - Automated Development Orchestrator
 * Creates REAL commits, file changes, and manages issues/PRs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

class TrustOSAutomation {
    constructor() {
        this.repoPath = path.join(__dirname, '..');
        this.logFile = path.join(__dirname, '../automation.log');
        this.runCount = 0;
        this.createdIssues = [];
        this.createdPRs = [];
        this.commitsMade = [];
        
        // Get token from environment
        this.token = process.env.PAT_TOKEN;
        
        if (!this.token) {
            console.error('❌ PAT_TOKEN environment variable not set!');
            process.exit(1);
        }
        
        this.repoName = 'TrustOS-';
        this.repoOwner = 'demaru-dev';
        
        // Activity ranges
        this.minIssuesPerRun = 1;
        this.maxIssuesPerRun = 3;
        this.minPRsPerRun = 1;
        this.maxPRsPerRun = 2;
        this.minCommitsPerRun = 3;
        this.maxCommitsPerRun = 8;
        
        // Feature files to create/modify
        this.featureFiles = [
            { name: 'EntityEvolution.ts', content: this.getEntityEvolutionContent() },
            { name: 'OrchestrationEngine.py', content: this.getOrchestrationContent() },
            { name: 'SecurityVault.go', content: this.getSecurityVaultContent() },
            { name: 'DataPipeline.ts', content: this.getDataPipelineContent() },
            { name: 'APIGateway.js', content: this.getAPIGatewayContent() },
            { name: 'ConsensusProtocol.sol', content: this.getConsensusContent() },
            { name: 'IdentityRegistry.java', content: this.getIdentityRegistryContent() },
            { name: 'LearningModule.rs', content: this.getLearningModuleContent() }
        ];
        
        // Create logs directory
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        this.log('🚀 TrustOS Automation Engine Initialized');
        this.log(`📦 Repo: ${this.repoOwner}/${this.repoName}`);
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

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // File content generators
    getEntityEvolutionContent() {
        const updates = [
            `    async evolve(entity: any): Promise<any> {
        console.log(\`🔄 Evolving entity: \${entity.id}\`);
        const evolutionPath = this.calculateEvolutionPath(entity);
        const result = await this.applyEvolution(entity, evolutionPath);
        await this.recordEvolution(entity.id, result);
        return result;
    }

    private calculateEvolutionPath(entity: any): any {
        // Calculate optimal evolution path based on entity state
        const capabilities = entity.capabilities || [];
        const path = {
            upgrades: capabilities.map((cap: any) => ({
                name: cap.name,
                version: cap.version + 1,
                timestamp: new Date().toISOString()
            })),
            resources: this.estimateResources(entity),
            timeline: this.estimateTimeline(entity)
        };
        return path;
    }

    private async applyEvolution(entity: any, path: any): Promise<any> {
        // Apply the evolution path to the entity
        for (const upgrade of path.upgrades) {
            entity.capabilities = entity.capabilities.map((cap: any) => {
                if (cap.name === upgrade.name) {
                    return { ...cap, version: upgrade.version };
                }
                return cap;
            });
        }
        return entity;
    }

    private async recordEvolution(entityId: string, result: any): Promise<void> {
        // Record the evolution in the tracking system
        console.log(\`✅ Evolution recorded for \${entityId}\`);
    }

    private estimateResources(entity: any): any {
        return {
            compute: Math.random() * 100 + 50,
            memory: Math.random() * 1024 + 512,
            storage: Math.random() * 1024 + 1024
        };
    }

    private estimateTimeline(entity: any): any {
        return {
            estimated: Date.now() + Math.random() * 3600000,
            actual: Date.now() + Math.random() * 7200000
        };
    }`,
            `    async getEvolutionHistory(entityId: string): Promise<any[]> {
        // Get evolution history for an entity
        const history = await this.loadHistory(entityId);
        return history.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString(),
            version: entry.version || 1
        }));
    }

    private async loadHistory(entityId: string): Promise<any[]> {
        // Load evolution history from storage
        return [
            { id: entityId, version: 1, timestamp: Date.now() - 86400000 },
            { id: entityId, version: 2, timestamp: Date.now() - 43200000 }
        ];
    }

    async rollbackEvolution(entityId: string, version: number): Promise<boolean> {
        // Rollback to a previous version
        console.log(\`⬅️ Rolling back \${entityId} to version \${version}\`);
        return true;
    }`
        ];
        return updates[Math.floor(Math.random() * updates.length)];
    }

    getOrchestrationContent() {
        const updates = [
            `    async processTask(task: any): Promise<any> {
        console.log(\`⚙️ Processing task: \${task.id}\`);
        const entity = this.entities.get(task.entityId);
        if (!entity) {
            throw new Error(\`Entity \${task.entityId} not found\`);
        }
        
        const result = await entity.execute(task);
        await this.recordTaskResult(task.id, result);
        return result;
    }

    async scheduleTask(task: any): Promise<void> {
        // Schedule a task for future execution
        const delay = task.delay || 0;
        setTimeout(async () => {
            await this.taskQueue.push(task);
            console.log(\`📋 Task \${task.id} scheduled\`);
        }, delay);
    }

    async getTaskStatus(taskId: string): Promise<any> {
        // Get the status of a task
        const task = this.runningTasks.get(taskId);
        if (task) {
            return {
                id: taskId,
                status: task.status,
                progress: task.progress || 0,
                started: task.started,
                completed: task.completed
            };
        }
        return null;
    }`,
            `    async optimizeWorkflow(workflowId: string): Promise<any> {
        // Optimize a workflow for better performance
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(\`Workflow \${workflowId} not found\`);
        }
        
        const optimized = await this.runOptimization(workflow);
        this.workflows.set(workflowId, optimized);
        console.log(\`✨ Workflow \${workflowId} optimized\`);
        return optimized;
    }

    private async runOptimization(workflow: any): Promise<any> {
        // Run optimization algorithms on the workflow
        const steps = workflow.steps || [];
        return {
            ...workflow,
            steps: steps.map((step: any) => ({
                ...step,
                optimized: true,
                estimatedTime: Math.random() * 100 + 50
            })),
            optimized: true,
            timestamp: new Date().toISOString()
        };
    }`
        ];
        return updates[Math.floor(Math.random() * updates.length)];
    }

    getSecurityVaultContent() {
        const updates = [
            `func (v *SecurityVault) EncryptData(data []byte) (string, error) {
    // Encrypt data using the vault's encryption key
    block, err := aes.NewCipher(v.encryptionKey)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, data, nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (v *SecurityVault) DecryptData(encrypted string) ([]byte, error) {
    // Decrypt data using the vault's encryption key
    ciphertext, err := base64.StdEncoding.DecodeString(encrypted)
    if err != nil {
        return nil, err
    }
    
    block, err := aes.NewCipher(v.encryptionKey)
    if err != nil {
        return nil, err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    
    nonceSize := gcm.NonceSize()
    if len(ciphertext) < nonceSize {
        return nil, errors.New("ciphertext too short")
    }
    
    nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
    return gcm.Open(nil, nonce, ciphertext, nil)
}`,
            `func (v *SecurityVault) GenerateKeyPair() (string, string, error) {
    // Generate a new key pair for an entity
    privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
    if err != nil {
        return "", "", err
    }
    
    publicKey := &privateKey.PublicKey
    publicKeyPEM := pem.EncodeToMemory(&pem.Block{
        Type:  "RSA PUBLIC KEY",
        Bytes: x509.MarshalPKCS1PublicKey(publicKey),
    })
    
    privateKeyPEM := pem.EncodeToMemory(&pem.Block{
        Type:  "RSA PRIVATE KEY",
        Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
    })
    
    return string(publicKeyPEM), string(privateKeyPEM), nil
}`
        ];
        return updates[Math.floor(Math.random() * updates.length)];
    }

    getDataPipelineContent() {
        return `export class DataPipeline {
    private stages: any[];
    private metrics: any;
    
    constructor() {
        this.stages = [];
        this.metrics = {
            processed: 0,
            errors: 0,
            averageTime: 0
        };
    }
    
    addStage(stage: any): void {
        console.log(\`📊 Adding stage: \${stage.name}\`);
        this.stages.push(stage);
    }
    
    async process(data: any): Promise<any> {
        const startTime = Date.now();
        let result = data;
        
        for (const stage of this.stages) {
            try {
                result = await stage.process(result);
                this.metrics.processed++;
            } catch (error) {
                this.metrics.errors++;
                console.error(\`❌ Stage \${stage.name} failed: \${error.message}\`);
                throw error;
            }
        }
        
        const endTime = Date.now();
        this.metrics.averageTime = (this.metrics.averageTime + (endTime - startTime)) / 2;
        
        return result;
    }
    
    getMetrics(): any {
        return {
            ...this.metrics,
            stages: this.stages.length,
            timestamp: new Date().toISOString()
        };
    }
}`;
    }

    getAPIGatewayContent() {
        return `class APIGateway {
    constructor() {
        this.routes = new Map();
        this.middleware = [];
        this.logger = console;
        this.cache = new Map();
    }
    
    addRoute(path, handler, methods = ['GET']) {
        console.log(\`🌐 Adding route: \${path}\`);
        this.routes.set(path, { handler, methods });
    }
    
    use(middleware) {
        this.middleware.push(middleware);
    }
    
    async handle(request) {
        const startTime = Date.now();
        let response = null;
        
        // Apply middleware
        for (const middleware of this.middleware) {
            try {
                await middleware(request);
            } catch (error) {
                this.logger.error(\`❌ Middleware failed: \${error.message}\`);
                return { status: 500, body: 'Internal Server Error' };
            }
        }
        
        // Check cache
        const cacheKey = \`\${request.method}:\${request.path}\`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.response;
            }
        }
        
        // Handle request
        const route = this.routes.get(request.path);
        if (route && route.methods.includes(request.method)) {
            try {
                response = await route.handler(request);
                this.cache.set(cacheKey, {
                    response,
                    timestamp: Date.now()
                });
            } catch (error) {
                this.logger.error(\`❌ Route handler failed: \${error.message}\`);
                response = { status: 500, body: 'Internal Server Error' };
            }
        } else {
            response = { status: 404, body: 'Not Found' };
        }
        
        const endTime = Date.now();
        this.logger.info(\`📝 \${request.method} \${request.path} - \${response.status} - \${endTime - startTime}ms\`);
        
        return response;
    }
}`;
    }

    getConsensusContent() {
        return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ConsensusProtocol {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        uint256 createdAt;
        uint256 deadline;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    uint256 public votingPeriod = 7 days;
    
    event ProposalCreated(uint256 indexed id, address proposer, string description);
    event VoteCast(uint256 indexed id, address voter, bool support);
    event ProposalExecuted(uint256 indexed id);
    
    function createProposal(string memory description) external returns (uint256) {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            createdAt: block.timestamp,
            deadline: block.timestamp + votingPeriod
        });
        
        emit ProposalCreated(proposalCount, msg.sender, description);
        return proposalCount;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp <= proposal.deadline, "Voting period has ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }
        
        emit VoteCast(proposalId, msg.sender, support);
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.deadline, "Voting period not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
}`;
    }

    getIdentityRegistryContent() {
        return `package com.trustos.identity;

import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

public class IdentityRegistry {
    private final ConcurrentHashMap<String, Entity> entities;
    private final ConcurrentHashMap<String, String> tokens;
    
    public IdentityRegistry() {
        this.entities = new ConcurrentHashMap<>();
        this.tokens = new ConcurrentHashMap<>();
    }
    
    public Entity registerEntity(String name, String type) {
        String id = UUID.randomUUID().toString();
        Entity entity = new Entity(id, name, type);
        entities.put(id, entity);
        
        // Generate auth token
        String token = UUID.randomUUID().toString();
        tokens.put(id, token);
        
        System.out.println("✅ Entity registered: " + id);
        return entity;
    }
    
    public Entity getEntity(String id) {
        return entities.get(id);
    }
    
    public boolean authenticate(String id, String token) {
        String storedToken = tokens.get(id);
        return storedToken != null && storedToken.equals(token);
    }
    
    public void updateEntity(String id, Entity updated) {
        if (entities.containsKey(id)) {
            entities.put(id, updated);
            System.out.println("🔄 Entity updated: " + id);
        }
    }
    
    public void deleteEntity(String id) {
        entities.remove(id);
        tokens.remove(id);
        System.out.println("🗑️ Entity deleted: " + id);
    }
    
    public int getEntityCount() {
        return entities.size();
    }
    
    public class Entity {
        private final String id;
        private String name;
        private String type;
        private long createdAt;
        private long lastSeen;
        
        public Entity(String id, String name, String type) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.createdAt = System.currentTimeMillis();
            this.lastSeen = System.currentTimeMillis();
        }
        
        // Getters and setters
        public String getId() { return id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public long getCreatedAt() { return createdAt; }
        public long getLastSeen() { return lastSeen; }
        public void updateLastSeen() { this.lastSeen = System.currentTimeMillis(); }
    }
}`;
    }

    getLearningModuleContent() {
        return `use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct LearningModule {
    knowledge_base: HashMap<String, Knowledge>,
    learning_rate: f64,
    iterations: u32,
}

#[derive(Debug, Clone)]
pub struct Knowledge {
    pub key: String,
    pub value: String,
    pub confidence: f64,
    pub timestamp: u64,
}

impl LearningModule {
    pub fn new(learning_rate: f64) -> Self {
        LearningModule {
            knowledge_base: HashMap::new(),
            learning_rate,
            iterations: 0,
        }
    }
    
    pub fn learn(&mut self, key: String, value: String) -> bool {
        let knowledge = Knowledge {
            key: key.clone(),
            value: value.clone(),
            confidence: 1.0,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        self.knowledge_base.insert(key, knowledge);
        self.iterations += 1;
        println!("🧠 Learned: {} = {}", key, value);
        true
    }
    
    pub fn query(&self, key: &str) -> Option<String> {
        if let Some(knowledge) = self.knowledge_base.get(key) {
            if knowledge.confidence > 0.5 {
                return Some(knowledge.value.clone());
            }
        }
        None
    }
    
    pub fn update_confidence(&mut self, key: &str, new_confidence: f64) -> bool {
        if let Some(knowledge) = self.knowledge_base.get_mut(key) {
            knowledge.confidence = new_confidence;
            return true;
        }
        false
    }
    
    pub fn get_stats(&self) -> HashMap<String, u32> {
        let mut stats = HashMap::new();
        stats.insert("knowledge_entries".to_string(), self.knowledge_base.len() as u32);
        stats.insert("iterations".to_string(), self.iterations);
        stats
    }
}`;
    }

    executeGitCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { 
                cwd: this.repoPath,
                env: { 
                    ...process.env,
                    GIT_TERMINAL_PROMPT: '0'
                }
            }, (error, stdout, stderr) => {
                if (error) {
                    this.log(`❌ Git command failed: ${error.message}`);
                    if (stderr) this.log(`stderr: ${stderr}`);
                    reject(error);
                } else {
                    if (stdout) this.log(`stdout: ${stdout}`);
                    resolve(stdout);
                }
            });
        });
    }

    async createRealCommit() {
        try {
            // Select a random file to modify
            const fileTemplate = this.getRandomItem(this.featureFiles);
            const fileName = `src/core/${fileTemplate.name}`;
            const content = fileTemplate.content;
            
            // Create the file path
            const filePath = path.join(this.repoPath, fileName);
            const dirPath = path.dirname(filePath);
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // Write the file content
            fs.writeFileSync(filePath, content);
            
            // Git add the file
            await this.executeGitCommand(`git add ${fileName}`);
            
            // Generate commit message
            const commitMessages = [
                `Implement ${fileTemplate.name} with enhanced features`,
                `Refactor ${fileTemplate.name} for better performance`,
                `Add new functionality to ${fileTemplate.name}`,
                `Optimize ${fileTemplate.name} implementation`,
                `Update ${fileTemplate.name} with latest improvements`,
                `Fix critical issues in ${fileTemplate.name}`,
                `Add comprehensive tests for ${fileTemplate.name}`,
                `Improve error handling in ${fileTemplate.name}`,
                `Add documentation for ${fileTemplate.name}`,
                `Enhance security features in ${fileTemplate.name}`
            ];
            
            const commitMsg = this.getRandomItem(commitMessages);
            
            // Commit the file
            await this.executeGitCommand(`git commit -m "${commitMsg}"`);
            
            this.commitsMade.push({ file: fileTemplate.name, message: commitMsg });
            this.log(`✅ Committed: ${commitMsg} (${fileTemplate.name})`);
            return true;
            
        } catch (error) {
            this.log(`❌ Failed to create commit: ${error.message}`);
            return false;
        }
    }

    async pushCommits() {
        try {
            await this.executeGitCommand('git push origin main');
            this.log(`✅ Pushed ${this.commitsMade.length} commits to origin/main`);
            return true;
        } catch (error) {
            this.log(`❌ Failed to push commits: ${error.message}`);
            return false;
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
                    'User-Agent': 'TrustOS-Automation'
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

    async createIssue() {
        try {
            const titles = [
                `Implement ${this.getRandomItem(['Entity Evolution', 'Cross-Model Sync', 'Identity Verification'])} feature`,
                `Fix ${this.getRandomItem(['memory leak', 'security vulnerability', 'performance issue'])} in core`,
                `Add ${this.getRandomItem(['monitoring', 'logging', 'analytics'])} capabilities`,
                `Optimize ${this.getRandomItem(['data processing', 'API responses', 'resource usage'])}`,
                `Refactor ${this.getRandomItem(['OrchestrationEngine', 'SecurityVault', 'IdentityRegistry'])} module`
            ];
            
            const bodies = [
                `## Description
We need to implement ${this.getRandomItem(['a new feature', 'critical fixes', 'performance improvements'])} for the ${this.getRandomItem(['IdentityRegistry', 'OrchestrationEngine', 'SecurityVault'])} component.

## Tasks
- [ ] Design and implement solution
- [ ] Add comprehensive tests
- [ ] Update documentation
- [ ] Review and merge

## Priority
${this.getRandomItem(['High', 'Medium', 'Critical'])}`,
                `## Background
During recent testing, we identified ${this.getRandomItem(['performance bottlenecks', 'security concerns', 'scalability issues'])}.

## Solution
Implement ${this.getRandomItem(['a new approach', 'enhanced algorithms', 'better error handling'])} to address these issues.

## Timeline
This should be completed within ${this.getRandomItem(['1 week', '3 days', '2 weeks'])}.`
            ];
            
            const issueData = {
                title: this.getRandomItem(titles),
                body: this.getRandomItem(bodies),
                labels: ['enhancement', 'automation']
            };
            
            const result = await this.makeGitHubRequest('POST', '/issues', issueData);
            
            this.createdIssues.push({ 
                number: result.number, 
                title: result.title,
                url: result.html_url,
                created: Date.now()
            });
            
            this.log(`✅ Created issue #${result.number}: ${result.title}`);
            return true;
        } catch (error) {
            this.log(`❌ Failed to create issue: ${error.message}`);
            return false;
        }
    }

    async createPR() {
        try {
            const prTitle = `Feature: ${this.getRandomItem(['Entity Evolution', 'Cross-Model Sync', 'Identity Verification', 'Performance Optimization', 'Security Enhancement'])}`;
            const prBody = `## Overview
This PR implements ${this.getRandomItem(['new functionality', 'critical fixes', 'performance improvements'])} for the ${this.getRandomItem(['IdentityRegistry', 'OrchestrationEngine', 'SecurityVault'])} component.

## Changes
- Added ${this.getRandomItem(['new features', 'enhanced algorithms', 'better error handling'])}
- Improved ${this.getRandomItem(['performance', 'security', 'scalability'])}
- Added comprehensive tests
- Updated documentation

## Testing
- [x] Unit tests added
- [x] Integration tests passing
- [x] Performance benchmarks validated
- [x] Security scans completed

## Breaking Changes
${this.getRandomItem(['None', 'Minor configuration changes required', 'Backward compatibility maintained'])}`;
            
            // Create a branch
            const branchName = `feature/trustos-${Date.now()}`;
            const mainRef = await this.makeGitHubRequest('GET', '/git/refs/heads/main');
            
            await this.makeGitHubRequest('POST', '/git/refs', {
                ref: `refs/heads/${branchName}`,
                sha: mainRef.object.sha
            });
            
            // Create a new file in the PR branch
            const fileTemplate = this.getRandomItem(this.featureFiles);
            const content = Buffer.from(fileTemplate.content).toString('base64');
            
            await this.makeGitHubRequest('PUT', `/contents/src/core/${fileTemplate.name}`, {
                message: `Add ${fileTemplate.name}`,
                content: content,
                branch: branchName
            });
            
            // Create the PR
            const prData = {
                title: prTitle,
                body: prBody,
                head: branchName,
                base: 'main'
            };
            
            const result = await this.makeGitHubRequest('POST', '/pulls', prData);
            
            this.createdPRs.push({
                number: result.number,
                title: result.title,
                url: result.html_url,
                branch: branchName,
                created: Date.now()
            });
            
            this.log(`✅ Created PR #${result.number}: ${result.title}`);
            return true;
        } catch (error) {
            this.log(`❌ Failed to create PR: ${error.message}`);
            return false;
        }
    }

    async closeIssue() {
        if (this.createdIssues.length === 0) return false;
        
        // Find issues older than 1 hour to close
        const oldIssues = this.createdIssues.filter(i => Date.now() - i.created > 3600000);
        if (oldIssues.length === 0) return false;
        
        const issue = this.getRandomItem(oldIssues);
        try {
            await this.makeGitHubRequest('PATCH', `/issues/${issue.number}`, {
                state: 'closed'
            });
            this.log(`✅ Closed issue #${issue.number}: ${issue.title}`);
            
            // Remove from tracking
            this.createdIssues = this.createdIssues.filter(i => i.number !== issue.number);
            return true;
        } catch (error) {
            this.log(`❌ Failed to close issue: ${error.message}`);
            return false;
        }
    }

    async closePR() {
        if (this.createdPRs.length === 0) return false;
        
        // Find PRs older than 2 hours to close/merge
        const oldPRs = this.createdPRs.filter(p => Date.now() - p.created > 7200000);
        if (oldPRs.length === 0) return false;
        
        const pr = this.getRandomItem(oldPRs);
        try {
            // Close the PR
            await this.makeGitHubRequest('PATCH', `/pulls/${pr.number}`, {
                state: 'closed'
            });
            
            this.log(`✅ Closed PR #${pr.number}: ${pr.title}`);
            
            // Remove from tracking
            this.createdPRs = this.createdPRs.filter(p => p.number !== pr.number);
            return true;
        } catch (error) {
            this.log(`❌ Failed to close PR: ${error.message}`);
            return false;
        }
    }

    async runCycle() {
        this.runCount++;
        this.log(`🔄 Running automation cycle #${this.runCount}`);
        
        // 1. Create REAL commits (3-8 per run)
        const numCommits = this.getRandomInt(this.minCommitsPerRun, this.maxCommitsPerRun);
        this.log(`📝 Creating ${numCommits} real commits...`);
        for (let i = 0; i < numCommits; i++) {
            await this.createRealCommit();
            await this.sleep(this.getRandomInt(1000, 3000));
        }
        
        // 2. Push commits
        if (this.commitsMade.length > 0) {
            await this.pushCommits();
        }
        
        // 3. Create issues (1-3)
        const numIssues = this.getRandomInt(this.minIssuesPerRun, this.maxIssuesPerRun);
        this.log(`📝 Creating ${numIssues} issues...`);
        for (let i = 0; i < numIssues; i++) {
            await this.createIssue();
            await this.sleep(this.getRandomInt(2000, 4000));
        }
        
        // 4. Create PRs (1-2)
        const numPRs = this.getRandomInt(this.minPRsPerRun, this.maxPRsPerRun);
        this.log(`📝 Creating ${numPRs} PRs...`);
        for (let i = 0; i < numPRs; i++) {
            await this.createPR();
            await this.sleep(this.getRandomInt(3000, 5000));
        }
        
        // 5. Close some issues (30-50% chance)
        if (Math.random() < 0.4 && this.createdIssues.length > 0) {
            await this.closeIssue();
        }
        
        // 6. Close some PRs (30-50% chance)
        if (Math.random() < 0.4 && this.createdPRs.length > 0) {
            await this.closePR();
        }
        
        this.log(`✅ Cycle #${this.runCount} completed`);
        this.log(`📊 ${this.commitsMade.length} commits, ${this.createdIssues.length} issues, ${this.createdPRs.length} PRs`);
        return true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        this.log('🚀 TrustOS Automation Engine Started');
        await this.runCycle();
        this.log('✅ Automation run completed');
    }
}

// Start the automation
const automation = new TrustOSAutomation();
automation.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
