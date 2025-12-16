export namespace main {
	
	export class TOCItem {
	    id: string;
	    text: string;
	    level: number;
	
	    static createFrom(source: any = {}) {
	        return new TOCItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.text = source["text"];
	        this.level = source["level"];
	    }
	}
	export class RenderResult {
	    path: string;
	    html: string;
	    toc: TOCItem[];
	
	    static createFrom(source: any = {}) {
	        return new RenderResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.html = source["html"];
	        this.toc = this.convertValues(source["toc"], TOCItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

