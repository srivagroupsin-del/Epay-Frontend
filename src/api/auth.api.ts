import { http } from "../base_api/base_api";

export const loginUser = async (data: any) => {
    return await http("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const registerUser = async (data: any) => {
    return await http("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
};
