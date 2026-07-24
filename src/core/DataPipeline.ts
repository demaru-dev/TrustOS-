export class DataPipeline {
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
        console.log(`📊 Adding stage: ${stage.name}`);
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
                console.error(`❌ Stage ${stage.name} failed: ${error.message}`);
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
}