global.I = new Proxy({}, {
    get(target: {}, p: string | symbol, receiver: any): any {
        const native = (global as any)[p];

        if (native === undefined) {
            throw Error(`'${p.toString()}' is not defined in global scope.`);
        }

        return (...args: any[]) => {
            return new Promise((resolve) => {
                setImmediate(() => {
                    const result = native(...args);
                    resolve(result);
                });
            });
        };
    }
});
