import "server-only";

import { ApiError } from "./auth";

export function assertQuery(error: { message: string } | null, message = "数据库操作失败") {
  if (error) throw new ApiError(500, `${message}：${error.message}`);
}
