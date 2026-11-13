// Values that have no database table yet. Replace when auth and Bio page
// settings are implemented.

import type { BioPageStatus, BioProfile } from "@/lib/types";

/** Shown in the sidebar until auth exists (then: the signed-in user). */
export const currentUser = {
  name: "Quyền",
  role: "Quản trị viên",
};

export const bioPageStatus: BioPageStatus = "PUBLIC";

export const bioProfile: BioProfile = {
  name: "Tủ đồ của nàng",
  tagline: "Deal thời trang và mẹ bé, cập nhật mỗi ngày",
  avatarUrl: null,
};
