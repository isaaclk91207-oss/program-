export declare const config: {
    port: number;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptSaltRounds: number;
    wialonBaseUrl: string;
    wialonToken: string;
    cronSchedule: string;
    corsOrigin: string;
};
export declare const DEPARTMENTS: readonly ["Executive", "Finance", "HR", "Operations", "Marketing", "IT", "Legal"];
export declare const CERT_LEVELS: readonly string[];
export declare const PASS_MARKS: Record<string, number>;
export declare const DEFAULT_WEIGHTS: {
    written: number;
    practical: number;
    operational: number;
    feedback: number;
};
export declare const PRACTICAL_CRITERIA: {
    key: string;
    label: string;
    weight: number;
}[];
export declare const OPERATIONAL_CRITERIA: {
    key: string;
    label: string;
    weight: number;
}[];
export declare const TAG_CATEGORIES: {
    negative: {
        id: string;
        label: string;
    }[];
    positive: {
        id: string;
        label: string;
    }[];
};
//# sourceMappingURL=index.d.ts.map