import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { requestWithSession } from "@/lib/session-client";

export function FirstScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    requestWithSession({ url: '/auth/me', method: 'GET' })
      .then(() => {
        if (active) {
          navigate('/appointments', { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          navigate('/sign-in', { replace: true });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <Loader2Icon className="animate-spin w-6 h-6" />;
  }

  return null;
}
