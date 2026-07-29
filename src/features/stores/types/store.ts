export type PurchaseChannel = "online" | "physical";
export type Store = { id:string; name:string; default_channel:PurchaseChannel; website:string|null; notes:string|null; is_favorite:boolean; is_active:boolean };
