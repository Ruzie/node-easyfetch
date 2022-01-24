/* eslint-disable no-param-reassign */
import fetch from "node-fetch";
import FormData from "form-data";
import { URL } from "url";
import { METHODS } from "http";

export default class Request {
    constructor(options) {
        if (!options.url) {
            throw new Error("In options param URL argument is required.");
        }
        this.url = new URL(options.url);
        this.method = options?.method ?? null ? options.method?.toUpperCase() : "GET"; // If there;s no method provided use default "GET" method
        if (!METHODS.includes(options?.method)) {
            throw new TypeError(`Provided method: ${this.method} doesn't exists.`);
        }
        this.headers = options?.headers ?? {};
        this.body = options?.body ?? null;
        this.redirectCount = options?.redirects ?? 20;
        this.agent = options?.agent ?? null;
        this.noResultData = options?.noResultData ?? false;
    }

    async handleRequest() {
        const response = await fetch(this.url?.toString(), {
            method: this.method,
            headers: this.headers,
            body: this.body,
            follow: this.redirectCount,
            agent: this.agent,
        });

        let raw = null;
        if (!this.noResultData) raw = Buffer.from(await response?.arrayBuffer());
        const headers = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const [header, value] of response.headers.entries()) {
            headers[header] = value;
        }

        const res = {
            status: response.status,
            statusText: response.statusText,
            headers,
            url: response?.url ?? null,
            redirected: response.redirected,
            ok: response.ok,
            raw,

            get text() {
                if (this.noResultData) return null;
                return raw.toString();
            },
            get body() {
                if (this.noResultData) return null;
                if (/application\/json/gi.test(headers["content-type"])) {
                    try {
                        return JSON.parse(raw?.toString());
                    } catch {
                        return raw?.toString();
                    }
                } else {
                    return raw;
                }
            },
        };
        if (!response.ok) {
            throw new RangeError(`Got: ${res.status} ${res.statusText}`);
        }
        return res;
    }

    then(resolver, rejector) {
        return this.handleRequest()
        .then(resolver, rejector);
    }

    catch(rejector) {
        return this
        .then(null, rejector);
    }

    end(cb) {
        return this.then(
            (response) => (cb ? cb(null, response) : response),
            (err) => (cb ? cb(err, err.status ? err : null) : err),
        );
    }

    query(queryOrName, value) {
        if (typeof queryOrName === "object") {
            // eslint-disable-next-line no-restricted-syntax
            for (const [param, val] of Object.entries(queryOrName)) {
                this.url.searchParams.append(param, val);
            }
        } else if (typeof queryOrName === "string" && value) {
            this.url.searchParams.append(queryOrName, value);
        } else {
            throw new TypeError("The query argument must be an object either a field.");
        }
        return this;
    }

    set(headersOrName, value) {
        if (typeof headersOrName === "object") {
            // eslint-disable-next-line no-restricted-syntax
            for (const [header, val] of Object.entries(headersOrName)) {
                this.headers[header] = val;
            }
        } else if (typeof headersOrName === "string" && value) {
            this.headers[headersOrName] = value;
        } else {
            throw new TypeError("The header argument must be an object either a field.");
        }
        return this;
    }

    attach(...args) {
        if (!this.body || !(this.body instanceof FormData)) this.body = new FormData();
        if (typeof args[0] === "object") {
            // eslint-disable-next-line no-restricted-syntax
            for (const [key, val] of Object.entries(args[0])) {
                this.attach(key, val);
            }
        } else {
            this.body.append(...args);
        }
        this.set(this.body.getHeaders());
        this.set("content-length", this.body.getLengthSync()); // Body can't be undefined, as if there's no instance it will create the form body
        return this;
    }

    send(body, raw = false) {
        if (body instanceof FormData) raw = true;
        if (!raw && body !== null && typeof body === "object") {
            const header = this.headers["content-type"];
            if (header) {
                if (/application\/json/gi.test(header)) body = JSON.stringify(body);
            } else {
                this.set("content-type", "application/json");
                body = JSON.stringify(body);
            }
        }
        this.body = body;
        return this;
    }

    redirects(amount) {
        if (Number.isNaN(amount)) {
            throw new TypeError("Amount argument must be a number.");
        }
        this.redirectCount = Number(amount);
        return this;
    }

    agent(name) {
        this.agent = name;
        return this;
    }
}

(() => {
    // eslint-disable-next-line no-restricted-syntax
    for (const method of METHODS) {
        if (!/^[A-Z$_]+$/gi.test(method)) return null;
        Request[method.toLowerCase()] = (url, options) => new Request({ url, method, ...options });
    }
    return null;
})();
