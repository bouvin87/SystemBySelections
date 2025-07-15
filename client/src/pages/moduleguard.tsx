import { useEffect, useState } from "react";

export function ModuleGuard({ module, children }: { module: string; children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/access/${module}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          setAllowed(true);
        } else {
          const json = await res.json();
          if (json?.redirect) {
            window.location.href = json.redirect;
          }
        }
      } catch (err) {
        console.error("Module check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [module]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Kontrollerar åtkomst...</p>
        </div>
      </div>
    );
  }

  return allowed ? children : null;
}
