export class DataPipeline {
    private pipeline: any[];
    
    constructor() {
        this.pipeline = [];
    }
    
    addStage(stage: any): void {
        this.pipeline.push(stage);
    }
    
    async process(data: any): Promise<any> {
        let result = data;
        for (const stage of this.pipeline) {
            result = await stage.process(result);
        }
        return result;
    }
}