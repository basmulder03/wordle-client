export const storage = {
    get<T>(key: string, fallback: T): T {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    },
    set<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
};