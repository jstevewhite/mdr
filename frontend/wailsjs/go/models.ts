export namespace main {
	
	export class RenderResult {
	    path: string;
	    html: string;
	
	    static createFrom(source: any = {}) {
	        return new RenderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.html = source["html"];
	    }
	}

}

