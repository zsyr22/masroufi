import { z } from "zod";
export const storeSchema=z.object({name:z.string().trim().min(1).max(100),defaultChannel:z.enum(["online","physical"]),website:z.string().trim().max(200).optional(),notes:z.string().trim().max(300).optional(),favorite:z.boolean()});
