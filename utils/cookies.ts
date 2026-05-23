import { Response } from "express";

export const clearAuthCookies=(res:Response)=>{
  res.clearCookie("access_token",{
    httpOnly:true,
    secure:true,
    sameSite:"none"
  });

  res.clearCookie("refresh_token",{
    httpOnly:true,
    secure:true,
    sameSite:"none"
  });
};