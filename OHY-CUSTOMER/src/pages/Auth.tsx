import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginTab from "@/components/auth/LoginTab";
import RegisterTab from "@/components/auth/RegisterTab";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl === "register" || tabFromUrl === "login" ? tabFromUrl : "login";

  const handleTabChange = (value: string) => {
    setSearchParams(value === "login" ? {} : { tab: value }, { replace: true });
  };

  useEffect(() => {
    document.title = "Login | OHY Events";
    const desc = "Login or register to book and create events on OHY.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header solid />
      <main className="flex-1 flex items-center justify-center px-4 pt-40 pb-16 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-xl p-8 rounded-3xl shadow-glow">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 rounded-full bg-muted/60 p-1">
              <TabsTrigger value="login" className="rounded-full">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginTab />
            </TabsContent>

            <TabsContent value="register">
              <RegisterTab onRegistrationSuccess={() => handleTabChange("login")} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
