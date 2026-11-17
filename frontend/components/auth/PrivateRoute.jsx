"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children }) => {
  const { token, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth has finished loading from localStorage
    if (isInitialized && !token) {
      router.replace("/admin/");
    }
  }, [token, isInitialized, router]);

  // While checking localStorage, show nothing (or a loading spinner) to prevent flashing
  if (!isInitialized) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If initialization is done and there's no token, don't render children
  if (!token) {
    return null;
  }

  return children;
};

export default PrivateRoute;