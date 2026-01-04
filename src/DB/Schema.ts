// src/db/schema.ts

export const TABLES = {
    // ========== a 库（Team 业务库） ==========
    a: {
        // ---- Team订单管理 ----
        TeamOrder: {
            table: "TeamOrder",
            insertable: ["Email","TeamID","TeamState","TeamCard","AddTime","ExyTime",] as const,
            required: ["Email","TeamID","TeamState","TeamCard","AddTime","ExyTime",] as const,
        },

        // ---- Team卡密管理 ----
        PlucCode: {
            table: "PlucCode",
            insertable: ["Card","NumTime","UseState","UseTime",] as const,
            required: ["Card","NumTime","UseState",] as const,
        },

        // ---- Team团队管理 ----
        TeamMgmt: {
            table: "TeamMgmt",
            insertable: ["TeamEmail","TeamID","TeamToken","TeamState","TeamNum","NumTime","AddTime",] as const,
            required: ["TeamEmail","TeamID","TeamToken","TeamState","TeamNum","NumTime",] as const,
        },
    },
    // ========== 预留：b / c / d / e ==========
    b: {},
    c: {},
    d: {},
    e: {},
} as const;
