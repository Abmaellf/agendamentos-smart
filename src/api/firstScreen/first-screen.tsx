import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

export function FirstScreen() {
  const [cookies] = useCookies(["jwt"]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // pequeno delay para garantir que os cookies foram carregados
    const timer = setTimeout(() => {
      if (!cookies.jwt) {
        navigate("/sign-in");
      } else {
        navigate("/agendamento");
      }
      setLoading(false);
    }, 1000); // 100ms geralmente resolve

    return () => clearTimeout(timer);
  }, [cookies, navigate]);

  if (loading) {
    return <Loader2Icon className="animate-spin w-6 h-6" />;
  }

  return null;
}