import type {
  AdoptTemplateResponse,
  ProtocolTemplate,
  ProtocolTemplateListItem,
} from "@protocols/domain";

import { request } from "./core";

export const protocolTemplates = {
  list: (params?: { category?: string; featured_only?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.featured_only) searchParams.set("featured_only", "true");
    const qs = searchParams.toString();
    return request<ProtocolTemplateListItem[]>(
      `/api/v1/protocol-templates${qs ? `?${qs}` : ""}`
    );
  },

  get: (id: string) =>
    request<ProtocolTemplate>(`/api/v1/protocol-templates/${id}`),

  adopt: (id: string) =>
    request<AdoptTemplateResponse>(`/api/v1/protocol-templates/${id}/adopt`, {
      method: "POST",
    }),
};
