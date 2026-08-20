const jwtSecret: string = (() => {
    const value = process.env.JWT_SECRET;

    if (!value) {
        throw new Error("JWT_SECRET is not defined");
    }

    return value;
})();

export { jwtSecret };