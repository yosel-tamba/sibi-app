"use client";

import { useEffect } from "react";

interface GoogleLoginButtonProps {
  onSuccess: (response: any) => void;
}

export default function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: "563359945454-im6135gmgqa93pi0225t1amtr7bnstf4.apps.googleusercontent.com",
        callback: onSuccess,
      });

      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    };
  }, [onSuccess]);

  return (
    <div className="mt-6">
      <div className="flex justify-center items-center">
        <div id="googleBtn"></div>
      </div>
    </div>
  );
}