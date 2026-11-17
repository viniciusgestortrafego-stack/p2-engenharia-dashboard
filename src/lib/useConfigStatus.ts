"use client";

import { useEffect, useState } from "react";

export interface ConfigStatus {
  adAccountId: string;
  instagramAccountId: string;
  wooStoreUrl: string;
  hasMeta: boolean;
  hasInstagram: boolean;
  hasWoo: boolean;
}

const emptyStatus: ConfigStatus = {
  adAccountId: "",
  instagramAccountId: "",
  wooStoreUrl: "",
  hasMeta: false,
  hasInstagram: false,
  hasWoo: false,
};

export function useConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus>(emptyStatus);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => setStatus({ ...emptyStatus, ...data }))
      .catch(() => setStatus(emptyStatus))
      .finally(() => setLoaded(true));
  }, []);

  return { status, loaded };
}
