class APIGateway {
    constructor() {
        this.routes = new Map();
        this.middleware = [];
    }
    
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }
    
    use(middleware) {
        this.middleware.push(middleware);
    }
    
    async handle(request) {
        const handler = this.routes.get(request.path);
        if (handler) {
            return await handler(request);
        }
        return { status: 404, body: 'Not Found' };
    }
}